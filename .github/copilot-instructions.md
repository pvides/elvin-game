# Elvin Game Repository — Copilot Instructions

## Security — Pre-commit & Pre-push Checklist

Before every commit and push:

1. **Secret Scanning** — Ensure no secrets are staged:
   - Scan for: `password`, `secret`, `token`, `api_key`, `Bearer`, `credential`, `private_key`, `BEGIN.*PRIVATE`, `ssh-rsa`, `access_token`, `client_secret`
   - Check GitHub tokens: `ghp_`, `gho_`, `github_pat`

2. **No Personal Information** — Verify no personal data in source files:
   - No email addresses
   - No usernames or account identifiers
   - No hardcoded credentials

3. **No Environment/Config Leaks** — Check for:
   - No `.env` files committed
   - No database URLs or connection strings
   - No service credentials or API keys

4. **Let gitleaks Hooks Run** — Do not bypass or skip pre-commit/pre-push hooks
   - Pre-commit: Scans staged files
   - Pre-push: Scans entire repository

The gitleaks hooks will block commits/pushes if secrets are detected.
