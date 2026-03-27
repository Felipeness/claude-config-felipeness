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

1. Extraia `fileKey` e `nodeId` da URL do Figma (converter `-` para `:` no nodeId da URL)
2. Chame `get_variable_defs(fileKey, nodeId)` para TODOS os design tokens — SEMPRE primeiro
3. Chame `get_design_context(fileKey, nodeId)` para a representacao estruturada (React+Tailwind como referencia, NAO como codigo final)
4. Se `get_design_context` truncar ou for muito grande: chame `get_metadata(fileKey, nodeId)` e busque child nodes individualmente
5. Chame `get_screenshot(fileKey, nodeId)` para referencia visual — este e o SOURCE OF TRUTH
6. Chame `get_code_connect_map(fileKey)` para ver mapeamentos existentes
7. Chame `search_design_system` para verificar componentes existentes na library

Registre TUDO que encontrar. Nao perca nenhum token.

**IMPORTANTE:** Se o frame tiver annotations, remova-as antes de chamar `get_design_context` (bug conhecido que causa falha silenciosa).

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

**Implementar EM CAMADAS (nunca tudo de uma vez):**
1. **Layout** — estrutura flex/grid, sizing, posicionamento, gaps
2. **Tipografia** — font-family, size, weight, line-height, letter-spacing
3. **Cores** — backgrounds, text colors, border colors
4. **Detalhes** — shadows, border-radius, opacity, hover states
5. **Responsividade** — breakpoints mobile/tablet/desktop

Se o frame for grande (> 12K tokens):
- Use `get_metadata` para mapear a estrutura
- Busque child nodes individualmente
- Implemente secao por secao: header → hero → sections → footer
- Cada secao passa pelo measurement loop da Fase 5 antes de seguir para a proxima

### Fase 5 — Measurement Loop (OBRIGATORIO para toda implementacao)

O measurement loop e o que fecha os ultimos 20-35% de fidelidade. NUNCA pule esta fase.

**Pre-requisito:** Dev server rodando (verifique ou inicie com o comando do projeto).

**Loop:**

1. **Navegar** via Playwright MCP:
   - `browser_navigate` para a URL local (ex: `http://localhost:3000/pagina`)
   - `browser_resize` para o mesmo viewport do frame Figma (ex: 1440x900 ou 375x812)

2. **Capturar** screenshot do resultado renderizado:
   - `browser_take_screenshot` — guardar como referencia do estado atual

3. **Comparar** usando vision do Claude:
   - Colocar lado a lado: screenshot do Figma (Fase 1) vs screenshot do browser
   - Listar CADA diferenca em formato tabular:
     ```
     | Elemento        | Propriedade    | Figma (esperado) | Browser (atual) |
     |----------------|----------------|------------------|-----------------|
     | hero-title     | font-size      | 48px             | 42px            |
     | card-container | padding        | 24px             | 16px            |
     | cta-button     | background     | var(--primary)   | #1a73e8 (hard)  |
     ```

4. **Medir valores computados** para confirmar diferencas:
   ```javascript
   // Via browser_execute_javascript
   const el = document.querySelector('.hero-title');
   const styles = getComputedStyle(el);
   JSON.stringify({
     fontSize: styles.fontSize,
     lineHeight: styles.lineHeight,
     color: styles.color,
     padding: styles.padding,
     margin: styles.margin,
     gap: styles.gap
   });
   ```
   ```javascript
   // Para dimensoes e posicao
   const rect = document.querySelector('.hero-title').getBoundingClientRect();
   JSON.stringify({ width: rect.width, height: rect.height, top: rect.top, left: rect.left });
   ```

5. **Corrigir** cada diferenca no codigo — uma por uma, da mais visivel para a menos

6. **Repetir** de 1 ate convergir:
   - Max **4 iteracoes** por secao
   - Tolerancia: **1px** para spacing/sizing, **deltaE < 3** para cores
   - Se apos 4 iteracoes houver diferencas > 2px, reportar ao usuario com lista de deltas

7. **Responsive check** (se aplicavel):
   - Repetir o loop em breakpoints: mobile (375px), tablet (768px), desktop (1440px)
   - Comparar cada breakpoint com o frame Figma correspondente

**Dicas para o loop funcionar bem:**
- Comparar SECAO por secao, nao pagina inteira — foco em 1 area por vez
- Se uma diferenca persiste apos 2 correcoes, verificar se e heranca de CSS ou conflito de especificidade
- Fonts podem ter diferenca de 1-2px por rendering engine — isso e normal
- Anti-aliasing e subpixel rendering causam ~2% de diferenca em screenshots — nao tentar corrigir

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
