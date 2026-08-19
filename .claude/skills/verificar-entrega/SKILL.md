---
name: verificar-entrega
description: Gate antes de abrir PR. Roda os detectores mecânicos (paridade de runtime, teste desligado, drift de config, tamanho, sobras de debug) e aplica os checklists de julgamento (auth/permissão, fatiamento de migração). Use sempre antes de abrir PR, antes de escrever "verificado/testado" em qualquer descrição, e ao decidir como fatiar um trabalho grande. Também cobre higiene de backlog de PRs abertas.
---

# Verificar entrega

Escrever "verificado" antes de rodar é o defeito mais caro de quem trabalha em greenfield.
Esta skill existe para tornar mecânico o que hoje depende de lembrar.

**Regra dura: nenhuma descrição de PR pode conter "verificado", "testado", "validado" ou
"guardrails" sem que a Fase 1 tenha rodado e passado.** Se um detector falhou, a palavra
não entra.

---

## Quando usar

- Antes de abrir qualquer PR.
- Antes de escrever "verificado/testado/validado" em descrição, comentário ou resposta de review.
- Ao começar um trabalho que você já sabe que passa de 400 linhas (Fase 3).
- Semanalmente, para a higiene de backlog (Fase 5).

Não usar em: hotfix de uma linha com incidente aberto. Nesse caso roda só a Fase 1.

---

## Fase 1 — Detectores mecânicos (obrigatória)

```bash
bash ~/.claude/skills/verificar-entrega/scripts/check.sh          # diff vs origin/master
bash ~/.claude/skills/verificar-entrega/scripts/check.sh develop  # outra base
```

O script é o gate. Ele reporta seis blocos:

| Bloco | O que pega | Por que existe |
|---|---|---|
| RUNTIME | sintaxe/API acima da versão de Node do destino | `??` em Node 12 é `SyntaxError` no boot do módulo, não warning |
| TESTE | `.skip`, `.only`, assert comentado, `setTimeout` como espera, teste sem `expect` | teste com assert desligado é pior que teste nenhum: passa no CI e cria confiança falsa |
| CONFIG | chave presente num `values/*.yaml` ou `.env*` e ausente em outro | a config some justamente no ambiente onde a validação ia acontecer |
| TAMANHO | diff acima de 400 linhas ou 20 arquivos | PR grande não é revisada, envelhece, conflita e morre |
| SOBRAS | `debug: true`, `console.log`, `TODO`, plano de execução commitado | `debug: true` em datasource de produção custa event loop a 200k req/h |
| SEGREDO | credencial aparente no diff | óbvio |

Saída `FALHOU` bloqueia a PR. Saída `ATENÇÃO` exige uma frase na descrição explicando por
que está ok.

### Se o RUNTIME não tiver como ser detectado

O script procura, nessa ordem: `engines.node` no `package.json`, `.nvmrc`, `FROM node:` no
Dockerfile, tag de imagem em `.deploy/values/*.yaml`. Se não achar nenhum, ele avisa e
**você tem que descobrir e anotar**. Rodar `node --check` com a versão local não prova nada
se produção roda outra.

O jeito definitivo, quando existir Docker:

```bash
docker run --rm -v "$PWD":/app -w /app node:12.22 \
  sh -c 'for f in $(git diff --name-only origin/master...HEAD | grep "\.js$"); do node --check "$f" || echo "QUEBRA: $f"; done'
```

---

## Fase 2 — Checklist de auth, permissão e migração de identidade

Só quando o diff toca autenticação, autorização, sessão, token, cookie ou tabela de
permissão. São quatro perguntas, e cada uma corresponde a um defeito real que já passou
por aqui.

1. **Todos os caminhos de escrita filtram os mesmos campos privilegiados?**
   Liste os endpoints de escrita da entidade e confira um a um. O defeito clássico é
   aplicar `delete data.superUser` em dois de três endpoints e deixar o `PUT` aberto para
   auto-promoção.
   ```bash
   grep -rn "delete .*\.\(superUser\|role\|isAdmin\|tenant\|permissions\)" src/ | sort
   ```
   Se o número de ocorrências for menor que o número de endpoints de escrita, tem buraco.

2. **Todo caminho que aceita token valida assinatura, não só `exp`?**
   `jwt.decode()` não valida nada. Se algum caminho decodifica localmente e confia,
   token revogado continua valendo até expirar sozinho. Procure:
   ```bash
   grep -rn "jwt.decode\|decode(token" src/ | grep -v verify
   ```

