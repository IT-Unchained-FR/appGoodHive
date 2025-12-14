# Environment Configuration

This repository should never contain real credentials. Store secrets in your vault (.env files managed locally) and share via 1Password/secure channel only.

## Local setup
- Copy `.env.example` to `.env.local` and fill values from the shared vault.
- Keep `.env.local` out of git; it is already ignored.

## Rotating/adding secrets
- Add new keys to the vault and document the variable name and purpose (not the value) in team notes.
- If a secret is accidentally committed, remove it from git history and rotate the key immediately.

## Services tracked
Reference values exist for: database, authentication, Google APIs, AI providers, blockchain, storage, email, analytics.

For help, contact the maintainers before pushing changes involving environment keys.
