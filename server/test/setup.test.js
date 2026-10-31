import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { parseEnv, setEnvValue } = require('../lib/envFile.js');
const { findChromium, needsSystemChromium } = require('../lib/chromium.js');
const { findProblems } = require('../lib/preflight.js');
const { safeTerminalText: safeName } = require('../lib/terminalText.js');

describe('envFile', () => {
  const sample =
    '# comentario\nVITE_GEMINI_MODEL=gemini-2.5-flash\nWHATSAPP_GROUP_ID=\nPORT=3000 # puerto\nQUOTED="a b"\n';
  it('lee valores sin comillas ni comentarios finales', () => {
    const env = parseEnv(sample);
    expect(env.get('PORT')).toBe('3000');
    expect(env.get('QUOTED')).toBe('a b');
    expect(env.get('WHATSAPP_GROUP_ID')).toBe('');
  });
  it('sustituye la línea y conserva comentarios y el resto', () => {
    const out = setEnvValue(sample, 'WHATSAPP_GROUP_ID', '120363012345678901@g.us');
    expect(out).toContain('# comentario\n');
    expect(out).toContain('WHATSAPP_GROUP_ID=120363012345678901@g.us\n');
    expect(out).toContain('PORT=3000 # puerto');
    expect(out.split('\n').filter((l) => l.startsWith('WHATSAPP_GROUP_ID')).length).toBe(1);
  });
  it('añade al final si no existe y comenta duplicados', () => {
    expect(setEnvValue('A=1\n\n', 'B', '2')).toBe('A=1\nB=2\n');
    expect(setEnvValue('A=1\nA=2\n', 'A', '3')).toBe('A=3\n# A=2\n');
  });
  it('rechaza saltos de línea (inyección de variables) y nombres raros', () => {
    expect(() => setEnvValue('', 'A', 'x\nVITE_GOOGLE_API_KEY=robada')).toThrow();
    expect(() => setEnvValue('', 'A B', 'x')).toThrow();
  });
});

describe('chromium', () => {
  const only =
    (...paths) =>
    (p) =>
      paths.includes(p);
  it('prefiere CHROMIUM_PATH si existe', () => {
    expect(
      findChromium({
        env: { CHROMIUM_PATH: '/opt/chrome' },
        platform: 'linux',
        exists: only('/opt/chrome', '/usr/bin/chromium'),
      }),
    ).toBe('/opt/chrome');
  });
  it('si no, el del sistema; si no hay, null', () => {
    expect(
      findChromium({
        env: { CHROMIUM_PATH: '/no/existe' },
        platform: 'linux',
        exists: only('/usr/bin/chromium-browser'),
      }),
    ).toBe('/usr/bin/chromium-browser');
    expect(findChromium({ env: {}, platform: 'linux', exists: only() })).toBeNull();
    expect(findChromium({ env: {}, platform: 'win32', exists: () => true })).toBeNull();
  });
  it('Linux ARM necesita el Chromium del sistema', () => {
    expect(needsSystemChromium({ platform: 'linux', arch: 'arm64' })).toBe(true);
    expect(needsSystemChromium({ platform: 'linux', arch: 'x64' })).toBe(false);
    expect(needsSystemChromium({ platform: 'darwin', arch: 'arm64' })).toBe(false);
  });
});

