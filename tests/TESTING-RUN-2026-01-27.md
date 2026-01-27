# Testing Run — 2026-01-27

## Commands
- `npm run lint`
- `npm run build`

## Results
- Lint: completed with existing warnings (React Hook deps + img usage).
- Build: compiled successfully and generated pages, but emitted a runtime warning during build:
  - `Dynamic server usage: Route /api/talents/verification-status couldn't be rendered statically because it used request.headers`

## Notes
- Build uses `--no-lint` and skips type checks by default in this project.
