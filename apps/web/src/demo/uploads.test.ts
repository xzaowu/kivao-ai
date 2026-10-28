import { afterEach, expect, it, vi } from 'vitest';
import { importUpload, validateUpload } from './uploads';

afterEach(() => vi.unstubAllGlobals());
it('rejects unsupported formats, zero/oversized files and mismatched role media', () => {
  for (const file of [
    { type: 'image/svg+xml', size: 100 },
    { type: 'image/png', size: 0 },
    { type: 'image/webp', size: 11 * 1024 * 1024 },
  ])
    expect(() => validateUpload(file)).toThrow();
  expect(() =>
    validateUpload({ type: 'video/mp4', size: 100 }, 'image'),
  ).toThrow('图片');
  expect(validateUpload({ type: 'image/webp', size: 100 }, 'image')).toBe(
    'image',
  );
});
it('checks file signatures and image decode before making a local preview', async () => {
  await expect(
    importUpload(new File(['not png'], 'fake.png', { type: 'image/png' })),
  ).rejects.toThrow('格式不符');
  const file = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    'image.png',
    { type: 'image/png' },
  );
  vi.stubGlobal('createImageBitmap', async () => {
    throw new Error('decode failed');
  });
  await expect(importUpload(file)).rejects.toThrow('无法解码');
  const close = vi.fn();
  vi.stubGlobal('createImageBitmap', async () => ({ close }));
  const material = await importUpload(file);
  expect(material.local).toBe(true);
  expect(material.url).toMatch(/^blob:/);
  expect(close).toHaveBeenCalledOnce();
  URL.revokeObjectURL(material.url!);
});
