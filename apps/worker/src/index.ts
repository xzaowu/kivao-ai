const keepAlive = setInterval(() => {}, 60_000);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { clearInterval(keepAlive); console.info('KIVAO worker stopped.'); });
}
console.info('KIVAO worker: idle scaffold. No queue, provider calls, generation or billing.');
