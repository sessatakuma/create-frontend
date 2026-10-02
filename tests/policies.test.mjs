import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const scratch = mkdtempSync(path.join(tmpdir(), 'sessatakuma-policies-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

test('missing configs and invalid config syntax fail without injection', () => {
    const target = path.join(scratch, 'config-app');
    execFileSync(
        process.execPath,
        [
            path.resolve('packages/create-frontend/bin/create-frontend.mjs'),
            target,
            '--noRepo',
            '--noInstall',
            '--maintainer',
            'owner',
        ],
        { stdio: 'pipe' }
    );
    const script = path.resolve('scripts/check-config.mjs');
    assert.equal(
        spawnSync(process.execPath, [script], { cwd: target }).status,
        0
    );
    writeFileSync(path.join(target, 'duplicate.yml'), 'key: 1\nkey: 2\n');
    assert.notEqual(
        spawnSync(process.execPath, [script], { cwd: target }).status,
        0
    );
    rmSync(path.join(target, 'duplicate.yml'));
    rmSync(path.join(target, '.prettierrc'));
    const result = spawnSync(process.execPath, [script], {
        cwd: target,
        encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(
        String(result.stderr),
        /Missing required configuration: \.prettierrc/
    );
});

test('PR checks enforce titles, branches, commit messages and conflicts', () => {
    const target = path.join(scratch, 'pr-app');
    mkdirSync(target);
    execFileSync('git', ['init', '-b', 'main'], { cwd: target, stdio: 'pipe' });
    writeFileSync(path.join(target, 'sample.txt'), 'base\n');
    execFileSync('git', ['add', '.'], { cwd: target });
    const commitOptions = [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.org',
        '-c',
        'commit.gpgSign=false',
        'commit',
        '-m',
    ];
    execFileSync('git', [...commitOptions, 'chore: initialize fixture'], {
        cwd: target,
        stdio: 'pipe',
    });
    const base = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: target,
        encoding: 'utf8',
    }).trim();
    writeFileSync(path.join(target, 'sample.txt'), 'head\n');
    execFileSync('git', ['add', '.'], { cwd: target });
    execFileSync('git', [...commitOptions, 'feat: add fixture content'], {
        cwd: target,
        stdio: 'pipe',
    });
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: target,
        encoding: 'utf8',
    }).trim();
    const eventPath = path.join(target, 'event.json');
    const script = path.resolve('scripts/check-pr.mjs');
    const event = {
        pull_request: {
            title: 'feat: add fixture content',
            base: { sha: base },
            head: { sha: head, ref: 'feat/content' },
        },
    };
    writeFileSync(eventPath, JSON.stringify(event));
    const options = {
        cwd: target,
        env: { ...process.env, GITHUB_EVENT_PATH: eventPath },
        encoding: 'utf8',
    };
    assert.equal(spawnSync(process.execPath, [script], options).status, 0);
    event.pull_request.title = 'feat: Uppercase title';
    writeFileSync(eventPath, JSON.stringify(event));
    assert.notEqual(spawnSync(process.execPath, [script], options).status, 0);
    event.pull_request.title = 'feat: add fixture content';
    event.pull_request.head.ref = 'invalid-branch';
    writeFileSync(eventPath, JSON.stringify(event));
    assert.notEqual(spawnSync(process.execPath, [script], options).status, 0);
    event.pull_request.head.ref = 'feat/content';
    writeFileSync(eventPath, JSON.stringify(event));
    writeFileSync(
        path.join(target, 'conflict.ts'),
        `${'<'.repeat(7)} HEAD\nleft\n${'='.repeat(7)}\nright\n${'>'.repeat(7)} branch\n`
    );
    assert.notEqual(spawnSync(process.execPath, [script], options).status, 0);
    rmSync(path.join(target, 'conflict.ts'));
    writeFileSync(path.join(target, 'sample.txt'), 'invalid subject\n');
    execFileSync('git', ['add', '.'], { cwd: target });
    execFileSync('git', [...commitOptions, 'Invalid commit'], {
        cwd: target,
        stdio: 'pipe',
    });
    event.pull_request.head.sha = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: target,
        encoding: 'utf8',
    }).trim();
    writeFileSync(eventPath, JSON.stringify(event));
    assert.notEqual(spawnSync(process.execPath, [script], options).status, 0);
});
