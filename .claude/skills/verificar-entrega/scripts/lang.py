# -*- coding: utf-8 -*-
"""Deteccao de linguagem e extracao de funcoes com o melhor parser disponivel.

Ordem de decisao, sempre a mesma:

  1. Detectar a linguagem (extensao, depois shebang, depois conteudo).
  2. Escolher o motor mais preciso que existir para ela, nesta ordem:
       AST real  >  tokenizador com mascara de literais  >  nada
  3. Registrar QUAL motor rodou, para o relatorio nao mentir sobre precisao.

Por que nao contar chaves direto no fonte: chave dentro de string, de comentario,
de template literal ou de regex conta igual. Uma versao anterior deste script fazia
isso e reportou uma funcao de 4 linhas como tendo 60. O fallback aqui so conta chave
DEPOIS de mascarar todo literal com uma maquina de estados de caractere, que e o
minimo para a contagem significar alguma coisa.
"""
import ast
import json
import os
import re
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
TS_AST = os.path.join(AQUI, "ts_ast.js")

EXTENSOES = {
    ".py": "python", ".pyi": "python",
    ".ts": "typescript", ".tsx": "typescript",
    ".js": "javascript", ".jsx": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".php": "php", ".phtml": "php",
    ".go": "go", ".rs": "rust", ".rb": "ruby", ".java": "java",
}

SHEBANGS = [
    (re.compile(r"^#!.*\bpython[0-9.]*\b"), "python"),
    (re.compile(r"^#!.*\bnode\b"), "javascript"),
    (re.compile(r"^#!.*\bphp\b"), "php"),
]


def detectar_linguagem(path, src):
    """Extensao decide. Sem extensao conhecida, shebang. Sem shebang, conteudo."""
    ext = os.path.splitext(path)[1].lower()
    if ext in EXTENSOES:
        # .phtml e template: so e PHP se tiver tag de abertura.
        if ext == ".phtml" and "<?" not in src:
            return "html"
        return EXTENSOES[ext]

    primeira = src.split("\n", 1)[0] if src else ""
    for rx, ling in SHEBANGS:
        if rx.match(primeira):
            return ling

    if re.search(r"^\s*(def|class)\s+\w+.*:\s*$", src, re.M) and "{" not in src[:400]:
        return "python"
    if re.search(r"\b(function|const|let|=>)\b", src) and ";" in src:
        return "javascript"
    if "<?php" in src:
        return "php"
    return "desconhecida"


# ---------------------------------------------------------------- mascara
def mascarar_literais(src, ling):
    """Devolve o fonte com todo literal trocado por espaco, preservando linhas e
    colunas. Depois disso, contar chave passa a ser uma operacao sobre estrutura,
    nao sobre texto.

    Trata: comentario de linha e de bloco, aspas simples e duplas com escape,
    template literal com `${}` aninhado, literal de regex em JS, e heredoc/nowdoc
    em PHP."""
    out = list(src)
    i, n = 0, len(src)
    linha_js = ling in ("javascript", "typescript")
    com_linha = "#" if ling in ("python", "php", "ruby") else "//"

    def apaga(a, b):
        for k in range(a, min(b, n)):
            if out[k] != "\n":
                out[k] = " "

    # Para decidir se `/` abre regex ou e divisao: olha o ultimo caractere util.
    def ultimo_util(pos):
        k = pos - 1
        while k >= 0 and src[k] in " \t\r\n":
            k -= 1
        return src[k] if k >= 0 else ""

    while i < n:
        c = src[i]

        # comentario de bloco
        if src.startswith("/*", i) and ling != "python":
            fim = src.find("*/", i + 2)
            fim = n if fim == -1 else fim + 2
            apaga(i, fim); i = fim; continue

        # comentario de linha
        if src.startswith(com_linha, i) or (linha_js and src.startswith("//", i)) \
           or (ling == "php" and src.startswith("//", i)):
            fim = src.find("\n", i)
            fim = n if fim == -1 else fim
            apaga(i, fim); i = fim; continue

        # docstring / string tripla do Python
        if ling == "python" and (src.startswith('"""', i) or src.startswith("'''", i)):
            asp = src[i:i + 3]
            fim = src.find(asp, i + 3)
            fim = n if fim == -1 else fim + 3
            apaga(i, fim); i = fim; continue

        # heredoc / nowdoc do PHP
        if ling == "php" and src.startswith("<<<", i):
            m = re.match(r"<<<\s*['\"]?(\w+)['\"]?\r?\n", src[i:])
            if m:
                rotulo = m.group(1)
                fecha = re.search(r"^\s*" + re.escape(rotulo) + r"\b", src[i + m.end():], re.M)
                fim = i + m.end() + (fecha.end() if fecha else n)
                apaga(i, fim); i = min(fim, n); continue

        # template literal com ${} aninhado
        if linha_js and c == "`":
            j, prof = i + 1, 0
            while j < n:
                if src[j] == "\\":
                    j += 2; continue
                if src.startswith("${", j):
                    prof += 1; j += 2; continue
                if src[j] == "}" and prof:
                    prof -= 1; j += 1; continue
                if src[j] == "`" and not prof:
                    j += 1; break
                j += 1
            apaga(i + 1, j - 1); i = j; continue

        # aspas
        if c in "\"'":
            j = i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2; continue
                if src[j] == c or src[j] == "\n":
                    j += 1; break
                j += 1
            apaga(i + 1, j - 1); i = j; continue

        # literal de regex em JS: so apos operador, abertura ou palavra-chave
        if linha_js and c == "/" and ultimo_util(i) in "(,=:[!&|?{};+-*%~^" + "":
            j = i + 1
            dentro_classe = False
            while j < n and src[j] != "\n":
                if src[j] == "\\":
                    j += 2; continue
                if src[j] == "[":
                    dentro_classe = True
                elif src[j] == "]":
                    dentro_classe = False
                elif src[j] == "/" and not dentro_classe:
                    j += 1; break
                j += 1
            apaga(i + 1, j - 1); i = j; continue

        i += 1

    return "".join(out)


