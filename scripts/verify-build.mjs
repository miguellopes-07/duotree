import fs from 'fs';
import path from 'path';

const root = process.cwd();
const requiredHtml = [
  'index.html',
  'pages/loja.html',
  'pages/missoes.html',
  'pages/perfil.html',
  'pages/sobre.html',
  'pages/wiki.html'
];

const dataDir = path.join(root, 'data');
const jsDir = path.join(root, 'js');

for (const file of requiredHtml) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Arquivo HTML obrigatório não encontrado: ${file}`);
  }
}

if (fs.existsSync(dataDir)) {
  for (const file of fs.readdirSync(dataDir)) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      JSON.parse(content);
    }
  }
}

if (fs.existsSync(jsDir)) {
  for (const file of fs.readdirSync(jsDir)) {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(jsDir, file), 'utf-8');
      if (!content.trim()) {
        throw new Error(`Arquivo JS vazio: js/${file}`);
      }
    }
  }
}

console.log('DuoTree build verification passed.');
