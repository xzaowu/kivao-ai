import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it.each(['SIGINT', 'SIGTERM'] as const)('starts an idle independent worker and shuts down on %s', async (signal) => {
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), fileURLToPath(new URL('./index.ts', import.meta.url))], { stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = once(child, 'exit');
  try {
    const [firstOutput] = await once(child.stdout, 'data');
    expect(String(firstOutput)).toContain('idle scaffold. No queue, provider calls, generation or billing.');
    child.kill(signal);
    const [code, exitSignal] = await exited;
    expect(code).toBe(0);
    expect(exitSignal).toBeNull();
  } finally { child.kill('SIGKILL'); }
});
