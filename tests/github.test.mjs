import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const scratch = mkdtempSync(path.join(tmpdir(), 'sessatakuma-github-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));
const mockBin = path.join(scratch, 'bin');
mkdirSync(mockBin);
const mock = String.raw`#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const tool = path.basename(process.argv[1]);
const args = process.argv.slice(2);
const input = args.includes('--input') ? fs.readFileSync(0, 'utf8') : '';
fs.appendFileSync(process.env.MOCK_LOG, JSON.stringify({ tool, args, input }) + '\n');
const command = args.join(' ');
if (process.env.MOCK_FAIL === 'auth' && command === 'auth status') { process.exit(1); }
if (process.env.MOCK_FAIL === 'rules' && command.includes('/rulesets')) { process.exit(1); }
if (tool === 'gh') {
  if (command === 'api user --jq .login') { console.log('creator'); }
  else if (args[1]?.startsWith('users/')) { console.log(args[1].split('/')[1]); }
  else if (command === 'api orgs/sessatakuma --jq .login') { console.log('sessatakuma'); }
  else if (command.includes('orgs/sessatakuma/repos')) { console.log(process.env.MOCK_FAIL === 'exists' ? '[[{"name":"taken"}]]' : '[[]]'); }
  else if (command.includes('/permission')) { console.log('{"permission":"maintain"}'); }
}
if (tool === 'git' && command === 'var GIT_AUTHOR_IDENT') { console.log('Creator <creator@example.org>'); }
`;
for (const tool of ['gh', 'git']) {
    writeFileSync(path.join(mockBin, tool), mock, { mode: 0o755 });
}

/**
 * @param {string} name
 * @param {readonly string[]} flags
 * @param {string} fail
 */
function invoke(name, flags = [], fail = '') {
    const target = path.join(scratch, name);
    const log = path.join(scratch, `${name}.jsonl`);
    const result = spawnSync(
        process.execPath,
        [
            path.resolve('packages/create-frontend/bin/create-frontend.mjs'),
            target,
            '--noInstall',
            ...flags,
        ],
        {
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${mockBin}:${process.env.PATH}`,
                MOCK_LOG: log,
                MOCK_FAIL: fail,
            },
        }
    );
    const calls = existsSync(log)
        ? readFileSync(log, 'utf8')
              .trim()
              .split('\n')
              .map((line) => JSON.parse(line))
        : [];
    return { target, result, calls };
}

test('creates only the org repo and CODEOWNERS names its maintainer', () => {
    const { target, result, calls } = invoke('remote-app', [
        '--maintainer',
        'product-maintainer',
        '--public',
    ]);
    assert.equal(
        result.status,
        0,
        String(result.stdout) + String(result.stderr)
    );
    assert.equal(
        readFileSync(path.join(target, '.github/CODEOWNERS'), 'utf8'),
        '* @product-maintainer\n'
    );
    const create = calls.find((call) => call.args[0] === 'repo');
    assert.deepEqual(create.args, [
        'repo',
        'create',
        'sessatakuma/remote-app',
        '--public',
        '--source=.',
        '--remote=origin',
    ]);
    assert.ok(
        calls.some(
            (call) =>
                call.args.includes(
                    'repos/sessatakuma/remote-app/collaborators/product-maintainer'
                ) && call.args.includes('permission=maintain')
        )
    );
    assert.ok(
        calls.some(
            (call) =>
                call.tool === 'git' &&
                call.args[0] === 'push' &&
                call.args.at(-1) === 'main'
        )
    );
    const rules = calls.find((call) =>
        call.args.includes('repos/sessatakuma/remote-app/rulesets')
    );
    assert.equal(JSON.parse(rules.input).enforcement, 'active');
});

test('authenticated creator is the default maintainer', () => {
    const { target, result } = invoke('creator-default');
    assert.equal(
        result.status,
        0,
        String(result.stdout) + String(result.stderr)
    );
    assert.equal(
        readFileSync(path.join(target, '.github/CODEOWNERS'), 'utf8'),
        '* @creator\n'
    );
});

test('authentication and name collisions fail without local-only fallback', () => {
    for (const [name, failure] of [
        ['unauthenticated', 'auth'],
        ['taken', 'exists'],
    ]) {
        const { target, result, calls } = invoke(name, [], failure);
        assert.notEqual(result.status, 0);
        assert.equal(existsSync(target), false);
        assert.equal(
            calls.some(
                (call) => call.tool === 'git' && call.args[0] === 'init'
            ),
            false
        );
        assert.equal(
            calls.some((call) => call.args[0] === 'repo'),
            false
        );
    }
});

test('ruleset failure reports incomplete remote setup', () => {
    const { result } = invoke('rules-fail', [], 'rules');
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout, /App scaffolded:/);
});
