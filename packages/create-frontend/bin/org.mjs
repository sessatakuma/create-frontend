import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const organization = 'sessatakuma';
export const bunVersion = '1.3.9';
export const nodeVersion = '22.22.2';
export const cloudflareAccount = '2aeb222b4193b179e0f6ad7c7ae4b91f';

export function lockVariant(framework, lucide, query) {
    return `${framework}-${lucide ? 'lucide' : 'no-lucide'}-${query ? 'query' : 'no-query'}`;
}

export function projectPackage(framework, lucide, query) {
    const manifest = JSON.parse(
        readFileSync(
            new URL('../template/package.json', import.meta.url),
            'utf8'
        )
    );
    if (!lucide) {
        delete manifest.dependencies['lucide-react'];
    }
    if (query) {
        manifest.dependencies['@tanstack/react-query'] = '5.101.0';
    }
    if (framework === 'next') {
        manifest.dependencies.next = '16.2.7';
        manifest.dependencies['@opennextjs/cloudflare'] = '1.19.11';
        manifest.devDependencies['@next/eslint-plugin-next'] = '16.2.7';
        manifest.devDependencies['@types/node'] = '24.9.1';
        delete manifest.devDependencies.vite;
        delete manifest.devDependencies['@vitejs/plugin-react'];
        manifest.scripts.dev = 'next dev';
        manifest.scripts.build = 'next build';
        manifest.scripts['cf:build'] = 'opennextjs-cloudflare build';
        manifest.scripts.preview =
            'bun run cf:build && opennextjs-cloudflare preview';
        manifest.scripts.deploy =
            'bun run cf:build && opennextjs-cloudflare deploy -- --keep-vars';
        manifest.scripts.upload =
            'bun run cf:build && opennextjs-cloudflare upload -- --keep-vars';
        manifest.scripts['cf:deploy'] =
            'opennextjs-cloudflare deploy -- --keep-vars';
        manifest.scripts['cf:upload'] =
            'opennextjs-cloudflare upload -- --keep-vars';
        manifest.scripts['cf:typegen'] =
            'wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts';
    }
    return manifest;
}

export function writeCloudflareFiles(target, framework, name, account, domain) {
    const config = {
        $schema: './node_modules/wrangler/config-schema.json',
        name,
        account_id: account,
        compatibility_date: '2026-07-17',
        workers_dev: false,
        preview_urls: true,
        routes: [{ pattern: domain, custom_domain: true }],
        assets: {
            directory: './dist',
            not_found_handling: 'single-page-application',
        },
    };
    if (framework === 'next') {
        config.main = '.open-next/worker.js';
        config.compatibility_flags = [
            'nodejs_compat',
            'global_fetch_strictly_public',
        ];
        config.assets = { directory: '.open-next/assets', binding: 'ASSETS' };
        config.services = [{ binding: 'WORKER_SELF_REFERENCE', service: name }];
        writeFileSync(
            join(target, 'open-next.config.ts'),
            "import { defineCloudflareConfig } from '@opennextjs/cloudflare';\n\nexport default defineCloudflareConfig();\n"
        );
        writeFileSync(
            join(target, 'public/_headers'),
            '/_next/static/*\n  Cache-Control: public,max-age=31536000,immutable\n'
        );
        writeFileSync(
            join(target, '.dev.vars.example'),
            'NEXTJS_ENV=development\n'
        );
    }
    writeFileSync(
        join(target, 'wrangler.jsonc'),
        `${JSON.stringify(config, null, 4)}\n`
    );
}

export function validateName(value) {
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(value)) {
        throw new Error(
            'Project and repository names must start with a lowercase letter and contain only lowercase letters, digits, or hyphens (max 63 characters).'
        );
    }
    return value;
}

export function validateMaintainer(value) {
    const login = value.replace(/^@/, '');
    if (
        !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login) ||
        login.includes('--')
    ) {
        throw new Error('Maintainer must be a GitHub user login.');
    }
    return login;
}

export function validateAccount(value) {
    if (!/^[a-f\d]{32}$/.test(value)) {
        throw new Error(
            'Cloudflare account ID must be 32 lowercase hexadecimal characters.'
        );
    }
    return value;
}

export function validateDomain(value) {
    if (
        value.length > 253 ||
        !/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}$/.test(value)
    ) {
        throw new Error(
            'Domain must be a hostname without a scheme, path, or wildcard.'
        );
    }
    return value;
}
