import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const revision = process.argv[2];
if (!/^[a-f\d]{40}$/.test(revision ?? '')) {
    throw new Error(
        'Usage: node scripts/sync-design.mjs <full reviewed commit SHA>'
    );
}
const scratch = mkdtempSync(join(tmpdir(), 'sessatakuma-design-'));
const destination = resolve('packages/create-frontend/design');
try {
    execFileSync('git', ['init', scratch], { stdio: 'pipe' });
    execFileSync(
        'git',
        [
            '-C',
            scratch,
            'fetch',
            '--depth=1',
            'https://github.com/sessatakuma/design.md.git',
            revision,
        ],
        { stdio: 'inherit' }
    );
    // Fetch the guide before changing the existing bundle; a missing source is fatal.
    const guide = execFileSync('git', [
        '-C',
        scratch,
        'show',
        `${revision}:design.md`,
    ]);
    const archive = execFileSync(
        'git',
        ['-C', scratch, 'archive', revision, 'design.md', 'assets', 'docs'],
        { maxBuffer: 32 * 1024 * 1024 }
    );
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(destination, { recursive: true });
    execFileSync('tar', ['-x', '-C', destination], { input: archive });
    if (!readFileSync(join(destination, 'design.md')).equals(guide)) {
        throw new Error('Bundled design.md differs from the pinned source.');
    }
    writeFileSync(
        join(destination, 'design-source.json'),
        `${JSON.stringify({ repository: 'https://github.com/sessatakuma/design.md', revision, path: 'design.md', sha256: createHash('sha256').update(guide).digest('hex') }, null, 4)}\n`
    );
    console.log(`Bundled design.md and references at ${revision}`);
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
