import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { organization } from './org.mjs';

function gh(args, cwd, input) {
    return execFileSync('gh', args, {
        cwd,
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
}

export function authenticatedMaintainer() {
    gh(['auth', 'status']);
    return gh(['api', 'user', '--jq', '.login']);
}

export function verifyGitHubPlan(plan) {
    const login = gh(['api', `users/${plan.maintainer}`, '--jq', '.login']);
    if (login.toLowerCase() !== plan.maintainer.toLowerCase()) {
        throw new Error('GitHub returned a different maintainer login.');
    }
    gh(['api', `orgs/${organization}/members/${plan.maintainer}`, '--silent']);
    const permission = gh(['api', `orgs/${organization}`, '--jq', '.login']);
    if (permission !== organization) {
        throw new Error(`Cannot access ${organization}.`);
    }
    const repos = JSON.parse(
        gh([
            'api',
            '--method',
            'GET',
            `orgs/${organization}/repos`,
            '-f',
            `type=all`,
            '-f',
            'per_page=100',
            '--paginate',
            '--slurp',
        ])
    ).flat();
    if (
        repos.some(
            (repo) => repo.name.toLowerCase() === plan.repoName.toLowerCase()
        )
    ) {
        throw new Error(
            `Repository ${organization}/${plan.repoName} already exists.`
        );
    }
    execFileSync('git', ['var', 'GIT_AUTHOR_IDENT'], {
        encoding: 'utf8',
        stdio: 'pipe',
    });
}

export function createGitHubRepo(plan, target) {
    const repository = `${organization}/${plan.repoName}`;
    gh(
        [
            'repo',
            'create',
            repository,
            `--${plan.visibility}`,
            '--source=.',
            '--remote=origin',
        ],
        target
    );
    // A named maintainer must have write access before GitHub can use CODEOWNERS.
    gh(
        [
            'api',
            '--method',
            'PUT',
            `repos/${repository}/collaborators/${plan.maintainer}`,
            '-f',
            'permission=maintain',
        ],
        target
    );
    const permission = JSON.parse(
        gh(
            [
                'api',
                `repos/${repository}/collaborators/${plan.maintainer}/permission`,
            ],
            target
        )
    );
    if (!['write', 'maintain', 'admin'].includes(permission.permission)) {
        throw new Error(
            `Repository created, but @${plan.maintainer} does not yet have write access. Accept any pending invitation and finish repository setup.`
        );
    }
    execFileSync('git', ['add', '.'], { cwd: target, stdio: 'inherit' });
    execFileSync(
        'git',
        [
            '-c',
            'core.hooksPath=/dev/null',
            'commit',
            '-m',
            'chore: initialize sessatakuma frontend',
        ],
        { cwd: target, stdio: 'inherit' }
    );
    execFileSync('git', ['push', '-u', 'origin', 'main'], {
        cwd: target,
        stdio: 'inherit',
    });
    gh(
        [
            'api',
            '--method',
            'PATCH',
            `repos/${repository}`,
            '-f',
            'default_branch=main',
            '-F',
            'allow_squash_merge=true',
            '-F',
            'allow_merge_commit=false',
            '-F',
            'allow_rebase_merge=false',
            '-F',
            'delete_branch_on_merge=true',
        ],
        target
    );
    const ruleset = readFileSync(join(target, '.github/ruleset.json'), 'utf8');
    gh(
        [
            'api',
            '--method',
            'POST',
            `repos/${repository}/rulesets`,
            '--input',
            '-',
        ],
        target,
        ruleset
    );
}
