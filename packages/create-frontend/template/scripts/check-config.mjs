import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseJsonc, printParseErrorCode } from 'jsonc-parser';
import { parse as parseToml } from 'smol-toml';
import { parseDocument } from 'yaml';

const root = process.cwd();
const generator = process.argv.includes('--generator');
const required = [
    'package.json',
    'bun.lock',
    'bunfig.toml',
    'eslint.config.mjs',
    '.prettierrc',
    '.github/workflows/ci.yml',
    '.github/CODEOWNERS',
    '.github/PULL_REQUEST_TEMPLATE.md',
    ...(generator
        ? ['packages/create-frontend/bin/design.mjs']
        : [
              'design.md',
              'design-source.json',
              'wrangler.jsonc',
              '.github/ruleset.json',
          ]),
];
let failed = false;
for (const file of required) {
    if (!existsSync(join(root, file))) {
        console.error(`Missing required configuration: ${file}`);
        failed = true;
    }
}
const excluded = new Set([
    'node_modules',
    '.git',
    'dist',
    '.next',
    '.open-next',
    '.cloudflare-check',
    '.wrangler',
]);
function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            if (!excluded.has(entry.name)) {
                walk(path);
            }
            continue;
        }
        if (
            !entry.isFile() ||
            !(
                /\.(?:jsonc?|ya?ml|toml)$/.test(entry.name) ||
                entry.name === 'bun.lock' ||
                entry.name === '.prettierrc'
            )
        ) {
            continue;
        }
        try {
            const source = readFileSync(path, 'utf8');
            if (/\.ya?ml$/.test(entry.name)) {
                const document = parseDocument(source, { uniqueKeys: true });
                if (document.errors.length) {
                    throw new Error(
                        document.errors.map((error) => error.message).join('\n')
                    );
                }
            } else if (entry.name.endsWith('.toml')) {
                parseToml(source);
            } else if (entry.name.endsWith('.json')) {
                JSON.parse(source);
            } else {
                const errors = [];
                parseJsonc(source, errors, { allowTrailingComma: true });
                if (errors.length) {
                    throw new Error(
                        errors
                            .map(
                                (error) =>
                                    `${printParseErrorCode(error.error)} at ${error.offset}`
                            )
                            .join(', ')
                    );
                }
            }
        } catch (error) {
            console.error(`${relative(root, path)}: ${error.message}`);
            failed = true;
        }
    }
}
walk(root);
if (failed) {
    process.exitCode = 1;
} else {
    console.log(
        'Required configuration and JSON/JSONC/YAML/TOML syntax passed.'
    );
}
