import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { parse as parseJsonc } from 'jsonc-parser';

import {
    commitDesignFixture,
    createDesignFixture,
} from './fixtures/design.mjs';

const cli = path.resolve('packages/create-frontend/bin/create-frontend.mjs');
const scratch = mkdtempSync(path.join(tmpdir(), 'sessatakuma-generator-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));
const fixture = createDesignFixture(scratch);
const design = readFileSync(path.join(fixture.repository, 'design.md'));

/**
 * @param {string} name
 * @param {readonly string[]} flags
 */
function generate(name, flags = []) {
    const target = path.join(scratch, name);
    const result = spawnSync(
        process.execPath,
        [
            cli,
            target,
            '--noRepo',
            '--noInstall',
            '--maintainer',
            'project-owner',
            ...flags,
        ],
        { encoding: 'utf8', env: fixture.env }
    );
    assert.equal(
        result.status,
        0,
        String(result.stdout) + String(result.stderr)
    );
    return target;
}

test('every dependency variant installs from a bundled frozen lockfile', () => {
    for (const framework of ['vite', 'next']) {
        for (const lucide of [true, false]) {
            for (const query of [true, false]) {
                const target = generate(`${framework}-${lucide}-${query}`, [
                    `--${framework}`,
                    lucide ? '--lucide' : '--noLucide',
                    query ? '--query' : '--noQuery',
                ]);
                const manifest = JSON.parse(
                    readFileSync(path.join(target, 'package.json'), 'utf8')
                );
                assert.equal(manifest.packageManager, 'bun@1.3.9');
                assert.equal(
                    Boolean(manifest.dependencies['lucide-react']),
                    lucide
                );
                assert.equal(
                    Boolean(manifest.dependencies['@tanstack/react-query']),
                    query
                );
                assert.equal(existsSync(path.join(target, '.husky')), false);
                assert.equal(manifest.scripts.prepare, undefined);
                const before = readFileSync(path.join(target, 'bun.lock'));
                execFileSync(
                    'bun',
                    [
                        'install',
                        '--frozen-lockfile',
                        '--lockfile-only',
                        '--ignore-scripts',
                    ],
                    { cwd: target, stdio: 'pipe' }
                );
                assert.deepEqual(
                    readFileSync(path.join(target, 'bun.lock')),
                    before
                );
                assert.deepEqual(
                    readFileSync(path.join(target, 'design.md')),
                    design
                );
                const provenance = JSON.parse(
                    readFileSync(
                        path.join(target, 'design-source.json'),
                        'utf8'
                    )
                );
                assert.equal(
                    provenance.sha256,
                    createHash('sha256').update(design).digest('hex')
                );
                assert.equal(provenance.branch, 'main');
                assert.equal(provenance.revision, fixture.revision);
                for (const file of [
                    'assets/logo-64.png',
                    'assets/LICENSE.txt',
                    'docs/reference.md',
                ]) {
                    assert.deepEqual(
                        readFileSync(path.join(target, file)),
                        readFileSync(path.join(fixture.repository, file))
                    );
                }
                assert.deepEqual(
                    readFileSync(path.join(target, 'public/favicon.png')),
                    readFileSync(
                        path.join(fixture.repository, 'assets/logo-64.png')
                    )
                );
                assert.equal(
                    readFileSync(
                        path.join(target, '.github/CODEOWNERS'),
                        'utf8'
                    ),
                    '* @project-owner\n'
                );
                for (const file of [
                    'AGENTS.md',
                    '.github/copilot-instructions.md',
                ]) {
                    assert.equal(existsSync(path.join(target, file)), false);
                }
                const workflow = readFileSync(
                    path.join(target, '.github/workflows/ci.yml'),
                    'utf8'
                );
                assert.match(workflow, /bun install --frozen-lockfile/);
                assert.doesNotMatch(
                    workflow,
                    /org-workflows|@main|npm install/
                );
                const wrangler = parseJsonc(
                    readFileSync(path.join(target, 'wrangler.jsonc'), 'utf8')
                );
                assert.equal(
                    wrangler.account_id,
                    '2aeb222b4193b179e0f6ad7c7ae4b91f'
                );
                assert.equal(wrangler.workers_dev, false);
                assert.equal(
                    wrangler.routes[0].pattern,
                    `${manifest.name}.sessatakuma.dev`
                );
                if (framework === 'next') {
                    assert.equal(wrangler.main, '.open-next/worker.js');
                    assert.equal(wrangler.services[0].service, manifest.name);
                    assert.doesNotMatch(
                        readFileSync(
                            path.join(target, 'next.config.mjs'),
                            'utf8'
                        ),
                        /output: 'export'/
                    );
                } else {
                    assert.equal(
                        wrangler.assets.not_found_handling,
                        'single-page-application'
                    );
                }
            }
        }
    }
});

test('deployment and maintainer inputs are explicit and local Git keeps hooks', () => {
    const target = path.join(scratch, 'custom-inputs');
    const result = spawnSync(
        process.execPath,
        [
            cli,
            target,
            '--local',
            '--noInstall',
            '--maintainer',
            '@other-owner',
            '--repo',
            'frontend-product',
            '--account',
            'a'.repeat(32),
            '--domain',
            'product.example.org',
            '--minimal',
        ],
        { encoding: 'utf8', env: fixture.env }
    );
    assert.equal(
        result.status,
        0,
        String(result.stdout) + String(result.stderr)
    );
    assert.equal(existsSync(path.join(target, '.git')), true);
    assert.equal(existsSync(path.join(target, '.husky/pre-commit')), true);
    assert.equal(
        readFileSync(path.join(target, '.github/CODEOWNERS'), 'utf8'),
        '* @other-owner\n'
    );
    const config = parseJsonc(
        readFileSync(path.join(target, 'wrangler.jsonc'), 'utf8')
    );
    assert.equal(config.name, 'frontend-product');
    assert.equal(config.account_id, 'a'.repeat(32));
    assert.equal(config.routes[0].pattern, 'product.example.org');
    assert.equal(existsSync(path.join(target, 'src/constants')), false);
    execFileSync(
        'bun',
        ['install', '--frozen-lockfile', '--lockfile-only', '--ignore-scripts'],
        { cwd: target, stdio: 'pipe' }
    );
});

test('missing or conflicting required inputs fail before writing a scaffold', () => {
    const cases = [
        ['--noRepo', '--noInstall'],
        ['--noRepo', '--local', '--maintainer', 'owner'],
        [
            '--noRepo',
            '--maintainer',
            'owner',
            '--domain',
            'https://example.org',
        ],
        ['--noRepo', '--maintainer', 'owner', '--account', 'invalid'],
        ['--noRepo', '--maintainer', 'owner', '--repo', 'someone-else/project'],
        ['--noRepo', '--maintainer', 'owner', '--npm'],
    ];
    for (const [index, flags] of cases.entries()) {
        const target = path.join(scratch, `invalid-${index}`);
        const result = spawnSync(process.execPath, [cli, target, ...flags], {
            encoding: 'utf8',
        });
        assert.notEqual(result.status, 0);
        assert.equal(existsSync(target), false);
    }
});

test('frozen install rejects manifest changes instead of resolving a new lock', () => {
    const target = generate('broken-lock');
    const manifest = JSON.parse(
        readFileSync(path.join(target, 'package.json'), 'utf8')
    );
    manifest.dependencies['lucide-react'] = '0.554.0';
    writeFileSync(path.join(target, 'package.json'), JSON.stringify(manifest));
    const result = spawnSync(
        'bun',
        ['install', '--frozen-lockfile', '--lockfile-only', '--ignore-scripts'],
        { cwd: target, encoding: 'utf8' }
    );
    assert.notEqual(result.status, 0);
});

test('each CLI run copies the newly fetched main snapshot and records its revision', () => {
    const before = generate('design-before');
    writeFileSync(
        path.join(fixture.repository, 'design.md'),
        '# Latest design\n\nNew main content.\n'
    );
    writeFileSync(
        path.join(fixture.repository, 'docs/new-reference.md'),
        '# New reference\n\nKeep  these spaces.  \n'
    );
    writeFileSync(
        path.join(fixture.repository, 'assets/logo-64.png'),
        Buffer.from('updated-logo')
    );
    const latest = commitDesignFixture(fixture.repository);
    const after = generate('design-after');
    const provenance = JSON.parse(
        readFileSync(path.join(after, 'design-source.json'), 'utf8')
    );
    assert.notEqual(latest, fixture.revision);
    assert.equal(provenance.revision, latest);
    assert.equal(
        provenance.sha256,
        createHash('sha256')
            .update(readFileSync(path.join(after, 'design.md')))
            .digest('hex')
    );
    assert.deepEqual(readFileSync(path.join(before, 'design.md')), design);
    for (const file of [
        'design.md',
        'assets/logo-64.png',
        'docs/new-reference.md',
    ]) {
        assert.deepEqual(
            readFileSync(path.join(after, file)),
            readFileSync(path.join(fixture.repository, file))
        );
    }
    assert.deepEqual(
        readFileSync(path.join(after, 'public/favicon.png')),
        readFileSync(path.join(fixture.repository, 'assets/logo-64.png'))
    );
    assert.match(
        readFileSync(path.join(after, 'README.md'), 'utf8'),
        new RegExp(latest)
    );
});

test('main without optional reference docs still copies its guide and assets', () => {
    rmSync(path.join(fixture.repository, 'docs'), { recursive: true });
    const revision = commitDesignFixture(fixture.repository);
    const target = generate('design-without-docs');
    assert.equal(existsSync(path.join(target, 'docs')), false);
    assert.deepEqual(
        readFileSync(path.join(target, 'design.md')),
        readFileSync(path.join(fixture.repository, 'design.md'))
    );
    assert.equal(
        JSON.parse(
            readFileSync(path.join(target, 'design-source.json'), 'utf8')
        ).revision,
        revision
    );
});

test('a failed design fetch or incomplete main snapshot stops before creating the target', () => {
    for (const failure of ['fetch', 'archive']) {
        const target = path.join(scratch, `design-failure-${failure}`);
        const result = spawnSync(
            process.execPath,
            [cli, target, '--noRepo', '--noInstall', '--maintainer', 'owner'],
            {
                encoding: 'utf8',
                env: { ...fixture.env, MOCK_DESIGN_FAIL: failure },
            }
        );
        assert.notEqual(result.status, 0);
        assert.equal(existsSync(target), false);
        assert.match(
            String(result.stdout) + String(result.stderr),
            /Cannot bundle .*design\.md main/
        );
    }
    rmSync(path.join(fixture.repository, 'design.md'));
    commitDesignFixture(fixture.repository);
    const target = path.join(scratch, 'missing-design-guide');
    const result = spawnSync(
        process.execPath,
        [cli, target, '--noRepo', '--noInstall', '--maintainer', 'owner'],
        { encoding: 'utf8', env: fixture.env }
    );
    assert.notEqual(result.status, 0);
    assert.equal(existsSync(target), false);
});