3. **Com a flag DESLIGADA, o comportamento antigo é 100% preservado? E com ela LIGADA, o
   caminho legado continua atendido?**
   Feature toggle que derruba o legado quando ligado não é toggle, é big bang com
   cerimônia. Teste os dois estados de verdade, não só o novo.
   E: a flag vai para produção **desligada**. Flag que nasce ligada em `prd.yaml` não tem
   rollback sem novo deploy, que é exatamente o que ela existia para evitar.

4. **O script de migração/backfill respeita os mesmos gates do runtime?**
   `email_verified: true` hardcoded num bulk import fura o gate anti-takeover que a mesma
   PR implementa. Todo script que escreve no mesmo dado que o runtime protege precisa
   passar pelas mesmas validações, ou documentar por escrito por que não precisa.

Extra, quando o dado é MongoDB: **campo ausente ≠ `null`.** `{ campo: { $eq: null } }` não
casa documento que não tem o campo. Se você adicionou campo novo num schema e vai consultar
por `null`, precisa de `default: null` no model ou `$exists: false` na query.

---

## Fase 3 — Fatiamento: como entregar trabalho grande sem churn

O contexto que torna isso difícil é legítimo: quem faz migração de sistema em greenfield
desenha, testa, refaz e testa de novo. O erro não é refazer. O erro é **refazer dentro da
mesma PR aberta** até ela ficar grande demais para revisar e morrer.

Refazer é do trabalho. Refazer em público, numa PR de 33 mil linhas, é o que gera o churn.

### A regra

Trabalho exploratório vive em branch local ou draft. **PR só nasce quando a fatia está
fechada.** E a fatia tem teto de 400 linhas.

### Como fatiar uma migração (a ordem importa)

Cada fatia tem que ser mergeável sozinha, sem quebrar nada, e sem depender da próxima.

1. **Fundação aditiva.** Tipos, portas, DTOs, tabelas novas, config. Nada usa ainda.
   Merge sozinho, risco zero.
2. **Implementação atrás de flag desligada.** O código novo existe e não roda.
   Merge sozinho.
3. **Primeiro consumidor ligado em dev/hml.** Um caminho só, com a flag.
4. **Expansão, um consumidor por PR.**
5. **Kill switch.** Remoção do caminho antigo, em PR separada, depois da flag estar ligada
   em produção por tempo suficiente.

Se você não consegue descrever a fatia numa frase sem "e", ela ainda não é uma fatia.

### Antes de abrir a segunda fatia

**Mergeia a primeira.** Fatia empilhada em fatia não mergeada é a mesma PR gigante com
nomes diferentes: quando a base muda, todas conflitam ao mesmo tempo.

### Sinal de que a PR já morreu

Aberta há mais de 10 dias, ou com conflito de merge, ou com mais de 50 commits. Nesse
ponto rebase não salva: refatia a partir do master atual e fecha a antiga referenciando a
nova. Reabrir a mesma coisa com título igual pela terceira vez é o sintoma, não a solução.

---

## Fase 4 — Descrição da PR

O corpo já é bom por padrão. O que falta é a seção de verificação ser verdadeira.

```markdown
## Verificação
- [ ] `check.sh` passou (ou: falhou em X, ok porque Y)
- [ ] Rodou no runtime de destino: Node <versão>, via <docker|nvm|CI>
- [ ] Testes: <n> novos, happy path coberto, nenhum `.skip`
- [ ] Flag DESLIGADA preserva comportamento antigo: testado
- [ ] Config presente em todos os `values/*.yaml`
```

Se um item não foi feito, apaga a linha. Não marca. Checkbox marcado sem execução é o
mesmo defeito de escrever "guardrails verificados" num guard que lê o objeto errado.

---

## Fase 5 — Higiene de backlog

Semanal, 5 minutos:

```bash
gh search prs --owner <org> --author <você> --state open --limit 300 \
  --json number,repository,title,createdAt,updatedAt \
  --jq '.[]|select(.updatedAt < (now-60*86400|todate))|"\(.updatedAt[0:10]) \(.repository.nameWithOwner)#\(.number) :: \(.title)"'
```

Para cada uma: mergeia, refatia ou fecha. Não existe quarta opção.

Ao fechar, comenta o motivo. A branch continua no remoto e reabrir é um clique, então
fechar não perde nada — mas fechar em silêncio confunde quem acompanhava.

Duplicatas do mesmo trabalho (mesmo título, PRs diferentes) fecham todas menos a mais
recente, e a que fica referencia as outras.

---

## O que esta skill NÃO faz

Não substitui review humano e não tenta. O objetivo é que o revisor gaste o tempo dele em
design e regra de negócio, não em achar `??` num Node 12 e `expect` comentado.

Se o `check.sh` está limpo e o checklist da Fase 2 foi respondido, a PR está pronta para
alguém pensar em cima dela. Antes disso, não está.
