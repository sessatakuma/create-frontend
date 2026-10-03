#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { fetchLatestDesign } from './design.mjs';
import { formatScaffold } from './format.mjs';
import {
    authenticatedMaintainer,
    createGitHubRepo,
    verifyGitHubPlan,
} from './github.mjs';
import {
    bunVersion,
    cloudflareAccount,
    lockVariant,
    organization,
    projectPackage,
    validateAccount,
    validateDomain,
    validateMaintainer,
    validateName,
    writeCloudflareFiles,
} from './org.mjs';
import {
    closePrompts,
    confirm,
    fail,
    gap,
    intro,
    ready,
    section,
    select,
    text,
} from './ui.mjs';

const templatePath = new URL('../template/', import.meta.url);
const rawArgs = process.argv.slice(2);
if (rawArgs.includes('--help')) {
    console.log(`Sessatakuma Frontend

Usage: create-frontend [directory] [options]

Creates sessatakuma/<name> with maintainer CODEOWNERS and Cloudflare files.
  --vite / --next              Framework (default: Vite)
  --maintainer <login>         CODEOWNER (default: authenticated GitHub creator)
  --repo <name>                Repository and Worker name (default: directory name)
  --private / --public        Visibility (default: private)
  --account <id>              Declared Cloudflare account (default: Sessatakuma account)
  --domain <host>             Custom domain (default: <repo>.sessatakuma.dev)
  --local / --noRepo          Explicit local Git / no Git mode; requires --maintainer
  --noInstall                 Skip frozen dependency installation
  --styled / --minimal        Starter CSS (default: styled)
  --lucide / --noLucide        Icons (default: included)
  --query / --noQuery          TanStack Query (default: omitted)
  --open / --noOpen            Vite dev browser (default: closed)

Every run fetches sessatakuma/design.md main; Git and network access are required.
Use Bun ${bunVersion}. Deployment occurs only when you run the generated deploy script.`);
    process.exit(0);
}
const parsedArgs = parseCliArgs(rawArgs);
const selectedPackageManager = 'bun';
let selectedFramework = resolveFramework(parsedArgs);
let selectedStyling = resolveStyling(parsedArgs);
let shouldIncludeLucide = parsedArgs.lucide ?? true;
let shouldIncludeQuery = parsedArgs.query ?? false;
let shouldOpenBrowser = parsedArgs.open ?? false;
let shouldInstallDependencies = !parsedArgs.noInstall;
const shouldSkipRepoSetup = parsedArgs.noRepo;
const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
const targetArg = parsedArgs.targetArg ?? '.';
const targetPath = resolve(targetArg);
const appName = validateName(basename(targetPath));
let projectPlan;

main().catch((error) => {
    fail(error.message);
});

async function main() {
    if (existsSync(targetPath) && readdirSync(targetPath).length > 0) {
        fail(`Target directory is not empty: ${targetPath}`);
    }

    intro(appName, targetPath);
    selectedFramework = await planFramework();
    selectedStyling = await planStyling();
    shouldIncludeLucide = await planLucide();
    shouldIncludeQuery = await planQuery();
    shouldOpenBrowser = await planOpenBrowser();
    const repoPlan = await planRepoSetup();
    projectPlan = repoPlan;
    shouldInstallDependencies = await planInstallDependencies();
    closePrompts();
    if (
        shouldInstallDependencies &&
        run('bun', ['--version'], { capture: true }).trim() !== bunVersion
    ) {
        throw new Error(
            `Use Bun ${bunVersion}, matching the bundled locks and CI.`
        );
    }
    if (repoPlan.github) {
        verifyGitHubPlan(repoPlan);
    }

    section('Fetching sessatakuma/design.md main');
    const design = fetchLatestDesign();
    try {
        console.log(`- design revision: ${design.revision}`);
        await scaffold(repoPlan, design);
    } finally {
        design.dispose();
    }
}

