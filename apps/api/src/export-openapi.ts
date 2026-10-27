import { writeFile } from 'node:fs/promises';
import { buildApp } from './app.js';

const app = await buildApp();
try {
  await writeFile(new URL('../../../docs/openapi.json', import.meta.url), `${JSON.stringify(app.swagger(), null, 2)}\n`);
} finally { await app.close(); }
