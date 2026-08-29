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
# `push` sai da lista geral: em JS/TS `.push(` é, na esmagadora maioria,
# acumulador LOCAL (`const chunks = []; chunks.push(c)`), que não é comando
# no sentido de CQS. Fica coberto abaixo, exigindo receptor qualificado
# (`this.x.push(`, `store.items.push(`) — aí sim é estado que sobrevive.
ESCRITA = (r"\.(set|delete|save|insert|update|remove|write|add|create|del)\("
           r"|(?:this|\w+)\.\w+\.push\("
           r"|_cache_set|_cache_delete|INSERT |UPDATE |DELETE |\.commit\("
           r"|localStorage\.setItem|sessionStorage\.setItem")


def linhas_add(path, base):
    """Linhas adicionadas pelo diff. None = sem contexto git (fora de repo, base
    inexistente, arquivo untracked): quem chama decide o fallback. Conjunto vazio
    e resposta CONFIAVEL: o diff so remove linhas nesse arquivo, e os eixos por
    linha devem ficar em silencio, nao varrer o legado (contratos.js do IMC-1717:
    diff de remocao de Pusher acusava flag de window de 2019)."""
    try:
        r1 = subprocess.run(["git", "diff", "-U0", base + "...HEAD", "--", path],
                            capture_output=True, timeout=30)
        r2 = subprocess.run(["git", "diff", "-U0", "HEAD", "--", path],
                            capture_output=True, timeout=30)
        if r1.returncode != 0 and r2.returncode != 0:
            return None
        d = "\n".join(r.stdout.decode("utf-8", "replace")
                      for r in (r1, r2) if r.returncode == 0)
        adds = {l[1:] for l in d.split("\n") if l.startswith("+") and not l.startswith("+++")}
        if adds:
            return adds
        # Diff vazio tambem sai para arquivo untracked, que e 100% linha nova.
        r3 = subprocess.run(["git", "ls-files", "--others", "--exclude-standard",
                             "--", path], capture_output=True, timeout=30)
        if r3.returncode != 0 or r3.stdout.strip():
            return None
        return adds
    except Exception:
        return None


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


def eixo_cqs(path, L, ML, funcs, adds):
    for f in funcs:
        if not re.match("^" + PREFIXOS_QUERY, f["nome"], re.I):
            continue
        # FALHOU so pra funcao que o diff tocou (interseccao no fonte CRU,
        # porque adds guarda linhas cruas). Query legada com escrita em
        # arquivo de delecao pura nao e a entrega (IMC-1717: remocao de 9
        # linhas reprovada por getEndpoint* de 95 linhas intocado).
        # So linha DISTINTIVA conta como toque: um `}` adicionado em outra
        # funcao colide por texto com o `}` de qualquer funcao legada.
        tocada = any(
            l in adds and len(l.strip()) >= 4 and re.search(r"\w", l)
            for l in L[f["ini"]:f["fim"]]
        )
        if not tocada:
            continue
        corpo = "\n".join(ML[f["ini"]:f["fim"]])
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


# Propriedades de window cuja escrita e API nativa legitima. Handlers de evento
# (onerror, onmessage, onbeforeunload...) entram pelo padrao on<evento>, porque
# enumerar todos seria correr atras do DOM. Qualquer outro nome e estado custom
# pendurado no global.
ESCRITAS_NATIVAS_WINDOW = {"location", "name", "status", "opener"}


def escrita_em_window(mascarada, crua):
    """Nome da propriedade custom atribuida em `window` na linha, ou None.
    Pura: linha entra, veredito sai. Decide sobre a linha MASCARADA (atribuicao
    dentro de string ou comentario nao acusa) e le o nome na crua, porque a
    mascara apaga o conteudo de `window['nome']` preservando colunas.
    So o primeiro nivel acusa: `window.location.href =` e escrita nativa, e o
    `window.x` de um `window.x.y =` ja foi acusado onde nasceu."""
    m = re.search(r"(?<![\w$.])window\s*(?:\.\s*(\w+)|\[\s*['\"][^'\"\]]*['\"]\s*\])\s*"
                  r"(?:[+\-*/%]?=|\|\|=|&&=|\?\?=)(?!=)", mascarada)
    if not m:
        return None
    nome = m.group(1)
    if nome is None:
        lit = re.search(r"\[\s*['\"]([^'\"]+)['\"]", crua[m.start():])
        nome = lit.group(1) if lit else "?"
    if nome in ESCRITAS_NATIVAS_WINDOW or re.fullmatch(r"on[a-z]+", nome):
        return None
    return nome