async function scaffold(repoPlan, design) {
    section(`Copying ${frameworkLabel(selectedFramework)} template`);
    cpSync(templatePath, targetPath, { recursive: true });
    renameSync(join(targetPath, 'gitignore'), join(targetPath, '.gitignore'));
    cpSync(design.directory, targetPath, { recursive: true });
    cpSync(
        join(design.directory, 'assets/logo-64.png'),
        join(targetPath, 'public/favicon.png')
    );
    const brandPath = join(targetPath, 'public/brand');
    mkdirSync(brandPath, { recursive: true });
    cpSync(
        join(design.directory, 'assets/logo-128.png'),
        join(brandPath, 'logo-128.png')
    );
    const socialIcons = JSON.parse(
        readFileSync(join(design.directory, 'assets/social-icons.json'), 'utf8')
    );
    for (const service of ['Instagram', 'Threads', 'Facebook', 'GitHub']) {
        writeFileSync(
            join(brandPath, `${service.toLowerCase()}.svg`),
            `${socialIcons[service]}\n`
        );
    }
    writeFileSync(
        join(targetPath, '.github/CODEOWNERS'),
        `* @${repoPlan.maintainer}\n`
    );
    writeCloudflareFiles(
        targetPath,
        selectedFramework,
        repoPlan.repoName,
        repoPlan.account,
        repoPlan.domain
    );

    updatePackageJson(repoPlan);
    updateBunLock();
    console.log();
    section('Customizing project files');
    console.log(`- framework: ${frameworkLabel(selectedFramework)}`);
    console.log(`- styling: ${stylingLabel(selectedStyling)}`);
    console.log(
        `- Lucide icons: ${shouldIncludeLucide ? 'included' : 'skipped'}`
    );
    console.log(
        `- TanStack Query: ${shouldIncludeQuery ? 'included' : 'skipped'}`
    );
    if (selectedFramework === 'vite') {
        console.log(
            `- open browser on dev start: ${shouldOpenBrowser ? 'enabled' : 'disabled'}`
        );
    }
    console.log(`- package.json: name, version, scripts, packageManager`);
    logFrameworkFileChanges();
    console.log(`- .gitignore: framework build artifacts`);
    console.log(`- README.md: install/dev/check commands`);
    console.log(`- package manager config: ${packageManagerConfigFile()}`);
    if (selectedPackageManager === 'bun') {
        console.log(`- bun.lock: package name`);
    }
    updateFrameworkFiles();
    updateAppText();
    updateGitIgnore();
    updatePackageManagerFiles();
    updateGitHooks(repoPlan);
    writeAppReadme(design.revision);
    await formatScaffold(targetPath);

    applyLocalRepoPlan(repoPlan);

    if (shouldInstallDependencies) {
        console.log();
        section(`Installing dependencies with ${selectedPackageManager}`);
        installDependencies();
    }

    if (repoPlan.github) {
        section(`Creating ${organization}/${repoPlan.repoName}`);
        createGitHubRepo(repoPlan, targetPath);
    }

    ready(appName, nextSteps());
}

function run(command, args, options = {}) {
    try {
        return execFileSync(command, args, {
            cwd: options.cwd,
            encoding: options.capture ? 'utf8' : undefined,
            stdio: options.capture ? 'pipe' : 'inherit',
        });
    } catch (error) {
        const details = error.stderr?.toString().trim() || error.message;
        throw new Error(
            `Failed to run: ${command} ${args.join(' ')}\n${details}`,
            { cause: error }
        );
    }
}

function updatePackageJson(repoPlan) {
    const manifest = projectPackage(
        selectedFramework,
        shouldIncludeLucide,
        shouldIncludeQuery
    );
    manifest.name = appName;
    manifest.version = '0.1.0';
    delete manifest.repository;
    if (!repoPlan.git) {
        delete manifest.scripts.prepare;
    }
    writeFileSync(
        join(targetPath, 'package.json'),
        `${JSON.stringify(manifest, null, 4)}\n`
    );
}

function updateBunLock() {
    const variant = lockVariant(
        selectedFramework,
        shouldIncludeLucide,
        shouldIncludeQuery
    );
    const lock = readFileSync(
        new URL(`../lockfiles/${variant}.lock`, import.meta.url),
        'utf8'
    );
    writeFileSync(
        join(targetPath, 'bun.lock'),
        lock.replace(
            '"name": "sessatakuma-frontend-template"',
            `"name": "${appName}"`
        )
    );
}

function updateAppText() {
    if (selectedFramework === 'vite') {
        replaceInFile(
            join(targetPath, 'index.html'),
            '<title>Sessatakuma Frontend</title>',
            {
                with: `<title>${appName}</title>`,
            }
        );
    }

    writeFileSync(join(targetPath, 'src/components/App.tsx'), appComponent());
}

