# -*- coding: utf-8 -*-
"""Fase de desenho do gate verificar-entrega.

check.sh cobre verificacao (runtime, teste desligado, drift, tamanho, sobras).
Este script cobre DESENHO: CQS, estado mutavel, Big-O, tipos, nomeacao, e os
padroes especificos que ja causaram incidente nesta organizacao.

Uso: python desenho.py <arquivo> [<arquivo> ...]
Saida: linhas "FALHOU"/"ATENCAO"/"ok". Exit 1 se houver FALHOU.
"""
import re
import sys
import os
import subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lang  # noqa: E402  deteccao de linguagem + parser por linguagem

FAIL, WARN = [], []


def falhou(msg, ref=""):
    FAIL.append((msg, ref))


def atencao(msg, ref=""):
    WARN.append((msg, ref))


# ---------------------------------------------------------------- helpers
NOMES_CURTOS_OK = {"i", "j", "k", "n", "x", "y", "id", "db", "ok", "fn", "cb",
                   "el", "ev", "kv", "_", "c", "e", "t", "q", "on", "up", "to", "df"}

PREFIXOS_QUERY = r"(get|list|find|fetch|is|has|can|should|read|load|search|resolve|count|select)"
ESCRITA = (r"\.(set|delete|save|insert|update|remove|write|push|add|create|del)\("
           r"|_cache_set|_cache_delete|INSERT |UPDATE |DELETE |\.commit\("
           r"|localStorage\.setItem|sessionStorage\.setItem")


def linhas_add(path, base):
    """Linhas adicionadas pelo diff. Vazio significa arquivo novo ou sem base."""
    try:
        out = subprocess.run(["git", "diff", "-U0", base + "...HEAD", "--", path],
                             capture_output=True, timeout=30)
        d = out.stdout.decode("utf-8", "replace")
        out2 = subprocess.run(["git", "diff", "-U0", "HEAD", "--", path],
                              capture_output=True, timeout=30)
        d += out2.stdout.decode("utf-8", "replace")
        return {l[1:] for l in d.split("\n") if l.startswith("+") and not l.startswith("+++")}
    except Exception:
        return set()


# Extracao de funcao mora em lang.py: deteccao de linguagem primeiro, depois o
# melhor parser que existir (ast do Python, compilador do TypeScript do projeto,
# tokenizador com mascara de literais como ultimo recurso).


# ---------------------------------------------------------------- eixos gerais
def eixo_forma(path, mascarado_L, funcs):
    """Tamanho, aninhamento e parametros vem do analisador de `lang`, nao de
    contagem de indentacao. Indentacao conta continuacao de linha, dict multilinha
    e chamada encadeada como se fossem aninhamento, e inflava o numero."""
    for f in funcs:
        corpo = mascarado_L[f["ini"]:f["fim"]]
        n = len([x for x in corpo if x.strip()])
        if n > 20:
            atencao(f"funcao com {n} linhas (limite 20)", f"{path}:{f['ini']+1} {f['nome']}")
        if f["nest"] >= 3:
            atencao(f"aninhamento {f['nest']} (limite 2, extraia funcao)",
                    f"{path}:{f['ini']+1} {f['nome']}")
        if f["params"] > 3:
            atencao(f"{f['params']} parametros (limite 3, use objeto)",
                    f"{path}:{f['ini']+1} {f['nome']}")


def eixo_cqs(path, L, funcs):
    for f in funcs:
        if not re.match("^" + PREFIXOS_QUERY, f["nome"], re.I):
            continue
        corpo = "\n".join(L[f["ini"]:f["fim"]])
        achou = re.findall(ESCRITA, corpo)
        if achou:
            falhou(f"CQS: nome de query executando escrita ({len(achou)}x)",
                   f"{path}:{f['ini']+1} {f['nome']}")


def eixo_bigO(path, L):
    src = "\n".join(L)
    for m in re.finditer(r"(for|while)\s*[\(:][^\n]*\n((?:[^\n]*\n){0,25})", src):
        if re.search(r"\bawait |\.execute\(|\.query\(|http\.request|fetch\(", m.group(2)):
            ln = src[:m.start()].count("\n") + 1
            atencao("chamada de I/O dentro de laco (N+1, busque em lote)", f"{path}:{ln}")
            break


