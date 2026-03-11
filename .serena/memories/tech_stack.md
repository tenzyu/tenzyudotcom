# Tech Stack: tenzyudotcom

## Core
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime/Package Manager**: Bun
- **Nix Environment**: NixOS with `flake.nix` (contains Bun, Biome, Serena)

## UI & Styling
- **Styling**: Tailwind CSS 4.2.1
- **UI Components**: Radix UI, Base UI, Shadcn/UI (located in `src/components/ui`)
- **Icons**: Lucide React
- **Themes**: Next-themes

## i18n & Content
- **Internationalization**: Intlayer (Intlayer-editor, Next-intlayer)
- **Content**: MDX (`@mdx-js/loader`, `@next/mdx`), gray-matter (frontmatter parsing)
- **Data**: JSON-based storage in `storage/editorial/`

## Development & Testing
- **Linting & Formatting**: Biome 2.4.6 (via `./scripts/biome`)
- **Validation**: Zod 4.3.6
- **Testing**: Bun test (native runner)
- **Deployment**: Vercel (Analytics, Blob, Speed Insights)
