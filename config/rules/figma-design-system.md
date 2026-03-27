---
globs: ["**/*.tsx", "**/*.ts", "**/*.css"]
---

# Figma-to-Code Design System Rules

## Workflow obrigatorio (nessa ordem)

### Fase 1 — Extracao (NAO escreva codigo)
1. **Extrair tokens PRIMEIRO** — chame `get_variable_defs` para obter TODAS as variaveis do Figma (cores, spacing, tipografia, shadows, borders)
2. **Design context** — chame `get_design_context` para obter a representacao estruturada (React+Tailwind). Se truncar ou > 12K tokens, use `get_metadata` primeiro e busque child nodes individualmente
3. **Screenshot de referencia** — chame `get_screenshot` para ter referencia visual. Guardar como source of truth
4. **Checar Code Connect** — chame `get_code_connect_map` para ver quais componentes ja estao mapeados. Se existir mapeamento, usar o componente real do codebase
5. **Checar design system** — chame `search_design_system` antes de criar qualquer componente novo
6. **Analisar ANTES de codar** — liste: tokens usados, layout (flex/grid), componentes existentes que encaixam, textos que precisam i18n. NAO escreva codigo ainda

### Fase 2 — Implementacao em camadas
Implementar nesta ordem, nunca tudo de uma vez:
1. **Layout** — estrutura flex/grid, sizing, posicionamento
2. **Tipografia** — font-family, size, weight, line-height, letter-spacing
3. **Cores** — backgrounds, text colors, borders
4. **Detalhes** — shadows, border-radius, opacity, transitions
5. **Responsividade** — breakpoints (se houver frames mobile + desktop)

### Fase 3 — Measurement Loop (OBRIGATORIO — usar Playwright MCP, NAO Chrome MCP)
SEMPRE usar o **Playwright MCP** para o measurement loop, NUNCA o Chrome MCP (claude-in-chrome).
Playwright oferece viewport programatico, CSS computado nativo e nao depende do Chrome aberto.

Apos implementar, rodar o loop de verificacao visual:
1. **Navegar** para a pagina renderizada via Playwright MCP (`browser_navigate`)
2. **Redimensionar** o viewport para o mesmo tamanho do frame Figma (`browser_resize`)
3. **Screenshot** do resultado renderizado (`browser_take_screenshot`)
4. **Comparar** o screenshot renderizado vs screenshot do Figma (usar vision do Claude)
5. **Listar CADA diferenca** encontrada em formato estruturado:
   - Elemento | Propriedade | Esperado (Figma) | Atual (browser)
   - Ex: "Header padding-top | 32px | 24px"
6. **Corrigir** cada diferenca no codigo
7. **Repetir** de 1 ate convergir (max 4 iteracoes)
8. **Verificar CSS computado** via `browser_execute_javascript` com `getComputedStyle()` para valores criticos (font-size, padding, margin, gap, color)

Se apos 4 iteracoes ainda houver diferencas > 2px, reportar ao usuario com a lista de deltas restantes.

## Regras de estilo

- NUNCA hardcodar cores hex — use variaveis CSS ou tokens do Tailwind/MUI
- NUNCA usar valores arbitrarios do Tailwind como `p-[40px]` — use classes baseadas em tokens
- NUNCA criar componentes novos se ja existir um similar em `src/components/`
- NUNCA usar `get_design_context` output como codigo final — e referencia, adaptar ao stack do projeto
- SEMPRE mapear nomes de variaveis do Figma para nomes de tokens do projeto
- SEMPRE usar semantic HTML (`section`, `nav`, `main`, `article`) — nao `div` soup
- SEMPRE incluir atributos ARIA quando necessario
- SEMPRE especificar o framework alvo no prompt se nao for React+Tailwind

## Figma-specific

- Componentes Figma > 12.000 tokens: usar `get_metadata` primeiro, depois buscar child nodes individualmente
- Assets (icones, imagens): usar URLs localhost retornadas pelo MCP diretamente — NUNCA criar placeholders
- Auto Layout no Figma = flexbox no CSS. Sem Auto Layout = investigar o layout manualmente
- Responsive: pedir AMBOS os frames mobile + desktop se existirem
- Annotations no Figma: REMOVER annotations antes de chamar `get_design_context` (bug conhecido — falha silenciosamente)
- `get_variable_defs` so retorna valores do mode default — se tiver dark/light mode, tratar tokens de tema manualmente

## Icones — NUNCA adivinhar

`get_design_context` exporta icones como `<img src={imgVector}>` generico — o nome real do icone NAO aparece.
Para CADA icone: chamar `get_metadata` ou `get_design_context` no node-id pai do icone para extrair o nome real do componente (ex: `NewspaperOutlined`).
Se o nome nao aparecer, usar o screenshot do Figma para identificar visualmente.
NUNCA adivinhar icone pelo contexto. NUNCA usar placeholder.

## Bug: Instance overrides nao retornados

`get_design_context` retorna valores do componente MASTER, nao da instancia.
Ex: botao "Delete" vermelho pode voltar como `#171717` (cor do master).

**Regra:** SEMPRE cruzar `get_design_context` com `get_variable_defs` + `get_screenshot`.
Se uma cor no codigo nao bater com o screenshot, confiar no screenshot + `get_variable_defs`.

## Typography — regras de conversao exatas

Erros tipograficos sao a causa #1 de off-by-1px. Regras:

- `line-height: Auto` no Figma = `line-height: normal` no CSS — NUNCA usar `1.2`
- `letter-spacing` no Figma e em px → CSS deve ser em `em`: `figma_px / font_size_px`
  - Ex: Figma `0.5px` com font 16px → CSS `letter-spacing: 0.03125em`
  - Se Figma `letter-spacing: 0` → OMITIR a propriedade (nao escrever `0`)
- `font-weight`: mapear nome do Figma para numero CSS (Regular=400, Medium=500, Semi Bold=600, Bold=700)
- `-webkit-font-smoothing: antialiased` aproxima rendering do browser ao Figma
- Subpixel: verificar que valores rem computam para px inteiro (ex: `1.4rem` * 10 = 14px OK, `0.875rem` * 10 = 8.75px RUIM)

## Elevation — nao hardcodar box-shadow

Figma mostra box-shadow visual. Converter para elevation do framework:
- Sem shadow → `elevation={0}`
- Shadow sutil → `elevation={1}` ou `elevation={2}`
- Shadow medio → `elevation={4}`
- Shadow forte → `elevation={8}` ou `elevation={12}`

NUNCA copiar `box-shadow` do Figma — usar sistema de elevation do projeto.

## Secao-por-secao, nunca pagina inteira

- Quebrar a pagina em secoes logicas: header, hero, content sections, footer
- Cada secao e um ciclo completo: extrair → implementar → measurement loop
- Componentes atomicos primeiro (Button, Input, Badge), depois compostos (Card, ListItem), depois layouts
