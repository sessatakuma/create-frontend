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

const cli = path.resolve('packages/create-frontend/bin/create-frontend.mjs');
const design = readFileSync('packages/create-frontend/design/design.md');
const scratch = mkdtempSync(path.join(tmpdir(), 'sessatakuma-generator-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

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
        { encoding: 'utf8' }
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
        { encoding: 'utf8' }
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
