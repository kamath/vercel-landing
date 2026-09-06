// `pnpm dev`: free the preview port, build the font, then serve dist/ with the preview page.
import { execFileSync, spawn } from 'node:child_process';

const port = Number(process.env.PORT ?? 4173);

function pidsOnPort(): number[] {
  try {
    const out = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
    return out.split('\n').map((s) => Number(s.trim())).filter((n) => n > 0 && n !== process.pid);
  } catch {
    return []; // lsof exits 1 when nothing is listening
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const busy = pidsOnPort();
if (busy.length > 0) {
  console.log(`port ${port} is held by pid(s) ${busy.join(', ')}; stopping them`);
  for (const pid of busy) {
    try { process.kill(pid, 'SIGTERM'); } catch { /* already gone */ }
  }
  for (let i = 0; i < 20 && pidsOnPort().length > 0; i++) await wait(100);
  for (const pid of pidsOnPort()) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  }
  await wait(100);
}

const run = (script: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'tsx', script], { stdio: 'inherit', env: { ...process.env, PORT: String(port) } });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exited with ${code}`))));
  });

await run('src/build.ts');
await run('src/serve.ts');
