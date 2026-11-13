import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();
const jsFiles = [path.join(root, 'server.js')];

const jsDir = path.join(root, 'js');
if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir)) {
    if (file.endsWith('.js')) {
      jsFiles.push(path.join(jsDir, file));
    }
  }
}

for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

const dataDir = path.join(root, 'data');
if (fs.existsSync(dataDir)) {
  for (const file of fs.readdirSync(dataDir)) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      JSON.parse(content);
    }
  }
}

console.log(`Lint passed for ${jsFiles.length} JS files and JSON data.`);
