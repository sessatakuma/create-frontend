import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function check(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) {
            check(file);
        } else if (entry.isFile() && /\.mjs$/.test(entry.name)) {
            execFileSync(process.execPath, ['--check', file], {
                stdio: 'inherit',
            });
        }
    }
}
for (const directory of ['packages/create-frontend/bin', 'scripts', 'tests']) {
    check(directory);
}
