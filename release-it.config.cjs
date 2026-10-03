module.exports = {
    git: {
        commitMessage: 'chore: release Sessatakuma Frontend v${version}',
        tagName: 'v${version}',
    },
    github: {
        autoGenerate: true,
        release: true,
    },
    hooks: {
        'before:bump': 'bun run check',
        'after:bump': 'node scripts/sync-release-version.mjs',
        'before:git:release':
            'git add packages/create-frontend/package.json',
        'after:git:release':
            'npm publish ./packages/create-frontend --registry=https://registry.npmjs.org',
    },
    npm: {
        publish: false,
    },
};
