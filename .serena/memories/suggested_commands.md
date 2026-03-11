# Suggested Commands: tenzyudotcom

## Development
- **Start development server**: `nix develop --command bun run dev`
- **Clean build directory**: `nix develop --command bun run clean`
- **Build the project**: `nix develop --command bun run build`
- **Start production server**: `nix develop --command bun run start`

## Linting & Formatting
- **Check linting**: `nix develop --command bun run lint`
- **Fix linting issues**: `nix develop --command bun run lint:fix`
- **Check MDX documentation linting**: `nix develop --command bun run lint:docs`
- **Format code**: `nix develop --command bun run format`

## Testing
- **Run all tests**: `nix develop --command bun run test`
- **Run contract tests**: `nix develop --command bun run test:contracts`

## Verification
- **Quick verification** (lint + contract tests): `nix develop --command bun run verify:quick`
- **Full verification** (quick verification + build): `nix develop --command bun run verify`

## Other
- **Intlayer Editor**: `nix develop --command bun run start:intlayer`
- **Analyze bundle**: `nix develop --command bun run analyze`
- **Codemod shell**: `nix develop -c $SHELL --command "nix develop .#codemod"` (for npm package updates)

## System Utils (NixOS/Linux)
- Standard Linux commands: `ls`, `cd`, `grep`, `find`, `git`, `cat`, `rm`, `mkdir`, etc.
- Use `nix develop --command <cmd>` to ensure dependencies are available.