function updateFrameworkFiles() {
    if (selectedFramework === 'next') {
        writeNextAppFiles();
        return;
    }

    const viteConfigPath = join(targetPath, 'vite.config.mjs');
    replaceInFile(
        viteConfigPath,
        '    server: {\n        open: true,\n    },\n',
        { with: '' }
    );
    if (shouldOpenBrowser) {
        replaceInFile(viteConfigPath, '    plugins: [react()],\n', {
            with: '    plugins: [react()],\n    server: {\n        open: true,\n    },\n',
        });
    }
    writeFileSync(join(targetPath, 'src/main.tsx'), viteMain());
    updateStylingFiles(join(targetPath, 'src/global.css'));
}

function updateStylingFiles(globalCssPath) {
    if (selectedStyling === 'styled') {
        const prefix = selectedFramework === 'next' ? '../../' : '../';
        writeFileSync(
            globalCssPath,
            `@import '${prefix}assets/fonts/fonts.css';\n${readFileSync(globalCssPath, 'utf8')}`
        );
        return;
    }

    rmSync(join(targetPath, 'src/constants'), { force: true, recursive: true });
    for (const file of [
        'App.css',
        'SiteHeader.tsx',
        'SiteHeader.css',
        'SiteFooter.tsx',
        'SiteFooter.css',
    ]) {
        rmSync(join(targetPath, 'src/components', file), { force: true });
    }
    writeFileSync(globalCssPath, minimalGlobalCss());
}

function updateGitIgnore() {
    if (selectedFramework !== 'next') {
        return;
    }

    appendGitIgnoreEntries([
        '.next/',
        '.open-next/',
        'next-env.d.ts',
        'cloudflare-env.d.ts',
    ]);
}

function updatePackageManagerFiles() {
    writeFileSync(
        join(targetPath, 'bunfig.toml'),
        '[install]\nminimumReleaseAge = 604800\n'
    );
}

function updateGitHooks(repoPlan) {
    const huskyPath = join(targetPath, '.husky');

    if (!repoPlan.git) {
        rmSync(huskyPath, { force: true, recursive: true });
        return;
    }

    writeFileSync(join(huskyPath, 'pre-commit'), `${lintStagedCommand()}\n`);
}

function installDependencies() {
    run('bun', ['install', '--frozen-lockfile'], { cwd: targetPath });
}

function writeAppReadme(designRevision) {
    const next = selectedFramework === 'next';
    const readme = `# ${appName}

Created with Sessatakuma Frontend for ${organization}/${projectPlan.repoName}.
Maintainer: @${projectPlan.maintainer}.

Read [design.md](design.md) before making interface changes. The guide, assets,
and any reference documents are copied from [sessatakuma/design.md main](https://github.com/sessatakuma/design.md/tree/${designRevision}) fetched when this repository was created.
The exact source and checksum are recorded in [design-source.json](design-source.json).

## Development

Use Bun ${bunVersion} and Node.js 22.22.2, matching CI.

\`\`\`bash
bun install --frozen-lockfile
bun run dev
bun run check
\`\`\`

The checked-in lockfile and local ESLint/Prettier/config-check scripts are required.
Checks fail when they are missing. Dependency updates are deliberate: edit the
manifest, run \`bun install\` to update the lock, and commit both files.
The install age gate remains seven days.

## Cloudflare

The Worker is \`${projectPlan.repoName}\`, in account \`${projectPlan.account}\`,
with the custom domain \`${projectPlan.domain}\`. Review these declared values in
[wrangler.jsonc](wrangler.jsonc) before deployment.
${next ? '\nNext.js uses OpenNext for the Workers runtime. The starter has no ISR/R2 cache bindings; configure those explicitly when adding cached routes. Copy `.dev.vars.example` to `.dev.vars` for Workers preview development.\n' : ''}

\`\`\`bash
bun run cf:build
bun run cf:check
bun run preview
bun run deploy
\`\`\`

The generator prepares files; deployment happens when you run \`bun run deploy\`.
Authenticate Wrangler to the declared account first. For Cloudflare Workers
Builds, connect this repository and use:

- Install command: \`bun install --frozen-lockfile\`
- Build command: \`bun run cf:build\`
- Deploy command: \`bun run cf:deploy\`
- Preview version command: \`bun run cf:upload\`
- Production branch: \`main\`
- Bun version: \`${bunVersion}\`; Node.js version: \`22.22.2\`

Keep application secrets in Cloudflare, and document required names in an
example env file. Deploy scripts preserve runtime variables with \`--keep-vars\`.

## Repository checks

CI runs the same \`bun run check\` command as local development. PRs also validate
Conventional Commit titles/messages, branch names, and merge-conflict markers.
Use \`style\` for formatting; use \`feat\` or \`fix\` for CSS behavior/appearance changes.
The repository includes its own PR template, maintainer CODEOWNERS, and main
branch ruleset. Remote creation applies the rules after the initial main push;
local-only scaffolds retain [the ruleset](.github/ruleset.json) for later setup.
`;
    writeFileSync(join(targetPath, 'README.md'), readme);
}

