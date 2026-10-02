import { readFileSync, writeFileSync } from 'node:fs';

const rootPackageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = rootPackageJson.version;
const packagePath = 'packages/create-frontend/package.json';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.version = version;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 4)}\n`);
