import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const realGit = execFileSync('which', ['git'], { encoding: 'utf8' }).trim();

export const designGitMock = String.raw`
const designOperation = args[0] === 'init' && args[1] === '--quiet' ||
  args[0] === '-C' && ['fetch', 'rev-parse', 'ls-tree', 'archive'].includes(args[2]);
if (tool === 'git' && designOperation) {
  if (process.env.MOCK_DESIGN_FAIL === args[2]) { process.exit(1); }
  const result = require('node:child_process').spawnSync(process.env.MOCK_REAL_GIT,
    args.map(arg => arg === 'https://github.com/sessatakuma/design.md.git' ? process.env.MOCK_DESIGN_SOURCE : arg),
    { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
`;

/** @param {string} repository */
export function commitDesignFixture(repository) {
    execFileSync(realGit, ['add', '.'], { cwd: repository });
    execFileSync(
        realGit,
        [
            '-c',
            'user.name=Fixture',
            '-c',
            'user.email=fixture@example.org',
            '-c',
            'commit.gpgSign=false',
            '-c',
            'core.hooksPath=/dev/null',
            'commit',
            '-m',
            'docs: update design fixture',
        ],
        { cwd: repository, stdio: 'pipe' }
    );
    return execFileSync(realGit, ['rev-parse', 'HEAD'], {
        cwd: repository,
        encoding: 'utf8',
    }).trim();
}

/** @param {string} root */
export function createDesignFixture(root) {
    const repository = path.join(root, 'design-source');
    const bin = path.join(root, 'design-bin');
    mkdirSync(repository);
    mkdirSync(bin);
    execFileSync(realGit, ['init', '-b', 'main'], {
        cwd: repository,
        stdio: 'pipe',
    });
    mkdirSync(path.join(repository, 'assets'));
    mkdirSync(path.join(repository, 'docs'));
    writeFileSync(
        path.join(repository, 'design.md'),
        '# Design fixture\n\nKeep upstream spacing.\n'
    );
    writeFileSync(
        path.join(repository, 'assets/logo-64.png'),
        Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=',
            'base64'
        )
    );
    writeFileSync(
        path.join(repository, 'assets/LICENSE.txt'),
        'Fixture license\n'
    );
    writeFileSync(
        path.join(repository, 'assets/logo-128.png'),
        readFileSync(path.join(repository, 'assets/logo-64.png'))
    );
    mkdirSync(path.join(repository, 'assets/fonts'));
    writeFileSync(
        path.join(repository, 'assets/fonts/fonts.css'),
        ':root {}\n'
    );
    writeFileSync(
        path.join(repository, 'assets/social-icons.json'),
        JSON.stringify(
            Object.fromEntries(
                ['Instagram', 'Threads', 'Facebook', 'GitHub'].map(
                    (service) => [
                        service,
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
                    ]
                )
            )
        )
    );
    writeFileSync(
        path.join(repository, 'docs/reference.md'),
        '# Reference\n\nPreserve  upstream spacing.  \n'
    );
    const revision = commitDesignFixture(repository);
    writeFileSync(
        path.join(bin, 'git'),
        `#!${process.execPath}\nconst tool = 'git';\nconst args = process.argv.slice(2);\n${designGitMock}\nconst result = require('node:child_process').spawnSync(process.env.MOCK_REAL_GIT, args, { stdio: 'inherit' });\nprocess.exit(result.status ?? 1);\n`,
        { mode: 0o755 }
    );
    return {
        repository,
        revision,
        env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            MOCK_REAL_GIT: realGit,
            MOCK_DESIGN_SOURCE: repository,
        },
    };
}
