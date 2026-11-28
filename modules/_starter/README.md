# Savitri module starter

Use this starter for a developer-owned, separately deployed React application. Keep the app in its assigned repository or module folder. Its Vite app is deployable independently; the registry treats it as an external product and never executes its source inside Savitri.

```bash
npm install
npm run dev
npm run build
```

The starter uses the local Savitri UI package. If you move it to a different repository, configure an approved package distribution or vendor the reviewed UI package source; do not install a similarly named unverified package.

## Integration contract

1. Receive an assignment in Savitri Livings, then sign in at `/developer` using the same Savitri account email that Admin assigned.
2. Create a public HTTPS deployment and a public GitHub repository (or ask Admin to register the approved private repository link).
3. Submit semantic version, repository, branch, optional pull request/commit/docs links, and a short change summary.
4. Admin reviews the submission, approves it, and separately publishes it. Approval does not replace a live version.
5. For a deployed application, the central route opens the deployment in a new tab. For iframe or microfrontend integration, Admin must register that exact deployment origin in the allowlist; embedded content is sandboxed.

Never put server secrets, GitHub tokens, Savitri JWTs, or unrestricted database credentials in the browser bundle. Use the Savitri API only through explicitly approved server-side credentials and scopes. The API SDK does not send bearer tokens to cross-origin hosts unless the caller explicitly allowlists the trusted Savitri API origin; it does not grant cross-origin SSO.

See [module.json](./module.json) for a sample manifest and [src/example.jsx](./src/example.jsx) for a small UI example.
