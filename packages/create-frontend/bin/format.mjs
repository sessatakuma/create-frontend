import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sortImports from '@ianvs/prettier-plugin-sort-imports';
import * as prettier from 'prettier';

export async function formatScaffold(target) {
    const config = JSON.parse(
        readFileSync(join(target, '.prettierrc'), 'utf8')
    );
    async function walk(directory) {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) {
                if (!['assets', 'node_modules', '.git'].includes(entry.name)) {
                    await walk(path);
                }
            } else if (entry.isFile()) {
                const info = await prettier.getFileInfo(path, {
                    ignorePath: join(target, '.prettierignore'),
                });
                if (!info.ignored && info.inferredParser) {
                    const formatted = await prettier.format(
                        readFileSync(path, 'utf8'),
                        { ...config, filepath: path, plugins: [sortImports] }
                    );
                    writeFileSync(path, formatted);
                }
            }
        }
    }
    await walk(target);
}
