# Sessatakuma Frontend

Create a Sessatakuma frontend repository with strict React/TypeScript tooling,
repository-local CI and policies, frozen Bun lockfiles, and Cloudflare deployment
configuration. This is the org-specific fork of [Rail](https://github.com/sago-cream/rail).

## Create a frontend

The package is prepared as `@sessatakuma/create-frontend`. Until its first npm
release, use the checked-out CLI:

```bash
bun install --frozen-lockfile
node packages/create-frontend/bin/create-frontend.mjs my-product --vite
```

Once published:

```bash
bunx @sessatakuma/create-frontend my-product --vite
```

The default flow creates `sessatakuma/my-product`, uses the authenticated creator
as maintainer, installs from a bundled frozen lockfile, pushes an initial
Conventional Commit to `main`, and applies the checked-in repository ruleset.
Pass `--maintainer another-member` to name another org member. CODEOWNERS always
names that target maintainer; remote setup verifies write access.

For a scaffold without creating a GitHub repository:

```bash
node packages/create-frontend/bin/create-frontend.mjs my-product --noRepo --maintainer your-login
```

## Included

- Vite SPA or Next.js/OpenNext for Cloudflare Workers
- Bun 1.3.9, Node.js 22.22.2, strict TypeScript and ESLint, Prettier, and a seven-day dependency age gate
- Checked-in lockfiles for every Lucide/TanStack Query combination; installation always uses `--frozen-lockfile`
- Local CI for frontend/config checks and PR conventions, with Actions pinned to commit SHAs
- Local PR template, maintainer CODEOWNERS, and repository ruleset
- The latest `sessatakuma/design.md` main snapshot fetched during creation: exact guide, assets, licenses, and any reference documents, with the fetched commit and SHA-256 recorded
- A default starter matching the guide: locally loaded Noto Sans JP, warm gray canvas, sage header/footer, original bear, shared contact details, and responsive wordmark
- Explicit Cloudflare account, Worker name, custom domain, build/preview/deploy commands, and Workers Builds instructions

Generated repos use their committed configuration. Authentication, dependency,
configuration, permission, or policy failures stop the command with an error.
Local-only modes are explicit choices. No AGENTS.md or Copilot instructions are
generated.

Every creation mode requires Git, network access, and authenticated read access to
the private `sessatakuma/design.md` repository. The CLI fetches main once, copies that exact commit into the new repository,
and fails before writing the scaffold if the fetch or source bundle is incomplete.
Generated repositories keep their copied design snapshot until deliberately updated.

Cloudflare files use the account declared in Jacarda's configuration,
`2aeb222b4193b179e0f6ad7c7ae4b91f`, and `<repo>.sessatakuma.dev`. Both values can be
explicitly overridden. Scaffolding prepares these files; it does not deploy a
Worker or connect Workers Builds.

[CLI options](docs/CLI.md) · [Release and bundle maintenance](docs/releasing.md)

## Verify

```bash
bun install --frozen-lockfile
bun run check
bun run test
bun run verify:presets
```

The preset verification performs real frozen installs, checks, Cloudflare builds,
and deployment dry runs for Vite and Next.js, fetching live design main through
your Git credentials. CI runs `bun run verify:presets --fixture-design` with an
explicit local Git fixture because its token is scoped to this repository.
The CLI itself always fetches the real design repository. GitHub creation tests use mocks.