def eixo_estado(path, L, ext):
    src = "\n".join(L)
    if ext == "py":
        for m in re.finditer(r"^\s*global\s+([\w, ]+)", src, re.M):
            atencao(f"estado global mutavel: {m.group(1).strip()}",
                    f"{path}:{src[:m.start()].count(chr(10))+1}")
    # reatribuicao no-op depois de mutar (perm["apps"] = apps apos apps.append)
    for i in range(len(L) - 1):
        m = re.search(r"(\w+)\.(append|push)\(", L[i])
        if not m:
            continue
        for j in range(i + 1, min(i + 6, len(L))):
            if re.search(r"\[[^\]]+\]\s*=\s*" + re.escape(m.group(1)) + r"\s*$", L[j]):
                atencao("reatribuicao no-op: o objeto ja foi mutado in place", f"{path}:{j+1}")


def eh_comentario(l):
    t = l.strip()
    return t.startswith(("//", "*", "/*", "#", "<!--"))


def eixo_tipos(path, L, adds):
    tipado = path.endswith((".ts", ".tsx"))
    for i, l in enumerate(L):
        if l not in adds or eh_comentario(l):
            continue
        if re.search(r":\s*any\b|as any", l):
            falhou("tipo `any` (regra dura do projeto)", f"{path}:{i+1}")
        # `!` de non-null so existe em TS. Em JS e prosa: "janela baixa!)".
        if tipado and re.search(r"[A-Za-z0-9_$]!(?=[.\)\],;])", l):
            falhou("non-null assertion `!` (trate o caso undefined)", f"{path}:{i+1}")


def eixo_cast(path, L, adds):
    """`as X` forcado. `as const` e `as unknown` sao legitimos."""
    for i, l in enumerate(L):
        if l not in adds or eh_comentario(l):
            continue
        for m in re.finditer(r"\bas\s+([A-Z][A-Za-z0-9_<>\[\]]*)", l):
            if m.group(1) in ("Error", "const", "unknown"):
                continue
            atencao(f"cast forcado `as {m.group(1)}` (escreva um type guard)", f"{path}:{i+1}")


def eixo_await_sequencial(path, L, funcs):
    """3+ awaits em sequencia sem um usar o resultado do outro cabem em Promise.all."""
    for f in funcs:
        corpo = L[f["ini"]:f["fim"]]
        bloco = []
        for idx, l in enumerate(corpo):
            m = re.match(r"\s*(?:const|let|var)\s+(\w+)\s*=\s*await\s+(.+)", l)
            if m:
                bloco.append((idx, m.group(1), m.group(2)))
            elif l.strip() and not eh_comentario(l):
                if len(bloco) >= 3:
                    nomes = [b[1] for b in bloco]
                    # independente = nenhuma chamada cita variavel de uma anterior
                    dep = any(any(re.search(r"\b" + re.escape(n) + r"\b", ch) for n in nomes[:k])
                              for k, (_, _, ch) in enumerate(bloco))
                    if not dep:
                        atencao(f"{len(bloco)} awaits independentes em sequencia "
                                f"(use Promise.all)", f"{path}:{f['ini']+bloco[0][0]+1}")
                bloco = []


def eixo_exports(path, L, adds):
    for i, l in enumerate(L):
        if l not in adds or eh_comentario(l):
            continue
        if re.match(r"\s*export\s+default\b", l) and not re.search(r"pages?/|app/|layout|route", path):
            atencao("export default (prefira named export)", f"{path}:{i+1}")
        if re.search(r"from\s+['\"][^'\"]*/index['\"]|from\s+['\"]\.{1,2}['\"]", l):
            atencao("import de barrel file (importe do arquivo fonte)", f"{path}:{i+1}")


def eixo_mutacao_param(path, L, funcs):
    """Mutar parametro recebido quebra a expectativa do chamador."""
    for f in funcs:
        params = f.get("nomes_params") or []
        if not params:
            continue
        for idx, l in enumerate(L[f["ini"] + 1:f["fim"]], start=f["ini"] + 1):
            if eh_comentario(l):
                continue
            for p in params:
                if re.search(r"\b" + re.escape(p) + r"\.(push|append|pop|shift|unshift|sort)\(", l) \
                   or re.search(r"\b" + re.escape(p) + r"(\.\w+|\[[^\]]+\])\s*=(?!=)", l):
                    atencao(f"mutacao do parametro `{p}` (devolva um novo valor)", f"{path}:{idx+1}")
                    break


def eixo_idempotencia(path, L):
    """Handler de escrita sem nenhuma guarda contra reenvio. Aviso, nao falha:
    nem toda escrita precisa, mas quem decide isso e uma pessoa."""
    src = "\n".join(L)
    for m in re.finditer(r"(?:app|router|r)\.(?:post|put)\(", src):
        ini = src[:m.start()].count("\n")
        trecho = "\n".join(L[ini:ini + 60])
        if not re.search(r"insert|create|\.save\(|POST", trecho, re.I):
            continue
        if re.search(r"idempot|Idempotency-Key|ON CONFLICT|upsert|unique|tryAcquire|lock",
                     trecho, re.I):
            continue
        atencao("handler de escrita sem guarda de reenvio (chave de idempotencia, "
                "constraint unica ou lock)", f"{path}:{ini+1}")
        break


