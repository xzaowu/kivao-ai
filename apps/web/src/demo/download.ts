import { assetUrl } from '../data/catalog';
import type { Output } from './model';
export function downloadOutput(output: Output) {
  const text = output.kind === 'text',
    url = text
      ? URL.createObjectURL(
          new Blob([output.body || ''], { type: 'text/plain;charset=utf-8' }),
        )
      : assetUrl(output.asset);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KIVAO-演示.${text ? 'txt' : output.kind === 'video' ? 'mp4' : 'webp'}`;
  a.click();
  if (text) setTimeout(() => URL.revokeObjectURL(url), 1000);
}
