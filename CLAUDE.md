# Skill Tree App

A personal DevOps skill-tree tracker, styled like a game skill tree (think
Jedi Survivor / Path of Exile) rendered on a canvas-and-easel backdrop.
Built by Ibrahim, a recent Software Engineering grad (Westminster, First
Class) working toward a DevOps role, alongside Claude in claude.ai chat.
This file is the handoff so Claude Code has the context that chat had.

## Philosophy - read this before changing anything

This app is **cosmetic/tracking only, not a teaching tool**. The tree
visualises what Ibrahim has learned and still needs to learn - it does not
teach the material itself. Don't add lesson content, explanations of Docker
or AWS etc. into the app. Keep the build itself lean; the actual learning
happens outside the app.

Also: Ibrahim wants to understand the codebase as it grows, not just receive
finished files. Prefer clear, well-commented changes over clever/terse ones.
Keep explanations plain-English, concise, and skip unnecessary preamble.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- SQLite planned for persistence (not wired up yet)
- Chosen because Ibrahim already used this exact combo on a previous
  project (a remittance platform), so nothing here is new to him

## How the tree works

- `lib/skillTreeData.ts` is the single source of truth: every node (title,
  `abbr` short label shown on the circle, status, description, unlock
  requirement, proof link) and every edge.
- Edges have a `kind`:
  - `"prereq"` = a real dependency chain. Drawn **solid**. This is also
    where a node visually branches from on the canvas.
  - `"requirement"` = a soft unlock condition ("must also complete this")
    without being the node's positional parent. Drawn **dashed**.
- Current tree: Linux -> Bash -> splits into two independent branches
  (Docker -> Kubernetes, and AWS -> Terraform) -> CI/CD branches
  positionally off Bash but requires both Kubernetes AND AWS to be
  completed first (dashed requirement edges) before it can be marked done.
- **Gating is enforced**: a node can only be marked complete once every
  node with an edge pointing into it (prereq or requirement) is already
  completed. See `canComplete()` / `getIncomingIds()` in
  `components/SkillTree.tsx`. Un-completing a node is always allowed with
  no gate.
- Nodes currently show initials (LNX, BASH, DKR, K8S, AWS, TF, CI) -
  intentional placeholder, will be swapped for real logos later.

## File structure

- `components/SkillTree.tsx` - renders nodes as circles + edges as lines,
  hover tooltip, click-to-toggle-complete with gating logic
- `components/Easel.tsx` - the canvas/easel backdrop the tree sits on
  (built with plain CSS, not an image asset)
- `app/page.tsx` - assembles the page
- `lib/skillTreeData.ts` - all tree data

## Status / what's left

1. ✅ Static tree rendering
2. ✅ Node/edge data structure
3. ✅ Hover tooltip + click-to-complete, with prerequisite gating
4. ⬜ Wire up SQLite so status and proof links actually persist
5. ⬜ Dockerise the app, add a GitHub Actions CI/CD pipeline, deploy to AWS
   - this step deliberately doubles as Ibrahim's own proof-of-skill for
     the CI/CD and AWS nodes on the tree itself

## Known gaps / decisions not yet made

- No auth - single user, personal app, not a concern yet
- Proof link field exists in the data model but isn't saved anywhere real
- Multiple career-path branches (backend, cloud, security) were discussed
  as a future expansion but not started - current tree is DevOps only