def eixo_nomes(path, L, adds):
    for i, l in enumerate(L):
        if l not in adds or eh_comentario(l):
            continue
        for m in re.finditer(r"\b(?:const|let|var|val)\s+([A-Za-z_$][A-Za-z0-9_$]?)\s*=", l):
            if m.group(1).lower() not in NOMES_CURTOS_OK:
                atencao(f"nome de 1 a 2 caracteres: `{m.group(1)}`", f"{path}:{i+1}")
        for m in re.finditer(r"=\s*(\d{2,})\s*[;,\n]", l):
            if m.group(1) not in ("10", "100", "200", "404", "500"):
                atencao(f"numero magico `{m.group(1)}` (extraia constante nomeada)", f"{path}:{i+1}")


# ---------------------------------------------------------------- padroes locais
# Cada um destes ja custou incidente nesta organizacao.
def padroes_conhecidos(path, L, codigo):
    # Zera linha que e so comentario ou literal, senao o detector acusa a propria
    # documentacao. Ja aconteceu duas vezes: a tabela da SKILL.md que descreve o
    # detector de debug reprovou o proprio arquivo, e depois o comentario que
    # explicava a correcao. Falar de uma coisa nao e faze-la.
    src = "\n".join(l if i in codigo else "" for i, l in enumerate(L))

    # 1. listener de postMessage sem checar origem (new-home #3236)
    for m in re.finditer(r"addEventListener\(\s*['\"]message['\"]", src):
        jan = src[max(0, m.start() - 900):m.start() + 900]
        if "origin" not in jan:
            falhou("listener de `message` sem checar `event.origin`",
                   f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 2. postMessage com targetOrigin curinga
    for m in re.finditer(r"postMessage\([^;]{0,300}?,\s*['\"]\*['\"]\s*\)", src, re.S):
        falhou("postMessage com targetOrigin `*` (fixe a origem)",
               f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 3. endpoint devolvendo o proprio token do chamador (new-home GET /token)
    #    Exige registro de rota + leitura do header authorization + resposta cujo CORPO
    #    carrega o token. Um 401 `{error: 'No token'}` nao conta: sem esse filtro todo
    #    middleware de auth vira falso positivo.
    rota = re.compile(r"(?:app|router|r)\.(?:get|post)\(|@(?:app|router)\.(?:get|post)\(")
    corpo_token = re.compile(r"(?:json|send|jsonify)\s*\(\s*\{\s*[^}]{0,80}\b(jwt|token|access_token)\b")
    for m in rota.finditer(src):
        ini = src[:m.start()].count(chr(10))
        trecho = "\n".join(L[ini:ini + 20])
        if not re.search(r"authorization", trecho, re.I):
            continue
        # Percorre TODAS as respostas do handler. A primeira costuma ser o 401
        # `{error: 'No token'}`, e parar nela esconderia o `{jwt}` logo abaixo.
        for achado in corpo_token.finditer(trecho):
            alvo = trecho[achado.start():achado.start() + 120]
            if re.search(r"\b(error|message|success|detail)\b", alvo):
                continue
            falhou("endpoint devolvendo o bearer do proprio chamador: transforma credential "
                   "de header em string legivel por qualquer JS da pagina", f"{path}:{ini+1}")
            break

    # 4. literal sensivel montado por join/concat para escapar de detector
    for m in re.finditer(r"\[\s*['\"](Bearer|Basic|Authorization|apikey|secret)['\"]\s*,"
                         r"[^\]]*\]\s*\.join\(", src, re.I):
        falhou("literal sensivel montado por `join` (isso engana o detector, "
               "nao corrige a causa)", f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 5. valor PHP interpolado dentro de literal JS (cloud #45028)
    for m in re.finditer(r"['\"]\s*<\?(php)?\s*echo", src):
        falhou("valor PHP dentro de literal JS por `echo` cru (use `json_encode`)",
               f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 6. jwt.decode sem verificacao de assinatura (echo-atende ATN-261)
    for m in re.finditer(r"jwt\.decode\(|jwtDecode\(|decode\(\s*token", src):
        jan = src[max(0, m.start() - 400):m.start() + 400]
        if not re.search(r"verify|jwks|JWKS|public_key|secret", jan):
            atencao("token decodificado sem verificar assinatura (`decode` nao valida nada)",
                    f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 7. multiplas fontes de verdade para allowlist (b2b/b2c SYSTEM_ACCESS_USERS)
    for m in re.finditer(r"^\s*([A-Z][A-Z0-9_]*(?:USERS|ALLOWLIST|WHITELIST|ADMINS))\s*=\s*[\[\(]",
                         src, re.M):
        atencao(f"allowlist hardcoded `{m.group(1)}`: garanta fonte unica e teste que falha "
                f"se divergir", f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 8. flag escrita e nunca lida (public_internal_only)
    for m in re.finditer(r"\[['\"](\w{8,})['\"]\]\s*=\s*(True|true)", src):
        chave = m.group(1)
        try:
            r = subprocess.run(["git", "grep", "-c", chave], capture_output=True, timeout=30)
            ocor = sum(int(x.split(":")[-1]) for x in r.stdout.decode("utf-8", "replace").split("\n") if ":" in x)
            if ocor <= 1:
                falhou(f"flag `{chave}` escrita e nunca lida no repositorio",
                       f"{path}:{src[:m.start()].count(chr(10))+1}")
        except Exception:
            pass


def duplicacao_entre_arquivos(paths):
    """Arquivos irmaos quase identicos no mesmo diff (new-home: 2 paginas iguais)."""
    conteudo = {}
    for p in paths:
        if not os.path.isfile(p):
            continue
        try:
            linhas = [l.strip() for l in open(p, encoding="utf-8", errors="replace")
                      if len(l.strip()) > 15]
        except Exception:
            continue
        if len(linhas) >= 20:
            conteudo[p] = set(linhas)
    itens = list(conteudo.items())
    for a in range(len(itens)):
        for b in range(a + 1, len(itens)):
            pa, sa = itens[a]
            pb, sb = itens[b]
            comum = len(sa & sb)
            razao = comum / min(len(sa), len(sb))
            if razao >= 0.6:
                falhou(f"{int(razao*100)}% de linhas identicas entre dois arquivos do mesmo "
                       f"diff: extraia o componente comum",
                       f"{os.path.basename(pa)} <-> {os.path.basename(pb)}")


# ---------------------------------------------------------------- main
def main():
    paths = [p for p in sys.argv[1:] if os.path.isfile(p)]
    if not paths:
        print("  ok      nenhum arquivo de codigo no diff")
        return 0

    base = os.environ.get("DESENHO_BASE", "origin/master")
    motores = {}
    for path in paths:
        try:
            fonte = open(path, encoding="utf-8", errors="replace").read()
        except Exception:
            continue

        # Passo 1: qual linguagem. Passo 2: melhor parser que existe pra ela.
        ling, motor, funcs, mascarado = lang.analisar(path, fonte)
        if ling in ("desconhecida", "html"):
            continue
        motores[path] = f"{ling}/{motor}"

        L = fonte.split("\n")
        ML = mascarado.split("\n")
        # Linha cujo conteudo sumiu na mascara era so comentario ou literal.
        # Os detectores que precisam do fonte cru (procuram texto dentro de string)
        # usam isso pra nao acusar a propria documentacao.
        codigo = {i for i, m in enumerate(ML) if m.strip()}

        adds = linhas_add(path, base)
        # Sem contexto git (arquivo novo, fora de repo, git indisponivel) o diff vem
        # vazio e os eixos por linha se calariam.
        if not adds:
            adds = set(L)
        adds = {L[i] for i in codigo if L[i] in adds}

        eixo_forma(path, ML, funcs)
        eixo_cqs(path, ML, funcs)
        eixo_mutacao_param(path, ML, funcs)
        eixo_idempotencia(path, ML)
        eixo_bigO(path, ML)
        eixo_nomes(path, L, adds)

        if ling == "python":
            eixo_estado(path, ML, "py")
        elif ling in ("typescript", "javascript"):
            eixo_estado(path, ML, "ts")
            eixo_tipos(path, L, adds)
            eixo_cast(path, L, adds)
            eixo_await_sequencial(path, ML, funcs)
            eixo_exports(path, L, adds)

        padroes_conhecidos(path, L, codigo)

    duplicacao_entre_arquivos(paths)

    for msg, ref in FAIL:
        print(f"  FALHOU  {msg}")
        if ref:
            print(f"            {ref}")
    vistos = set()
    for msg, ref in WARN:
        chave = msg.split("(")[0] + ref.split(":")[0]
        if chave in vistos:
            continue
        vistos.add(chave)
        print(f"  ATENCAO {msg}")
        if ref:
            print(f"            {ref}")
    if not FAIL and not WARN:
        print("  ok      desenho limpo nos eixos verificados")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
