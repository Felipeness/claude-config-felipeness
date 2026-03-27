---
name: mirror-pr
description: Cria PR espelho para develop a partir de uma PR em master (cherry-pick). Usa em repos echo-atende que requerem PRs em ambas as branches. Input — número da PR ou URL.
---

# Mirror PR — Cherry-pick master → develop

Cria automaticamente a PR espelho para `develop` a partir de uma PR que já existe em `master`.

## Input

O argumento pode ser:
- Número da PR: `215`
- URL da PR: `https://github.com/Superlogica/echo-atende-frontend/pull/215`
- Vazio: usa a PR mais recente da branch atual

## Passos (executar em ordem)

1. **Identificar a PR master**: extrair repo, branch, commits e título
   ```bash
   gh pr view <PR> --repo <REPO> --json headRefName,baseRefName,title,body,commits
   ```

2. **Validar**: a PR deve ter `baseRefName: master`. Se for develop, abortar.

3. **Preparar branch develop**: a partir do repo local
   ```bash
   git fetch origin develop
   git checkout -b <branch>-dev origin/develop
   ```

4. **Cherry-pick**: aplicar cada commit da PR master (na ordem)
   ```bash
   git cherry-pick <sha1> <sha2> ...
   ```
   Se conflitar, resolver e continuar. Se não resolver, avisar o usuário.

5. **Push**:
   ```bash
   git push -u origin <branch>-dev
   ```

6. **Criar PR**: com referência à PR master no body
   ```bash
   gh pr create --base develop --title "<mesmo título>" --body "## Summary\n\n<resumo>\n\n## Espelho da PR master\n\nPR master: <url>\n\n## Jira\n\n<jira link>"
   ```

7. **Reportar**: mostrar as duas URLs (master + develop)

## Regras

- A branch develop SEMPRE é criada fresh de `origin/develop` (nunca da master)
- SEMPRE cherry-pick, nunca merge
- Nome da branch: `<branch-original>-dev`
- O body da PR develop referencia a PR master
- Se o repo não for `echo-atende-*`, avisar que esse skill é para repos atende
