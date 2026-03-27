---
name: figma-code-connect
description: Create Figma Code Connect mappings (.figma.tsx) for React components. Maps Figma design components to actual codebase components for better AI code generation. Input — component path or Figma URL.
---

# Figma Code Connect — Component Mapping

Creates .figma.tsx definition files that map Figma components to real codebase components, dramatically improving AI code generation accuracy.

## Input

The user provides one of:
- A component file path (e.g., `src/shared/components/AccentButton.tsx`)
- A Figma component URL (e.g., `https://www.figma.com/design/...?node-id=...`)
- Both

## Prerequisites

- `@figma/code-connect` installed as devDependency
- `figma.config.json` at project root with `parser: "react"` and `include: ["src/**/*.figma.tsx"]`

## Workflow

### Step 1 — Read the Component

1. Read the component file to understand its TypeScript interface/props
2. Identify: component name, all props with types, default values, variants
3. Check if a `.figma.tsx` already exists alongside — if yes, update it

### Step 2 — Extract Figma Component Info (if URL provided)

1. Parse fileKey and nodeId from the URL
2. Call `get_metadata(fileKey, nodeId)` to get the component structure
3. Identify Figma properties: variant names, boolean toggles, text properties, instance swaps
4. Map each Figma property to the corresponding React prop

### Step 3 — Generate the .figma.tsx File

Create the file alongside the component (e.g., `AccentButton.figma.tsx` next to `AccentButton.tsx`):

```tsx
import figma from "@figma/code-connect"
import { ComponentName } from "./ComponentName"

figma.connect(ComponentName, "FIGMA_URL", {
  props: {
    // Map every Figma property to a React prop using figma helpers:
    // figma.string("Figma Prop Name") — for text properties
    // figma.boolean("Figma Prop Name") — for boolean toggles
    // figma.enum("Figma Prop Name", { "Figma Value": "react-value" }) — for variants
    // figma.instance("Figma Slot Name") — for instance swaps (icons, slots)
    // figma.children("Figma Layer Name") — for nested children
  },
  example: ({ ...mappedProps }) => (
    <ComponentName {...mappedProps} />
  ),
})
```

### Step 4 — Handle Variants

If the component has multiple visual variants in Figma (e.g., Button has "Primary", "Secondary", "Icon Only"), create SEPARATE figma.connect() calls with variant restrictions:

```tsx
// Primary variant
figma.connect(Button, "FIGMA_URL", {
  variant: { Variant: "Primary" },
  props: { ... },
  example: ({ label }) => <Button variant="contained">{label}</Button>,
})

// Icon-only variant
figma.connect(Button, "FIGMA_URL", {
  variant: { Variant: "Icon Only" },
  props: { icon: figma.instance("Icon") },
  example: ({ icon }) => <IconButton>{icon}</IconButton>,
})
```

### Step 5 — Verify

1. Run `npx tsc --noEmit` to check for TypeScript errors
2. If the project has figma-code-connect publish configured, suggest running `npx figma-code-connect publish`
3. Otherwise, suggest using `add_code_connect_map` via MCP to register the mapping

## Rules

- ALWAYS read the actual component file first — never guess props
- Import paths MUST use the project's alias (e.g., `@/` for src/)
- Include ALL props, not just common ones
- Map MUI props correctly (variant, size, color, disabled, sx)
- For compound components (Card = CardHeader + CardContent + CardActions), map the full composition
- Use realistic examples in the `example` field — not minimal stubs
- If no Figma URL is provided, use "FIGMA_URL_PLACEHOLDER" — user fills it later
