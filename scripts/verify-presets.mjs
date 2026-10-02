import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const scratch = mkdtempSync(join(tmpdir(), 'sessatakuma-presets-'));
const cli = resolve('packages/create-frontend/bin/create-frontend.mjs');
try {
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
            { stdio: 'inherit' }
        );
        execFileSync('bun', ['run', 'check'], {
            cwd: target,
            stdio: 'inherit',
        });
    }
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
