import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { createDesignFixture } from '../tests/fixtures/design.mjs';

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--fixture-design')) {
    throw new Error('Usage: bun run verify:presets [--fixture-design]');
}
const scratch = mkdtempSync(join(tmpdir(), 'sessatakuma-presets-'));
const cli = resolve('packages/create-frontend/bin/create-frontend.mjs');
try {
    const fixture = args.includes('--fixture-design')
        ? createDesignFixture(scratch)
        : null;
    if (fixture) {
        console.log(
            'Preset verification uses an explicit local design Git fixture.'
        );
    }
    for (const framework of ['vite', 'next']) {
        const target = join(scratch, `${framework}-app`);
        execFileSync(
            process.execPath,
            [
                cli,
                target,
                `--${framework}`,
                '--noRepo',
                '--maintainer',
                'sago-cream',
            ],
            { stdio: 'inherit', env: fixture ? fixture.env : process.env }
        );
        execFileSync('bun', ['run', 'check'], {
            cwd: target,
            stdio: 'inherit',
        });
    }
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
