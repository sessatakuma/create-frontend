# CLI options

Use Bun 1.3.9 and Node.js 22.22.2. The org port fixes the package manager to Bun
so local development, CI, and Cloudflare Builds use the same committed locks.
`--bun` is accepted for explicit invocation.

| Option                   | Behavior                                                                                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[directory]`            | Empty target directory; its basename must be a lowercase project slug. Defaults to the current directory.                                            |
| `--vite`, `--next`       | Vite SPA or Next.js/OpenNext Workers preset. Interactive runs ask; unattended runs use Vite.                                                         |
| `--maintainer <login>`   | Target maintainer and CODEOWNER. For remote creation, defaults to the authenticated creator and must be an org member. Required in local-only modes. |
| `--repo <name>`          | Repository/Worker slug; always owned by sessatakuma. Defaults to the directory basename.                                                             |
| `--private`, `--public`  | Explicit visibility. Interactive runs ask; unattended runs use private.                                                                              |
| `--account <id>`         | Declared 32-character Cloudflare account ID. Defaults to the account in the org profile.                                                             |
| `--domain <hostname>`    | Declared custom domain. Defaults to `<repo>.sessatakuma.dev`; workers.dev production routing is disabled.                                            |
| `--local`                | Initialize local Git only; retain hooks and policy files.                                                                                            |
| `--noRepo`               | Generate files without initializing Git; omit the active Git hook.                                                                                   |
| `--noInstall`            | Write the bundled lock but skip installation. Later use `bun install --frozen-lockfile`.                                                             |
| `--styled`, `--minimal`  | Styled starter tokens or a minimal reset. Design guidance is included in either mode.                                                                |
| `--lucide`, `--noLucide` | Include/omit Lucide (included by default).                                                                                                           |
| `--query`, `--noQuery`   | Include/omit TanStack Query and provider (omitted by default).                                                                                       |
| `--open`, `--noOpen`     | Open/keep closed the Vite dev browser (closed by default).                                                                                           |
| `--help`                 | Show usage.                                                                                                                                          |

Default creation requires authenticated GitHub CLI access, Git author identity,
permission to create the org repository, grant its maintainer access, and create
repository rulesets. An existing name is an error. `--local` and `--noRepo` are
intentional modes; missing authentication does not switch modes.

Remote creation grants the named maintainer `maintain` access and verifies write
access. It pushes the initial `main` commit before applying a one-review ruleset,
required frontend/convention checks, force-push/deletion prevention, and squash
merge settings. Required reviewer and repository policy features must be
available. If a remote step fails after creation, the command reports failure;
inspect the already-created repository and finish that step before retrying.

Every scaffold includes local `.github` policy/workflow files and root
`design.md`, `design-source.json`, `assets/`, and reference `docs/` when present upstream.
During every CLI run, Git fetches the latest `sessatakuma/design.md` main revision.
The CLI copies the guide, assets, licenses, and any reference documents from that
single commit, preserves their bytes, and records the revision and guide checksum.
The generated favicon uses the fetched logo. Git and network access are required
with read access to the private design repository in all modes, including
`--local` and `--noRepo`. Configure Git's GitHub credentials first (for example,
`gh auth login` followed by `gh auth setup-git`). A failed fetch or incomplete
source stops creation before the scaffold is written; there is no cached design fallback.
Org PR-template inheritance, shared CI fallback, and config injection are not used.

## Examples

```bash
node packages/create-frontend/bin/create-frontend.mjs review-client --next --maintainer product-owner
node packages/create-frontend/bin/create-frontend.mjs card-tool --vite --query --public
node packages/create-frontend/bin/create-frontend.mjs local-preview --noRepo --maintainer your-login --noInstall
node packages/create-frontend/bin/create-frontend.mjs custom-product --account 0123456789abcdef0123456789abcdef --domain product.example.org
```

Install/CI errors never refresh a lockfile automatically. To intentionally change
app dependencies, edit `package.json`, run `bun install`, and commit the updated
manifest and lockfile together.
