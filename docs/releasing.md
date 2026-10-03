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
locks using the same age gate. Scaffolding selects the matching bundled variant;
scaffolding and CI never run lock refresh.

## Design source at creation time

Each CLI run fetches the latest `sessatakuma/design.md` main commit and copies its
guide, assets, licenses, and any reference documents into the generated repository.
The npm package ships the fetcher; it does not contain a release-time design snapshot.
Generated provenance records the fetched commit and guide SHA-256. Updating the
design repository's main branch takes effect for the next CLI run without a
generator release. Existing generated repositories retain their copied snapshot.

Tests use local Git fixtures to verify main updates and fetch/source failures.
Default preset verification fetches the actual private design repository using
your Git credentials before building each app. CI explicitly runs
`bun run verify:presets --fixture-design` to build both presets with a local Git
fixture; its repository-scoped token does not have access to the private design repo.
Upstream MIT attribution and fetched font/Lucide license notices are retained.
