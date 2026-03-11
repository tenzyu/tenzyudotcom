# Project Overview: tenzyudotcom

## Purpose
Tenzyu.com is a personal portfolio and site for "tenzyu", featuring a blog, notes, and curated recommendations. It serves as a platform to showcase projects, skills, and personal content.

## Core Principles
- **Local-first, promote-later**: Keep code as local as possible (route-local) until actual reuse occurs.
- **Feature-first, Pattern-later**: Organize code by feature responsibility rather than syntax (e.g., hooks, components).
- **Workflow-aligned**: Structure the codebase to match how features are modified.
- **Proximity-driven**: Keep related code (logic, UI, data, tests) close together.

## 6-Layer Ownership Model
1. **route-local feature**: `src/app/[locale]/.../_features/*`
2. **shared feature**: `src/features/*`
3. **site shell**: `src/components/shell`
4. **site-ui component**: `src/components/site-ui` (presentation primitives)
5. **pure shared logic**: `src/lib`, `src/config`
6. **authored content**: `src/content`, `storage/editor`
