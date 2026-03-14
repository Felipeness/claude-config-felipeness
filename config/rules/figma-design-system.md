---
globs: ["**/*.tsx", "**/*.ts", "**/*.css"]
---

# Figma-to-Code Design System Rules

## Workflow obrigatorio (nessa ordem)

1. **Extrair tokens PRIMEIRO** — chame `get_variable_defs` para obter TODAS as variaveis do Figma (cores, spacing, tipografia, shadows, borders)
2. **Screenshot de referencia** — chame `get_screenshot` para ter referencia visual
3. **Checar Code Connect** — chame `get_code_connect_map` para ver quais componentes ja estao mapeados
4. **Analisar ANTES de codar** — liste: tokens usados, layout (flex/grid), componentes existentes que encaixam, textos que precisam i18n. NAO escreva codigo ainda
5. **Implementar** — usando APENAS tokens extraidos e componentes existentes
6. **Validar** — compare visualmente com o screenshot do passo 2

## Regras de estilo

- NUNCA hardcodar cores hex — use variaveis CSS ou tokens do Tailwind/MUI
- NUNCA usar valores arbitrarios do Tailwind como `p-[40px]` — use classes baseadas em tokens
- NUNCA criar componentes novos se ja existir um similar em `src/components/`
- SEMPRE mapear nomes de variaveis do Figma para nomes de tokens do projeto
- SEMPRE usar semantic HTML (`section`, `nav`, `main`, `article`) — nao `div` soup
- SEMPRE incluir atributos ARIA quando necessario

## Separacao de design system

Ao extrair tokens do Figma, organizar em:
- `tokens/colors.ts` — paleta de cores (primary, secondary, accent, neutral, semantic)
- `tokens/typography.ts` — escala tipografica (font families, sizes, weights, line heights)
- `tokens/spacing.ts` — escala de espacamento (baseada em 4px ou 8px)
- `tokens/shadows.ts` — sombras e elevacoes
- `tokens/borders.ts` — border radius e border styles
- `tokens/index.ts` — re-exporta tudo

## Componentes base a extrair do Figma

Antes de implementar qualquer tela, extrair e criar:
- Button (variantes: primary, secondary, outline, ghost + sizes: sm, md, lg)
- Input (variantes: text, password, search + estados: default, focus, error, disabled)
- Card (variantes: elevated, outlined, filled)
- Typography (H1-H6, body, caption, label)
- Badge, Tag, Chip
- Avatar
- Icon system

## Figma-specific

- Componentes Figma > 12.000 tokens: usar `get_metadata` primeiro, depois buscar child nodes individualmente
- Assets (icones, imagens): usar URLs localhost retornadas pelo MCP diretamente — NUNCA criar placeholders
- Auto Layout no Figma = flexbox no CSS. Sem Auto Layout = investigar o layout manualmente
- Responsive: pedir AMBOS os frames mobile + desktop se existirem