async function planFramework() {
    if (parsedArgs.framework || !isInteractive) {
        return selectedFramework;
    }

    const framework = await select({
        message: 'Framework',
        options: [
            { label: 'Vite', value: 'vite' },
            { label: 'Next.js', value: 'next' },
        ],
        initialValue: 'vite',
    });
    gap();

    return framework;
}

async function planStyling() {
    if (parsedArgs.styling || !isInteractive) {
        return selectedStyling;
    }

    const styling = await select({
        message: 'Starter styling',
        options: [
            { label: 'Styled', value: 'styled' },
            { label: 'Minimal', value: 'minimal' },
        ],
        initialValue: 'styled',
    });
    gap();

    return styling;
}

async function planLucide() {
    if (parsedArgs.lucide !== null || !isInteractive) {
        return shouldIncludeLucide;
    }

    const includeLucide = await confirm({
        message: 'Include Lucide icons?',
        initialValue: true,
    });
    gap();

    return includeLucide;
}

async function planQuery() {
    if (parsedArgs.query !== null || !isInteractive) {
        return shouldIncludeQuery;
    }

    const includeQuery = await confirm({
        message: 'Include TanStack Query?',
        initialValue: false,
    });
    gap();

    return includeQuery;
}

async function planOpenBrowser() {
    if (selectedFramework !== 'vite') {
        if (parsedArgs.open) {
            fail('--open is only supported for Vite scaffolds.');
        }

        return false;
    }

    if (parsedArgs.open !== null || !isInteractive) {
        return shouldOpenBrowser;
    }

    const openBrowser = await confirm({
        message: 'Open the browser when the dev server starts?',
        initialValue: false,
    });
    gap();

    return openBrowser;
}

async function planInstallDependencies() {
    if (!shouldInstallDependencies || !isInteractive) {
        return shouldInstallDependencies;
    }

    const shouldInstall = await confirm({
        message: `Should I run "${installCommand()}" for you?`,
        initialValue: true,
    });
    gap();

    return shouldInstall;
}

async function planRepoSetup() {
    if (parsedArgs.local && shouldSkipRepoSetup) {
        throw new Error('Pass only one of --local or --noRepo.');
    }
    const github = !shouldSkipRepoSetup && !parsedArgs.local;
    const identity = github ? authenticatedMaintainer() : null;
    let maintainer = parsedArgs.maintainer ?? identity;
    if (isInteractive && !parsedArgs.maintainer) {
        maintainer = await text({
            message: 'Repository maintainer (GitHub login)',
            ...(identity
                ? { defaultValue: identity, placeholder: identity }
                : {}),
            validate(value) {
                try {
                    validateMaintainer(value);
                } catch (error) {
                    return error.message;
                }
            },
        });
        gap();
    }
    if (!maintainer) {
        throw new Error('--maintainer is required with --local or --noRepo.');
    }
    const repoName = validateName(parsedArgs.repoName ?? appName);
    const account = validateAccount(parsedArgs.account ?? cloudflareAccount);
    const domain = validateDomain(
        parsedArgs.domain ?? `${repoName}.sessatakuma.dev`
    );
    let visibility = parsedArgs.visibility ?? 'private';
    if (github && isInteractive && !parsedArgs.visibility) {
        visibility = await select({
            message: 'Repository visibility',
            options: [
                { label: 'Private', value: 'private' },
                { label: 'Public', value: 'public' },
            ],
            initialValue: 'private',
        });
        gap();
    }
    return {
        git: !shouldSkipRepoSetup,
        github,
        maintainer: validateMaintainer(maintainer),
        repoName,
        account,
        domain,
        visibility,
    };
}

