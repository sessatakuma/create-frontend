# Releasing Sessatakuma Frontend

The root package is private. The publishable package is
`@sessatakuma/create-frontend` in `packages/create-frontend`; publishing requires
access to the sessatakuma npm scope. The release configuration targets the fork
and the scoped package, with public npm access.

Before releasing, use Bun 1.3.9 and Node.js 22.22.2:

```bash
bun install --frozen-lockfile
bun run check
bun run test
bun run verify:presets
npm pack ./packages/create-frontend --dry-run
bun run release
```

`release-it` checks the repository, synchronizes the CLI version, commits and tags
the release, pushes it, publishes the scoped package, and creates the GitHub
release. Release only from a reviewed clean main branch. `bun run release --
--dry-run` exercises the release plan without publishing.

## Refresh dependency locks

Edit the root/template manifests or pinned framework versions in `bin/org.mjs`
first. Then deliberately regenerate and verify the locks:

```bash
bun install --lockfile-only --ignore-scripts
bun run refresh:locks
bun install --frozen-lockfile
bun run test
bun run verify:presets
```

`refresh:locks` is maintenance tooling. It writes all eight framework/icon/query
locks using the same age gate. Copy the default Vite lock to
`packages/create-frontend/template/bun.lock` when updating the template baseline.
Scaffolding and CI never run lock refresh.

## Update bundled design guidance

The initial bundle is sourced from `sessatakuma/design.md` PR #1 at the full
revision recorded in `packages/create-frontend/design/design-source.json`.
Refresh from a reviewed immutable revision:

```bash
bun run sync:design <full-reviewed-commit-sha>
bun run check
bun run test
```

The sync command copies the exact guide, assets, and references, and records its
SHA-256. It fails if the pinned guide cannot be fetched. Commit the source bundle
and provenance together; each generator release ships its own complete copy.
Upstream MIT attribution and bundled font/Lucide license notices are retained.
