const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const ignoredDirectories = new Set(['.git', '.expo', 'node_modules']);
const requiredFiles = [
    'server.js',
    'app.js',
    'routes/registerRoutes.js',
    'middlewares/requireAdminAuth.js',
    'middlewares/apiNotFound.js'
];

function collectJavaScriptFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (ignoredDirectories.has(entry.name)) {
            return [];
        }

        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return collectJavaScriptFiles(absolutePath);
        }

        return entry.isFile() && entry.name.endsWith('.js') ? [absolutePath] : [];
    });
}

for (const relativePath of requiredFiles) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Arquivo obrigatório ausente: ${relativePath}`);
    }
}

const javascriptFiles = collectJavaScriptFiles(projectRoot);

for (const file of javascriptFiles) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

console.log(`Validação concluída: ${javascriptFiles.length} arquivos JavaScript sem erros de sintaxe.`);
