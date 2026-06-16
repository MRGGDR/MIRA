import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return env;
      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      env[key] = rawValue.replace(/^["']|["']$/g, '');
      return env;
    }, {});
}

if (!existsSync(envPath)) {
  console.error('No se encontro .env. Cree el archivo antes de iniciar.');
  process.exit(1);
}

const fileEnv = parseEnv(readFileSync(envPath, 'utf8'));
const runtimeEnv = Object.entries({ ...process.env, ...fileEnv }).reduce((env, [key, value]) => {
  if (!key || key.startsWith('=') || value === undefined) return env;
  env[key] = String(value);
  return env;
}, {});

if (!runtimeEnv.VITE_APPS_SCRIPT_URL) {
  console.error('Falta VITE_APPS_SCRIPT_URL en .env.');
  process.exit(1);
}

console.log('Iniciando MIRA en http://127.0.0.1:5173/');
console.log(`Backend Apps Script: ${runtimeEnv.VITE_APPS_SCRIPT_URL}`);
console.log(`Proxy local: ${runtimeEnv.VITE_USE_DEV_PROXY === 'true' ? 'activo' : 'inactivo'}`);

const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const args =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm run dev -- --port 5173']
    : ['run', 'dev', '--', '--port', '5173'];

const child = spawn(command, args, {
  env: runtimeEnv,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,
});

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
