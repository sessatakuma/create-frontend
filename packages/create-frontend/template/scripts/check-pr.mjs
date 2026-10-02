import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr) {
    throw new Error('PR checks require a pull_request event.');
}
const types =
    'build|chore|ci|docs|feat|fix|hotfix|perf|refactor|revert|style|test';
const conventional = new RegExp(
    `^(${types})(\\([a-z\\d._/-]+\\))?!?: [a-z].+$`
);
function checkMessage(message, label) {
    if (message.length > 75 || !conventional.test(message)) {
        throw new Error(
            `${label} must use Conventional Commits, start its description with lowercase, and be at most 75 characters: ${message}`
        );
    }
}
checkMessage(pr.title, 'PR title');
if (
    pr.head.ref !== 'dev' &&
    !new RegExp(`^(${types}|feature|bugfix)/[a-z\\d][a-z\\d-]*$`).test(
        pr.head.ref
    )
) {
    throw new Error(
        `Branch must use type/lowercase-description: ${pr.head.ref}`
    );
}
for (const sha of [pr.base.sha, pr.head.sha]) {
    if (!/^[a-f\d]{40}$/.test(sha)) {
        throw new Error('Missing or invalid PR commit SHA.');
    }
}
const subjects = execFileSync(
    'git',
    ['log', '--format=%s', `${pr.base.sha}..${pr.head.sha}`],
    { encoding: 'utf8' }
).trim();
if (!subjects) {
    throw new Error('PR commit range is empty.');
}
for (const subject of subjects.split('\n')) {
    checkMessage(subject, 'Commit subject');
}
const excluded = new Set([
    '.git',
    'node_modules',
    'dist',
    '.next',
    '.open-next',
    '.cloudflare-check',
    '.wrangler',
]);
function checkConflicts(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isDirectory() && !excluded.has(entry.name)) {
            checkConflicts(file);
        } else if (
            entry.isFile() &&
            /\.(?:[cm]?[jt]sx?|css|html|jsonc?|md|ya?ml|toml)$/.test(entry.name)
        ) {
            if (
                /^(?:<<<<<<< |=======\s*$|>>>>>>> )/m.test(
                    readFileSync(file, 'utf8')
                )
            ) {
                throw new Error(`Unresolved merge-conflict marker: ${file}`);
            }
        }
    }
}
checkConflicts(process.cwd());
console.log('PR title, branch, commit subjects, and conflict markers passed.');
