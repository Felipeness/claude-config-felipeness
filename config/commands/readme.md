---
name: readme
description: >
  Write outstanding README.md files with Mermaid diagrams, shields.io badges, comparison tables,
  collapsible sections, and a Problem-Insight-Solution-Proof narrative arc. Use this skill whenever
  the user asks to create a README, improve a README, document a project, or when a project is
  missing a README. Also use when the user says "document this", "write docs", or "make this
  presentable". The README should make people WANT to star the repo.
---

# README Skill — Outstanding Project Documentation

You are writing a README that tells a story and makes people want to use the project. Follow this pattern exactly.

## Bilingual Output (MANDATORY)

ALWAYS generate TWO files:
1. **README.md** — Portuguese (Brazilian) version (primary, shown on GitHub)
2. **README.en.md** — English version

Both files must have identical structure, diagrams, and content. The only difference is the language of prose text. Mermaid diagrams, code blocks, and badges stay in English in both versions.

Add a language switcher at the very top of each file:

In README.md:
```markdown
> Portugues | **[English](README.en.md)**
```

In README.en.md:
```markdown
> **[Portugues](README.md)** | English
```

The Portuguese version must be natural Brazilian Portuguese — written as a Brazilian developer would write, not machine-translated. Use technical terms in English where that's the norm in Brazilian dev culture (e.g., "deploy", "branch", "runner", "pipeline").

## Narrative Arc: Problem → Insight → Solution → Proof

Every great README follows this arc. Don't skip steps.

1. **Problem** (1-2 sentences): Name the pain the project solves. Be specific, not generic.
2. **Insight** (1-2 sentences): The non-obvious realization that changes everything.
3. **Solution** (1 breath): What this project does, in terms of the insight.
4. **Proof** (numbers): Quantified claims. Never adjectives — always metrics.

## Phase 1 — Research Before Writing

Before writing a single line, explore the codebase thoroughly:

1. **Read existing README** (if any) — preserve what's good
2. **Read package.json / go.mod / Cargo.toml** — extract: name, version, description, scripts, dependencies, license
3. **Scan directory structure** — understand monorepo vs single-package, key directories
4. **Read CLAUDE.md / ARCHITECTURE.md** — extract design principles, tech stack
5. **Check test suite** — count tests, identify test framework
6. **Check CI** — look for .github/workflows/, identify pipeline
7. **Identify key numbers** — tools, endpoints, components, test count, anything quantifiable
8. **Understand the differentiator** — what makes this project different from alternatives?

## Phase 2 — Write the README

### Section Order (follow exactly)

```
1. Language switcher (EN/PT-BR link)

2. Hero Zone (centered)
   - Project name (H1, centered)
   - One-line tagline (bold, centered)
   - Badge row (shields.io, centered)
   - Quantified hero line (bold metrics separated by bullets)
   - Optional: inspirational attribution

3. Table of Contents

4. Differentiator Section
   - Comparison table: this project vs the obvious alternative
   - Title should be provocative, not generic ("Not Just X With a Pretty Face")

5. How It Works
   - 1-2 sentence intro
   - Mermaid flowchart showing end-to-end flow
   - Use colored subgraphs for visual grouping

6. Deep Dive (collapsible where verbose)
   - Key features with tables or structured lists
   - Use <details><summary> for long content
   - Each feature gets: what, why, how (brief)

7. Architecture
   - Mermaid diagram (flowchart or graph)
   - Show components and their relationships
   - Label connections with what flows between them

8. Project Structure
   - Directory tree with 1-line comments
   - Only show meaningful directories, not every file

9. Quick Start
   - Prerequisites line
   - Max 5-6 commands (clone, install, configure, start)
   - End with what the user should see/expect

10. Roadmap (if multi-phase project)
    - Mermaid gantt chart (done/active/planned)
    - Status table: Phase | Status | Highlights

11. Design Principles (if the project has a philosophy)
    - 3-4 principles, each 2-3 sentences
    - End with a memorable quote if available

12. Configuration
    - Collapsible .env reference
    - Group by: required, optional, advanced

13. API / Endpoints (if applicable)
    - Table per service: Method | Path | Description

14. License & Acknowledgements
```

### Hero Zone Template

```markdown
<div align="center">

# Project Name

**One-line tagline that explains what it does and why it matters.**

[![Badge1](https://img.shields.io/badge/...)](link)
[![Badge2](https://img.shields.io/badge/...)](link)

**Metric1** &bull; **Metric2** &bull; **Metric3** &bull; **Metric4**

</div>

---
```

### Badge Selection (pick the most relevant 4-6)