function applyLocalRepoPlan(repoPlan) {
    if (repoPlan.git) {
        section('Initializing main branch');
        run('git', ['init', '-b', 'main'], { cwd: targetPath });
    }
}

function nextSteps() {
    const steps = [];

    if (targetArg !== '.') {
        steps.push(`cd ${targetArg}`);
    }

    if (!shouldInstallDependencies) {
        steps.push(installCommand());
    }

    steps.push(devCommand());

    return steps;
}

function replaceInFile(filePath, searchValue, replacement) {
    const source = readFileSync(filePath, 'utf8');
    writeFileSync(filePath, source.replace(searchValue, replacement.with));
}

function appendGitIgnoreEntries(entries) {
    const gitIgnorePath = join(targetPath, '.gitignore');

    if (!existsSync(gitIgnorePath)) {
        writeFileSync(gitIgnorePath, `${entries.join('\n')}\n`);
        return;
    }

    const source = readFileSync(gitIgnorePath, 'utf8');
    const lines = new Set(source.split('\n').filter(Boolean));
    let nextSource = source;

    for (const entry of entries) {
        if (lines.has(entry)) {
            continue;
        }

        nextSource += nextSource.endsWith('\n') ? `${entry}\n` : `\n${entry}\n`;
        lines.add(entry);
    }

    writeFileSync(gitIgnorePath, nextSource);
}

function parseCliArgs(args) {
    const parsedArgs = {
        framework: null,
        lucide: null,
        noInstall: false,
        noRepo: false,
        open: null,
        maintainer: null,
        repoName: null,
        account: null,
        domain: null,
        visibility: null,
        local: false,
        query: null,
        styling: null,
        targetArg: null,
    };

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        const stringOptions = {
            '--maintainer': 'maintainer',
            '--repo': 'repoName',
            '--account': 'account',
            '--domain': 'domain',
        };
        if (Object.hasOwn(stringOptions, arg)) {
            const value = args[++index];
            if (!value || value.startsWith('-')) {
                fail(`Missing value for ${arg}.`);
            }
            if (parsedArgs[stringOptions[arg]] !== null) {
                fail(`Pass ${arg} only once.`);
            }
            parsedArgs[stringOptions[arg]] = value;
            continue;
        }
        switch (arg) {
            case '--vite':
                setFrameworkOverride(parsedArgs, 'vite');
                continue;
            case '--next':
                setFrameworkOverride(parsedArgs, 'next');
                continue;
            case '--bun':
                continue;
            case '--local':
                parsedArgs.local = true;
                continue;
            case '--private':
            case '--public':
                if (parsedArgs.visibility !== null) {
                    fail('Pass one visibility option.');
                }
                parsedArgs.visibility = arg.slice(2);
                continue;
            case '--styled':
                setStylingOverride(parsedArgs, 'styled');
                continue;
            case '--minimal':
                setStylingOverride(parsedArgs, 'minimal');
                continue;
            case '--lucide':
                setBooleanOverride(parsedArgs, 'lucide', true);
                continue;
            case '--noLucide':
                setBooleanOverride(parsedArgs, 'lucide', false);
                continue;
            case '--query':
                setBooleanOverride(parsedArgs, 'query', true);
                continue;
            case '--noQuery':
                setBooleanOverride(parsedArgs, 'query', false);
                continue;
            case '--open':
                setBooleanOverride(parsedArgs, 'open', true);
                continue;
            case '--noOpen':
                setBooleanOverride(parsedArgs, 'open', false);
                continue;
            case '--noInstall':
                parsedArgs.noInstall = true;
                continue;
            case '--noRepo':
                parsedArgs.noRepo = true;
                continue;
            default:
                if (arg.startsWith('--')) {
                    fail(`Unsupported option: ${arg}`);
                }

                if (parsedArgs.targetArg) {
                    fail(`Unexpected argument: ${arg}`);
                }

                parsedArgs.targetArg = arg;
        }
    }

    return parsedArgs;
}

