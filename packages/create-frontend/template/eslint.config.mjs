import { completeConfigBase } from 'eslint-config-complete';

export default [
    ...completeConfigBase,

    {
        ignores: [
            '.next/**',
            '.open-next/**',
            '.cloudflare-check/**',
            '.wrangler/**',
            'assets/**',
            'dist/**',
            'node_modules/**',
            'packages/create-frontend/**',
            'release-it*.config.cjs',
            'scripts/**',
        ],
    },

    {
        rules: {
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            'import-x/no-unassigned-import': [
                'error',
                {
                    allow: ['**/*.css'],
                },
            ],
        },
    },
];