**Row 1 — Identity & Status:**
- Language/framework version: `![TS](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)`
- Runtime: `![Node](https://img.shields.io/badge/Node-22%2B-339933?logo=node.js&logoColor=white)`
- License: `![License](https://img.shields.io/badge/License-MIT-yellow.svg)`
- CI status: `![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)`

**Row 2 — Quantified Metrics (custom, project-specific):**
- Test count: `![Tests](https://img.shields.io/badge/Tests-236-brightgreen?logo=vitest&logoColor=white)`
- Key metric: `![Components](https://img.shields.io/badge/Components-29-blue)`
- Use `?style=flat-square` for cleaner look on metric badges

### Mermaid Diagram Patterns

**Architecture Overview (flowchart TB):**
```
flowchart TB
    subgraph GroupA ["Label"]
        A[Component] --> B[Component]
    end
    subgraph GroupB ["Label"]
        C[Component] --> D[Component]
    end
    GroupA --> GroupB
    style GroupA fill:#1a1a2e,stroke:#e94560,color:#eee
    style GroupB fill:#16213e,stroke:#0f3460,color:#eee
```

**Pipeline/Flow (flowchart LR or TB):**
- Use subgraphs to group related steps
- Color-code subgraphs by concern (input, processing, output)
- Label edges with what flows between them

**State Machine (stateDiagram-v2):**
- Show happy path as linear flow
- Show backward transitions with labels explaining WHY
- Note sink/terminal states

**Roadmap (gantt):**
```
gantt
    title Project Roadmap
    dateFormat YYYY-MM
    section Done
    Phase 1    :done, p1, 2025-01, 2025-03
    section Planned
    Phase 2    :active, p2, 2025-03, 2025-06
```

**Sequence Diagram:** Use for complex multi-component interactions with temporal ordering.

### Comparison Table Pattern

The single most effective differentiator technique. Compare your project against the obvious alternative:

```markdown
| | Alternative | This Project |
|---|---|---|
| **Dimension 1** | What they do | What you do better |
| **Dimension 2** | What they do | What you do better |
```

Pick 6-8 dimensions where your project genuinely differs. Be honest — if the alternative is better at something, either omit it or acknowledge it. Dishonest comparisons erode trust.

### Collapsible Sections

Use for content that's important but verbose:

```html
<details>
<summary><strong>Section Title</strong></summary>

Content here (tables, code blocks, long lists)

</details>
```

Good candidates for collapsing: configuration reference, full endpoint lists, detailed feature breakdowns, changelog.

## Style Rules

- **Emojis**: Max 1 per H2 heading. Use `~` or `>` as section markers instead of emojis if you want visual flair. Never emojis in body text or code.
- **Tone**: Confident but not arrogant. Technical but scannable. Show, don't tell.
- **Quantify**: Replace adjectives with numbers. "Fast" → "< 200ms". "Many" → "29 tools". "Tested" → "236 tests".
- **Headers**: Use action-oriented or provocative headers, not generic ones. "Architecture" is fine. "How It Works" is better. "Not Just X With a Pretty Face" is best.
- **Links**: No placeholder links. No broken links. If the target doesn't exist, don't link it.
- **Images**: Only reference images that exist in the repo. Never placeholder images.
- **Code blocks**: Quick Start code must be copy-pasteable and actually work.
- **Length**: 300-600 lines is the sweet spot per file. Under 200 feels thin. Over 800 loses readers.

## Anti-Patterns (avoid)

- Generic taglines ("A powerful tool for...") — be specific
- Badge walls (12+ badges) — pick 4-6 meaningful ones
- "Features" as a bullet list of adjectives — show, don't list
- README that reads like API docs — that belongs in docs/
- Mermaid diagrams with 50+ nodes — simplify or split
- Quick Start that requires 15 steps — max 6 commands
- Screenshots that don't exist yet — skip until they do
- "TODO" or "Coming soon" sections — either it exists or it doesn't belong in README

## Checklist Before Finishing

- [ ] TWO files generated: README.md (EN) + README.pt-BR.md (PT-BR)
- [ ] Language switcher at top of both files
- [ ] Hero zone is centered with tagline + badges + metrics
- [ ] At least 2 Mermaid diagrams (architecture + flow/state/gantt)
- [ ] Comparison table against the obvious alternative
- [ ] Quick Start is copy-pasteable (tested commands)
- [ ] All links resolve to real targets
- [ ] No placeholder images or broken badges
- [ ] Collapsible sections for verbose content
- [ ] Numbers, not adjectives (quantified claims)
- [ ] Narrative arc: Problem → Insight → Solution → Proof
- [ ] Portuguese version is natural, not machine-translated