function setFrameworkOverride(parsedArgs, framework) {
    if (parsedArgs.framework && parsedArgs.framework !== framework) {
        fail('Pass only one of --vite or --next.');
    }

    parsedArgs.framework = framework;
}

function setStylingOverride(parsedArgs, styling) {
    if (parsedArgs.styling && parsedArgs.styling !== styling) {
        fail('Pass only one of --styled or --minimal.');
    }

    parsedArgs.styling = styling;
}

function setBooleanOverride(parsedArgs, name, value) {
    if (parsedArgs[name] !== null && parsedArgs[name] !== value) {
        fail(`Pass only one value for ${name}.`);
    }

    parsedArgs[name] = value;
}

function resolveFramework(parsedArgs) {
    return parsedArgs.framework ?? 'vite';
}

function resolveStyling(parsedArgs) {
    return parsedArgs.styling ?? 'styled';
}

function logFrameworkFileChanges() {
    if (selectedFramework === 'next') {
        console.log(
            `- Next app router files: src/app/layout.tsx, src/app/[[...slug]]/*`
        );
        console.log(`- src/app/global.css: app styles and client bootstrap`);
        console.log(`- Next config: next.config.mjs, next-env.d.ts`);
        console.log(
            `- Vite files removed: index.html, vite.config.mjs, src/main.tsx`
        );
        return;
    }

    console.log(`- index.html: title`);
    console.log(`- src/components/App.tsx: app name`);
}

function writeNextAppFiles() {
    rmSync(join(targetPath, 'index.html'), { force: true });
    rmSync(join(targetPath, 'vite.config.mjs'), { force: true });
    rmSync(join(targetPath, 'src/main.tsx'), { force: true });
    rmSync(join(targetPath, 'src/vite-env.d.ts'), { force: true });
    rmSync(join(targetPath, 'src/global.css'), { force: true });

    const appPath = join(targetPath, 'src/app');
    const catchAllPath = join(appPath, '[[...slug]]');
    mkdirSync(appPath, { recursive: true });
    mkdirSync(catchAllPath, { recursive: true });

    writeFileSync(join(targetPath, 'next-env.d.ts'), nextEnvTypes());
    writeFileSync(join(targetPath, 'next.config.mjs'), nextConfig());
    writeFileSync(join(targetPath, 'eslint.config.mjs'), nextEslintConfig());
    writeFileSync(join(targetPath, 'tsconfig.json'), nextTsconfig());
    writeFileSync(join(appPath, 'layout.tsx'), nextLayout());
    writeFileSync(join(appPath, 'global.css'), nextGlobalCss());
    updateStylingFiles(join(appPath, 'global.css'));
    writeFileSync(join(catchAllPath, 'client.tsx'), nextClientPage());
    writeFileSync(join(catchAllPath, 'page.tsx'), nextPage());
}

function frameworkLabel(framework) {
    switch (framework) {
        case 'vite':
            return 'Vite';
        case 'next':
            return 'Next.js';
        default:
            fail(`Unsupported framework: ${framework}`);
    }
}

function stylingLabel(styling) {
    switch (styling) {
        case 'styled':
            return 'Styled starter';
        case 'minimal':
            return 'Minimal reset';
        default:
            fail(`Unsupported styling: ${styling}`);
    }
}

function frameworkTitle(framework) {
    switch (framework) {
        case 'vite':
            return 'Vite, React, and TypeScript.';
        case 'next':
            return 'Next.js, React, and TypeScript.';
        default:
            fail(`Unsupported framework: ${framework}`);
    }
}

function appComponent() {
    if (selectedStyling === 'minimal') {
        return `import type { JSX } from 'react';

export function App(): JSX.Element {
    return (
        <main>
            <h1>${appName}</h1>
            <p>${frameworkTitle(selectedFramework)}</p>
        </main>
    );
}
`;
    }

    const component = readFileSync(
        new URL('../template/src/components/App.tsx', import.meta.url),
        'utf8'
    ).replace(
        "productName = 'Sessatakuma Frontend'",
        `productName = '${appName}'`
    );

    return selectedFramework === 'next'
        ? component
              .replace("'./SiteFooter.js'", "'@/components/SiteFooter'")
              .replace("'./SiteHeader.js'", "'@/components/SiteHeader'")
        : component;
}

