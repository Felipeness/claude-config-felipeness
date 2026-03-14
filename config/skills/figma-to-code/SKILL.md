---
name: figma-to-code
description: Pixel-perfect Figma-to-code pipeline. Pre-extracts complete design system (colors, typography, spacing, shadows, buttons, patterns), then implements components using only extracted tokens. Uses measurement loop for 99%+ fidelity. Input — Figma URL.
---

# Figma-to-Code — Pipeline Pixel-Perfect

Converte designs do Figma em codigo com fidelidade 99%+, extraindo o design system completo ANTES de escrever qualquer componente.

## Input

O usuario fornece:
- URL do Figma (frame, componente, ou pagina)
- Stack alvo (ex: React + Tailwind, React + MUI, Next.js + CSS Modules)

## Workflow — 5 Fases

### Fase 1 — Reconhecimento (NAO escreva codigo)

1. Extraia `fileKey` e `nodeId` da URL do Figma
2. Chame `get_metadata(fileKey, nodeId)` para entender a estrutura completa
3. Chame `get_screenshot(fileKey, nodeId)` para referencia visual
4. Chame `get_variable_defs(fileKey, nodeId)` para TODOS os design tokens
5. Chame `get_code_connect_map(fileKey)` para ver mapeamentos existentes

Registre TUDO que encontrar. Nao perca nenhum token.

### Fase 2 — Extracao do Design System

Com base nos tokens extraidos na Fase 1, organize em arquivos separados:

**Cores:**
```typescript
// tokens/colors.ts
export const colors = {
  primary: { 50: '#...', 100: '#...', ..., 900: '#...' },
  secondary: { ... },
  accent: { ... },
  neutral: { ... },
  semantic: { success: '#...', warning: '#...', error: '#...', info: '#...' },
  background: { default: '#...', paper: '#...', elevated: '#...' },
  text: { primary: '#...', secondary: '#...', disabled: '#...' },
} as const
```

**Tipografia:**
```typescript
// tokens/typography.ts
export const typography = {
  fontFamilies: { heading: '...', body: '...', mono: '...' },
  fontSizes: { xs: '...', sm: '...', md: '...', lg: '...', xl: '...', '2xl': '...', '3xl': '...' },
  fontWeights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeights: { tight: '...', normal: '...', relaxed: '...' },
} as const
```

**Espacamento, Sombras, Borders:**
```typescript
// tokens/spacing.ts — escala baseada no que o Figma usa
// tokens/shadows.ts — elevacoes
// tokens/borders.ts — radius e estilos
```

**Padroes de componentes base:**
Identifique e documente os padroes visuais repetidos:
- Buttons: quantas variantes? Quais cores, tamanhos, estados?
- Inputs: estilos, estados (focus, error, disabled)
- Cards: elevacao, padding, border-radius
- Badges/Tags: cores, tamanhos

Salve em `.claude/figma-design-system-extracted.md` como referencia.

### Fase 3 — Implementacao dos Tokens

1. Gere os arquivos de tokens no formato do projeto (CSS vars, Tailwind config, MUI theme, etc.)
2. Gere os componentes base (Button, Input, Card, Typography) usando APENAS os tokens extraidos
3. NUNCA hardcodar valores — sempre referenciar tokens
4. Cada componente deve ter variantes que espelham as variantes do Figma

### Fase 4 — Implementacao das Telas

Para cada tela/frame do Figma:

1. Chame `get_design_context(fileKey, nodeId)` para o frame especifico
2. Chame `get_screenshot(fileKey, nodeId)` para referencia visual
3. **Analise primeiro:** liste quais componentes base usar, layout (flex/grid), tokens
4. **Implemente:** usando os componentes e tokens da Fase 3
5. **Compare:** visualmente com o screenshot

Se o frame for grande (> 12K tokens):
- Use `get_metadata` para mapear a estrutura
- Busque child nodes individualmente
- Implemente de cima pra baixo (header → hero → sections → footer)

### Fase 5 — Validacao Pixel-Perfect

Para superficies criticas (landing pages, telas de marketing):

1. Rode o dev server
2. Use Playwright para medir valores renderizados:
   - `getComputedStyle()` para font-size, color, padding, margin
   - `getBoundingClientRect()` para dimensoes e posicao
3. Compare com specs do Figma
4. Alimente deltas numericos pro Claude corrigir:
   - "font-size e 28px, spec diz 24px — corrigir"
   - "gap entre header e hero e 4px, spec diz 8px — corrigir"
5. Repita ate todos os deltas estarem dentro de 1px de tolerancia

## Regras de CSS

- Semantic HTML: `section`, `nav`, `main`, `article`, `aside` — nunca div soup
- Flexbox/Grid inferido do Auto Layout do Figma
- Mobile-first se houver frames mobile + desktop
- Nomes de classes descritivos: `hero-section`, `cta-button`, `product-card`
- Zero `!important`
- Zero `position: absolute` a menos que o Figma explicitamente use
- CSS custom properties para todos os tokens

## Output esperado

```
projeto/
  tokens/
    colors.ts          ← Paleta completa extraida do Figma
    typography.ts       ← Escala tipografica
    spacing.ts          ← Sistema de espacamento
    shadows.ts          ← Elevacoes
    borders.ts          ← Radius e estilos
    index.ts            ← Re-export
  components/
    Button/             ← Todas as variantes do Figma
    Input/
    Card/
    Typography/
    ...
  pages/
    HomePage/           ← Tela montada com componentes + tokens
    ...
  .claude/
    figma-design-system-extracted.md  ← Referencia dos padroes encontrados
```