# ---------------------------------------------------------------- python (AST)
def funcoes_python(src):
    """AST de verdade: limites exatos, contagem de parametro exata, aninhamento
    por profundidade de no, nao por indentacao."""
    try:
        arvore = ast.parse(src)
    except SyntaxError:
        return None, "ast-falhou"

    blocos = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.With,
              ast.AsyncWith, ast.Match if hasattr(ast, "Match") else ast.If)

    def profundidade(no, atual=0):
        maximo = atual
        for filho in ast.iter_child_nodes(no):
            if isinstance(filho, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            passo = atual + 1 if isinstance(filho, blocos) else atual
            maximo = max(maximo, profundidade(filho, passo))
        return maximo

    out = []
    for no in ast.walk(arvore):
        if not isinstance(no, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        a = no.args
        nomes = [x.arg for x in (a.posonlyargs + a.args + a.kwonlyargs)
                 if x.arg not in ("self", "cls")]
        if a.vararg:
            nomes.append(a.vararg.arg)
        if a.kwarg:
            nomes.append(a.kwarg.arg)
        out.append({
            "nome": no.name,
            "ini": no.lineno - 1,
            "fim": (no.end_lineno or no.lineno),
            "params": len(nomes),
            "nomes_params": nomes,
            "nest": profundidade(no),
        })
    return out, "python-ast"


# ---------------------------------------------------------------- ts/js (AST)
def _tem_typescript(path):
    """Procura typescript no node_modules do projeto, subindo diretorios."""
    d = os.path.dirname(os.path.abspath(path))
    while True:
        if os.path.isdir(os.path.join(d, "node_modules", "typescript")):
            return d
        pai = os.path.dirname(d)
        if pai == d:
            return None
        d = pai


def funcoes_ts_ast(path):
    raiz = _tem_typescript(path)
    if not raiz or not os.path.isfile(TS_AST):
        return None, None
    try:
        p = subprocess.run(["node", TS_AST, os.path.abspath(path), raiz],
                           capture_output=True, timeout=30, cwd=raiz)
        if p.returncode != 0:
            return None, None
        return json.loads(p.stdout.decode("utf-8", "replace")), "typescript-ast"
    except Exception:
        return None, None


# ---------------------------------------------------------------- fallback
def funcoes_por_chaves(src_mascarado, ling):
    """Ultimo recurso, so sobre fonte ja mascarado. Menos preciso que AST:
    nao enxerga arrow function anonima nem metodo de classe sem palavra-chave."""
    L = src_mascarado.split("\n")
    pat = re.compile(
        r"^(\s*)(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*(\w+)\s*\(([^)]*)"
        r"|^(\s*)(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*(?:async\s*)?\(([^)]*)"
        r"|^(\s*)(?:public|private|protected|static|final|abstract|\s)*function\s+(\w+)\s*\(([^)]*)"
    )
    out = []
    for i, l in enumerate(L):
        m = pat.match(l)
        if not m:
            continue
        g = [x for x in m.groups() if x is not None]
        ind, nome, sig = (g + ["", "", ""])[:3]
        saldo, fim, viu = 0, len(L), False
        for j in range(i, len(L)):
            saldo += L[j].count("{") - L[j].count("}")
            if "{" in L[j]:
                viu = True
            if viu and saldo <= 0:
                fim = j + 1
                break
        corpo = L[i:fim]
        largura = 4 if ling == "python" else 2
        nest = max([(len(x) - len(x.lstrip())) // largura for x in corpo if x.strip()] or [0])
        nest = max(0, nest - len(ind or "") // largura)
        nomes = []
        for pedaco in (sig or "").split(","):
            base = re.sub(r"[:=].*", "", pedaco).strip().lstrip("*&$")
            if re.match(r"^\w+$", base) and base not in ("self", "cls"):
                nomes.append(base)
        out.append({"nome": nome, "ini": i, "fim": fim, "params": len(nomes),
                    "nomes_params": nomes, "nest": nest})
    return out, "chaves-mascaradas"


# ---------------------------------------------------------------- dispatcher
def analisar(path, src):
    """Devolve (linguagem, motor, funcoes, fonte_mascarado)."""
    ling = detectar_linguagem(path, src)
    mascarado = mascarar_literais(src, ling)

    if ling == "python":
        funcs, motor = funcoes_python(src)
        if funcs is not None:
            return ling, motor, funcs, mascarado

    if ling in ("typescript", "javascript"):
        funcs, motor = funcoes_ts_ast(path)
        if funcs is not None:
            return ling, motor, funcs, mascarado

    funcs, motor = funcoes_por_chaves(mascarado, ling)
    return ling, motor, funcs, mascarado
