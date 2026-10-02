import { execFileSync } from 'node:child_process';
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
    bunVersion,
    lockVariant,
    projectPackage,
} from '../packages/create-frontend/bin/org.mjs';

if (
    execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim() !==
    bunVersion
) {
    throw new Error(`Refresh locks with Bun ${bunVersion}.`);
}
const destination = resolve('packages/create-frontend/lockfiles');
mkdirSync(destination, { recursive: true });
const scratch = mkdtempSync(join(tmpdir(), 'sessatakuma-locks-'));
try {
    for (const framework of ['vite', 'next']) {
        for (const lucide of [false, true]) {
            for (const query of [false, true]) {
                const variant = lockVariant(framework, lucide, query);
                const target = join(scratch, variant);
                mkdirSync(target);
                writeFileSync(
                    join(target, 'package.json'),
                    `${JSON.stringify(projectPackage(framework, lucide, query), null, 4)}\n`
                );
                writeFileSync(
                    join(target, 'bunfig.toml'),
                    '[install]\nminimumReleaseAge = 604800\n'
                );
                execFileSync(
                    'bun',
                    ['install', '--lockfile-only', '--ignore-scripts'],
                    { cwd: target, stdio: 'inherit' }
                );
                copyFileSync(
                    join(target, 'bun.lock'),
                    join(destination, `${variant}.lock`)
                );
                console.log(`Refreshed ${variant}`);
            }
        }
    }
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