function viteMain() {
    const queryImport = shouldIncludeQuery
        ? "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\n"
        : '';
    const queryClient = shouldIncludeQuery
        ? '\nconst queryClient = new QueryClient();\n'
        : '';
    const app = shouldIncludeQuery
        ? `        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>`
        : '        <App />';

    return `import React from 'react';
${queryImport}import ReactDOM from 'react-dom/client';

import { App } from './components/App.js';

import './global.css';
${queryClient}
const rootElement = document.querySelector('#root');

if (rootElement === null) {
    throw new Error('Expected #root to exist before mounting the app.');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
${app}
    </React.StrictMode>
);
`;
}

function minimalGlobalCss() {
    return `:root {
    font-family: system-ui, sans-serif;
}

* {
    box-sizing: border-box;
}

body {
    min-width: 320px;
    min-height: 100vh;
    margin: 0;
}
`;
}

function nextEnvTypes() {
    return `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file should not be edited.
`;
}

function nextConfig() {
    return `import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import("next").NextConfig} */
const nextConfig = { images: { unoptimized: true } };

export default nextConfig;

await initOpenNextCloudflareForDev();
`;
}

function nextEslintConfig() {
    return `import nextPlugin from '@next/eslint-plugin-next';
import { completeConfigBase } from 'eslint-config-complete';

export default [
    ...completeConfigBase,

    {
        ignores: ['.next/**', '.open-next/**', '.cloudflare-check/**', 'dist/**', 'node_modules/**', 'assets/**', 'scripts/**', 'next-env.d.ts', 'cloudflare-env.d.ts'],
    },

    {
        plugins: {
            '@next/next': nextPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            'import-x/no-unassigned-import': [
                'error',
                {
                    allow: ['**/*.css'],
                },
            ],
        },
    },

    {
        files: ['src/components/SiteHeader.tsx', 'src/components/SiteFooter.tsx'],
        rules: {
            '@next/next/no-img-element': 'off',
        },
    },

    {
        files: ['src/app/**/*.tsx'],
        rules: {
            'complete/no-mutable-return': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'n/file-extension-in-import': 'off',
            'import-x/no-default-export': 'off',
        },
    },
];
`;
}

function nextTsconfig() {
    return `{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["DOM", "DOM.Iterable", "ES2022"],
        "allowJs": false,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "react-jsx",
        "incremental": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "plugins": [
            {
                "name": "next"
            }
        ],
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": [
        "next-env.d.ts",
        "src/**/*.ts",
        "src/**/*.tsx",
        ".next/dev/types/**/*.ts",
        ".next/types/**/*.ts"
    ],
    "exclude": ["node_modules"]
}
`;
}

function nextLayout() {
    return `import type { JSX, ReactNode } from 'react';
import type { Metadata } from 'next';

import './global.css';

export const metadata: Metadata = {
    title: '${appName}',
    description: 'Created with Sessatakuma Frontend.',
    icons: '/favicon.png',
};

interface RootLayoutProps {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
    return (
        <html lang='en'>
            <body>{children}</body>
        </html>
    );
}
`;
}

function nextClientPage() {
    const imports = shouldIncludeQuery
        ? `import type { JSX } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from '@/components/App';`
        : `import type { JSX } from 'react';

import { App } from '@/components/App';`;
    const queryClient = shouldIncludeQuery
        ? '\n\nconst queryClient = new QueryClient();'
        : '';
    const app = shouldIncludeQuery
        ? `    return (
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    );`
        : '    return <App />;';

    return `'use client';

${imports}${queryClient}

export function ClientOnly(): JSX.Element {
${app}
}
`;
}

function nextPage() {
    return `import type { JSX } from 'react';

import { ClientOnly } from './client';

export default function HomePage(): JSX.Element {
    return <ClientOnly />;
}
`;
}

function nextGlobalCss() {
    return readFileSync(
        new URL('../template/src/global.css', import.meta.url),
        'utf8'
    ).replaceAll("@import './constants/", "@import '../constants/");
}

function lintStagedCommand() {
    return 'bun run lint-staged';
}

function installCommand() {
    return 'bun install --frozen-lockfile';
}

function devCommand() {
    return 'bun run dev';
}

function packageManagerConfigFile() {
    return 'bunfig.toml';
}
