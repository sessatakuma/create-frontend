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
import { join } from 'node:path';

const repository = 'https://github.com/sessatakuma/design.md';

export function fetchLatestDesign() {
    const scratch = mkdtempSync(join(tmpdir(), 'sessatakuma-design-'));
    const source = join(scratch, 'source');
    const directory = join(scratch, 'bundle');
    const dispose = () => rmSync(scratch, { recursive: true, force: true });
    try {
        execFileSync('git', ['init', '--quiet', source], { stdio: 'pipe' });
        execFileSync(
            'git',
            [
                '-C',
                source,
                'fetch',
                '--quiet',
                '--depth=1',
                '--no-tags',
                `${repository}.git`,
                'refs/heads/main',
            ],
            { stdio: 'pipe' }
        );
        const revision = execFileSync(
            'git',
            ['-C', source, 'rev-parse', '--verify', 'FETCH_HEAD'],
            { encoding: 'utf8' }
        ).trim();
        if (!/^[a-f\d]{40}$/.test(revision)) {
            throw new Error('The fetched main revision is invalid.');
        }
        const directories = execFileSync(
            'git',
            ['-C', source, 'ls-tree', '-d', '--name-only', revision],
            { encoding: 'utf8' }
        )
            .trim()
            .split('\n');
        const paths = ['design.md', 'assets'];
        if (directories.includes('docs')) {
            paths.push('docs');
        }
        const archive = execFileSync(
            'git',
            ['-C', source, 'archive', revision, ...paths],
            { maxBuffer: 64 * 1024 * 1024 }
        );
        mkdirSync(directory);
        execFileSync('tar', ['-x', '-C', directory], { input: archive });
        const guide = readFileSync(join(directory, 'design.md'));
        readFileSync(join(directory, 'assets/logo-64.png'));
        writeFileSync(
            join(directory, 'design-source.json'),
            `${JSON.stringify({ repository, branch: 'main', revision, path: 'design.md', sha256: createHash('sha256').update(guide).digest('hex') }, null, 4)}\n`
        );
        return { directory, revision, dispose };
    } catch (error) {
        dispose();
        throw new Error(`Cannot bundle ${repository} main: ${error.message}`, {
            cause: error,
        });
    }
}