def eixo_estado(path, L, ML, ext, adds):
    src = "\n".join(ML)
    if ext == "py":
        for m in re.finditer(r"^\s*global\s+([\w, ]+)", src, re.M):
            atencao(f"estado global mutavel: {m.group(1).strip()}",
                    f"{path}:{src[:m.start()].count(chr(10))+1}")
    if ext == "ts":
        # flag pendurada em window (cloud 63a475c: __gerarremessaPjbank...)
        for i, crua in enumerate(L):
            if crua not in adds:
                continue
            nome = escrita_em_window(ML[i], crua)
            if nome:
                atencao(f"estado global mutavel em window.{nome} "
                        f"(encapsule no modulo/classe dona)", f"{path}:{i+1}")
    # reatribuicao no-op depois de mutar (perm["apps"] = apps apos apps.append)
    for i in range(len(ML) - 1):
        m = re.search(r"(\w+)\.(append|push)\(", ML[i])
        if not m:
            continue
        for j in range(i + 1, min(i + 6, len(ML))):
            if re.search(r"\[[^\]]+\]\s*=\s*" + re.escape(m.group(1)) + r"\s*$", ML[j]):
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
def padroes_conhecidos(path, L, codigo, adds):
    # Zera linha que e so comentario ou literal, senao o detector acusa a propria
    # documentacao. Ja aconteceu duas vezes: a tabela da SKILL.md que descreve o
    # detector de debug reprovou o proprio arquivo, e depois o comentario que
    # explicava a correcao. Falar de uma coisa nao e faze-la.
    src = "\n".join(l if i in codigo else "" for i, l in enumerate(L))

    def na_entrega(m):
        # Achado so vale ancorado em linha que o diff adicionou. Legado vizinho
        # de um edit de 1 linha nao e a entrega (IMC-1717: troca de initJs num
        # .phtml reprovada por `echo` cru de anos atras no mesmo arquivo).
        return L[src[:m.start()].count("\n")] in adds

    # 1. listener de postMessage sem checar origem (new-home #3236)
    for m in re.finditer(r"addEventListener\(\s*['\"]message['\"]", src):
        if not na_entrega(m):
            continue
        jan = src[max(0, m.start() - 900):m.start() + 900]
        if "origin" not in jan:
            falhou("listener de `message` sem checar `event.origin`",
                   f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 2. postMessage com targetOrigin curinga
    for m in re.finditer(r"postMessage\([^;]{0,300}?,\s*['\"]\*['\"]\s*\)", src, re.S):
        if not na_entrega(m):
            continue
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
        # O handler pode ser legado com so o corpo mexido: basta 1 linha da
        # janela ter vindo do diff.
        if not any(l in adds for l in L[ini:ini + 20]):
            continue
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
        if not na_entrega(m):
            continue
        falhou("literal sensivel montado por `join` (isso engana o detector, "
               "nao corrige a causa)", f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 5. valor PHP interpolado dentro de literal JS (cloud #45028)
    for m in re.finditer(r"['\"]\s*<\?(php)?\s*echo", src):
        if not na_entrega(m):
            continue
        falhou("valor PHP dentro de literal JS por `echo` cru (use `json_encode`)",
               f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 6. jwt.decode sem verificacao de assinatura (echo-atende ATN-261)
    for m in re.finditer(r"jwt\.decode\(|jwtDecode\(|decode\(\s*token", src):
        if not na_entrega(m):
            continue
        jan = src[max(0, m.start() - 400):m.start() + 400]
        if not re.search(r"verify|jwks|JWKS|public_key|secret", jan):
            atencao("token decodificado sem verificar assinatura (`decode` nao valida nada)",
                    f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 7. multiplas fontes de verdade para allowlist (b2b/b2c SYSTEM_ACCESS_USERS)
    for m in re.finditer(r"^\s*([A-Z][A-Z0-9_]*(?:USERS|ALLOWLIST|WHITELIST|ADMINS))\s*=\s*[\[\(]",
                         src, re.M):
        if not na_entrega(m):
            continue
        atencao(f"allowlist hardcoded `{m.group(1)}`: garanta fonte unica e teste que falha "
                f"se divergir", f"{path}:{src[:m.start()].count(chr(10))+1}")

    # 8. flag escrita e nunca lida (public_internal_only)
    for m in re.finditer(r"\[['\"](\w{8,})['\"]\]\s*=\s*(True|true)", src):
        if not na_entrega(m):
            continue
        chave = m.group(1)
        try:
            r = subprocess.run(["git", "grep", "-c", chave], capture_output=True, timeout=30)
            ocor = sum(int(x.split(":")[-1]) for x in r.stdout.decode("utf-8", "replace").split("\n") if ":" in x)
            if ocor <= 1:
                falhou(f"flag `{chave}` escrita e nunca lida no repositorio",
                       f"{path}:{src[:m.start()].count(chr(10))+1}")
        except Exception:
            pass


LIMIAR_IRMAOS = 0.6       # razao de linhas identicas que caracteriza par irmao
FOLGA_IRMAOS = 0.02       # gemeos pre-existentes so falham se o diff subiu alem disso
LINHAS_FOLGA_IRMAOS = 2   # em arquivo pequeno 1 linha ja move a razao alem de 2pp:
                          # a folga real e o maior entre 2pp e 2 linhas comuns liquidas


def linhas_comparaveis(fonte):
    """Linhas com conteudo suficiente para comparar irmaos. Pura: fonte entra,
    conjunto sai."""
    return {l.strip() for l in fonte.split("\n") if len(l.strip()) > 15}


def similaridade_irmaos(linhas_a, linhas_b):
    """Razao de linhas identicas entre dois arquivos (0 a 1). Pura. Arquivo com
    menos de 20 linhas comparaveis nao caracteriza par."""
    if len(linhas_a) < 20 or len(linhas_b) < 20:
        return 0.0
    return len(linhas_a & linhas_b) / min(len(linhas_a), len(linhas_b))


CACHE_BASE_IRMAOS = {}


def linhas_na_base(base, path):
    """Linhas comparaveis do arquivo na base do diff. None = nao existia la
    (arquivo novo, ou sem contexto git). Chamado so para pares que ja passaram
    do limiar no head, para nao pagar um git show por par do diff."""
    chave = (base, path)
    if chave in CACHE_BASE_IRMAOS:
        return CACHE_BASE_IRMAOS[chave]
    rel = os.path.relpath(path).replace("\\", "/")
    try:
        r = subprocess.run(["git", "show", f"{base}:./{rel}"],
                           capture_output=True, timeout=30)
        fonte = r.stdout.decode("utf-8", "replace") if r.returncode == 0 else None
    except Exception:
        fonte = None
    CACHE_BASE_IRMAOS[chave] = None if fonte is None else linhas_comparaveis(fonte)
    return CACHE_BASE_IRMAOS[chave]


def avaliar_par_irmaos(base, item_a, item_b):
    """O par so falha quando o diff INTRODUZ ou AUMENTA a semelhanca. Gemeos
    pre-existentes por arquitetura (piatendimento/seguros) recebem patch paralelo
    legitimo com similaridade estavel, e isso nao e o incidente do new-home."""
    (pa, la), (pb, lb) = item_a, item_b
    agora = similaridade_irmaos(la, lb)
    if agora < LIMIAR_IRMAOS:
        return
    ref = f"{os.path.basename(pa)} <-> {os.path.basename(pb)}"
    na_base_a, na_base_b = linhas_na_base(base, pa), linhas_na_base(base, pb)
    if na_base_a is None or na_base_b is None:
        falhou(f"{int(agora*100)}% de linhas identicas entre dois arquivos do mesmo diff "
               f"(similaridade introduzida): extraia o componente comum", ref)
        return
    antes = similaridade_irmaos(na_base_a, na_base_b)
    folga = max(FOLGA_IRMAOS, LINHAS_FOLGA_IRMAOS / min(len(la), len(lb)))
    if agora <= antes + folga:
        return
    falhou(f"similaridade entre arquivos do mesmo diff aumentou de {int(antes*100)}% "
           f"para {int(agora*100)}%: extraia o componente comum", ref)


def duplicacao_entre_arquivos(paths, base):
    """Arquivos irmaos quase identicos no mesmo diff (new-home: 2 paginas iguais)."""
    conteudo = {}
    for p in paths:
        if not os.path.isfile(p):
            continue
        try:
            linhas = linhas_comparaveis(open(p, encoding="utf-8", errors="replace").read())
        except Exception:
            continue
        if len(linhas) >= 20:
            conteudo[p] = linhas
    itens = list(conteudo.items())
    for a in range(len(itens)):
        for b in range(a + 1, len(itens)):
            avaliar_par_irmaos(base, itens[a], itens[b])


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
        # Sem contexto git (arquivo novo, fora de repo, git indisponivel) os eixos
        # por linha se calariam. Diff confiavel que so remove NAO cai aqui.
        if adds is None:
            adds = set(L)
        adds = {L[i] for i in codigo if L[i] in adds}

        eixo_forma(path, ML, funcs)
        eixo_cqs(path, L, ML, funcs, adds)
        eixo_mutacao_param(path, ML, funcs)
        eixo_idempotencia(path, ML)
        eixo_bigO(path, ML)
        eixo_nomes(path, L, adds)

        if ling == "python":
            eixo_estado(path, L, ML, "py", adds)
        elif ling in ("typescript", "javascript"):
            eixo_estado(path, L, ML, "ts", adds)
            eixo_tipos(path, L, adds)
            eixo_cast(path, L, adds)
            eixo_await_sequencial(path, ML, funcs)
            eixo_exports(path, L, adds)

        padroes_conhecidos(path, L, codigo, adds)

    duplicacao_entre_arquivos(paths, base)

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
