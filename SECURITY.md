# Security Policy

## Supported versions

Only the current version on `main` receives security fixes.

## Reporting vulnerabilities

Please do **not** open public issues for security problems. Use GitHub's
*Private Vulnerability Reporting* instead (the **Security → Report a
vulnerability** tab) — this keeps your report confidential until a fix is
available.

Alternatively, you can reach me via my GitHub profile
([@Trobikus](https://github.com/Trobikus)).

## Scope

Ashen Crown is a local game with no server and no accounts. It processes no
personal data other than the local save in browser storage (`localStorage`)
and sends nothing to third parties. Reports especially welcome for:

- script injection through save or input data,
- Tauri permissions (capabilities) being too broad,
- problems in the build (Vite/dependency chain).
