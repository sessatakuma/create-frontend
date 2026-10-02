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

Every app includes the pinned `sessatakuma/design.md` guide and its assets and
references. The included provenance records the source revision and checksum.

See [CLI options](https://github.com/sessatakuma/rail/blob/main/docs/CLI.md) and
[bundle maintenance](https://github.com/sessatakuma/rail/blob/main/docs/releasing.md).