describe('preflight', () => {
  const base = {
    platform: 'linux',
    arch: 'x64',
    nodeVersion: '20.19.2',
    env: { WHATSAPP_GROUP_ID: '120363012345678901@g.us' },
    exists: () => true,
  };
  it('sin problemas cuando todo está', () => {
    expect(findProblems(base)).toEqual([]);
  });
  it('explica cada cosa que falta, con el comando para arreglarla', () => {
    expect(findProblems({ ...base, nodeVersion: '18.20.0' })[0]).toMatch(/Node\.js 20\.19/);
    expect(findProblems({ ...base, nodeVersion: '22.11.0' })[0]).toMatch(/22\.12/);
    expect(findProblems({ ...base, nodeVersion: '21.7.3' })[0]).toMatch(/Node\.js 20\.19/);
    expect(findProblems({ ...base, nodeVersion: '22.12.0' })).toEqual([]);
    expect(findProblems({ ...base, exists: (p) => !p.includes('node_modules') })[0]).toMatch(/npm run setup/);
    expect(
      findProblems({ ...base, arch: 'arm64', exists: (p) => !p.startsWith('/usr/bin') && !p.startsWith('/snap') })[0],
    ).toMatch(/apt install chromium/);
    expect(findProblems({ ...base, exists: (p) => !p.endsWith('.env') })[0]).toMatch(/No hay archivo \.env/);
    expect(findProblems({ ...base, env: { WHATSAPP_GROUP_ID: '' } })[0]).toMatch(/server:grupos/);
    expect(findProblems({ ...base, env: {}, needGroupId: false })).toEqual([]);
  });
});

describe('grupos: nombres de WhatsApp seguros para la terminal', () => {
  it('quita secuencias ANSI, controles y marcas bidi, y recorta', () => {
    expect(safeName('\u001b[2J\u001b[31mRojo\u001b[0m')).toBe('Rojo');
    expect(safeName('a\u0007b\u202ec\r\nd')).toBe('abcd');
    expect(safeName('x'.repeat(100)).length).toBe(60);
    expect(safeName('')).toBe('(sin nombre)');
  });
});

describe('npmCommand (npm run setup en cualquier sistema)', () => {
  const { npmCommand } = require('../lib/npmCommand.js');
  it('con npm_execpath lanza node + npm-cli.js sin shell (también en Windows)', () => {
    expect(
      npmCommand({
        execPath: 'C:\\node\\node.exe',
        npmExecPath: 'C:\\node\\node_modules\\npm\\bin\\npm-cli.js',
        platform: 'win32',
      }),
    ).toEqual({ cmd: 'C:\\node\\node.exe', prefix: ['C:\\node\\node_modules\\npm\\bin\\npm-cli.js'], shell: false });
  });
  it('sin npm_execpath: npm, con shell solo en Windows (npm.cmd sin shell da EINVAL)', () => {
    expect(npmCommand({ npmExecPath: '', platform: 'win32' })).toEqual({ cmd: 'npm', prefix: [], shell: true });
    expect(npmCommand({ npmExecPath: '', platform: 'linux' })).toEqual({ cmd: 'npm', prefix: [], shell: false });
  });
  it('ignora npm_execpath de otros gestores (yarn/pnpm)', () => {
    expect(npmCommand({ npmExecPath: '/usr/lib/node_modules/pnpm/bin/pnpm.cjs', platform: 'linux' }).cmd).toBe('npm');
  });
});

describe('chooseExecutablePath (navegador del servidor)', () => {
  // whatsappClient.js solo requiere whatsapp-web.js dentro de createWhatsappClient, así que se puede probar sin dependencias.
  const { chooseExecutablePath } = require('../lib/whatsappClient.js');
  const all = () => true;
  it('x64 y macOS sin CHROMIUM_PATH: Chrome de Puppeteer (como antes)', () => {
    expect(chooseExecutablePath({ env: {}, platform: 'linux', arch: 'x64', exists: all })).toBeUndefined();
    expect(chooseExecutablePath({ env: {}, platform: 'darwin', arch: 'arm64', exists: all })).toBeUndefined();
  });
  it('Linux ARM: el del sistema', () => {
    expect(
      chooseExecutablePath({ env: {}, platform: 'linux', arch: 'arm64', exists: (p) => p === '/usr/bin/chromium' }),
    ).toBe('/usr/bin/chromium');
  });
  it('CHROMIUM_PATH definido: se respeta en cualquier plataforma', () => {
    expect(
      chooseExecutablePath({
        env: { CHROMIUM_PATH: '/opt/chrome' },
        platform: 'linux',
        arch: 'x64',
        exists: (p) => p === '/opt/chrome',
      }),
    ).toBe('/opt/chrome');
  });
});
