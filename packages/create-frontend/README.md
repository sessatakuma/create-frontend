# Sessatakuma Frontend

Create an org-owned React frontend with frozen Bun installs, local CI/policies,
maintainer CODEOWNERS, bundled design guidance, and Cloudflare Workers files.

```bash
bunx @sessatakuma/create-frontend my-product --vite
bunx @sessatakuma/create-frontend review-client --next --maintainer product-owner
bunx @sessatakuma/create-frontend local-preview --noRepo --maintainer your-login
```

Remote creation always targets `sessatakuma/<name>` and verifies the named
maintainer. The default maintainer is the authenticated creator; missing GitHub
access is an error. Bun 1.3.9 is required for installation. Generation prepares
Cloudflare deployment files; deployment is a later explicit command.

Every CLI run fetches `sessatakuma/design.md` main and copies its exact guide,
assets, licenses, and any references into the new app. Git and network access are
required in every mode, with authenticated Git read access to the private design
repository; fetch/source failures stop creation without a cached
fallback. The included provenance records the fetched revision and checksum.

See [CLI options](https://github.com/sessatakuma/create-frontend/blob/main/docs/CLI.md) and
[release maintenance](https://github.com/sessatakuma/create-frontend/blob/main/docs/releasing.md).
