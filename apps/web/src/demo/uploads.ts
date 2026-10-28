import type { Material } from '../data/catalog';

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
];
export function validateUpload(
  file: Pick<File, 'type' | 'size'>,
  required?: 'image' | 'video',
) {
  if (!allowedTypes.includes(file.type))
    throw new Error('请选择 JPG、PNG、WebP 图片或 MP4、WebM 视频。');
  const media = file.type.startsWith('video/') ? 'video' : 'image';
  if (required && required !== media)
    throw new Error(
      `这个角色需要${required === 'image' ? '图片' : '视频'}素材。`,
    );
  if (!file.size || file.size > (media === 'video' ? 50 : 10) * 1024 * 1024)
    throw new Error(
      media === 'video'
        ? '视频需大于 0 字节且不超过 50MB。'
        : '图片需大于 0 字节且不超过 10MB。',
    );
  return media;
}
export async function importUpload(
  file: File,
  required?: 'image' | 'video',
): Promise<Material> {
  const media = validateUpload(file, required),
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  const valid =
    file.type === 'image/jpeg'
      ? bytes[0] === 255 && bytes[1] === 216
      : file.type === 'image/png'
        ? bytes[0] === 137 && text(1, 4) === 'PNG'
        : file.type === 'image/webp'
          ? text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP'
          : file.type === 'video/mp4'
            ? text(4, 8) === 'ftyp'
            : bytes[0] === 26 &&
              bytes[1] === 69 &&
              bytes[2] === 223 &&
              bytes[3] === 163;
  if (!valid) throw new Error('文件内容与格式不符，请重新选择有效素材。');
  if (media === 'image') {
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
    } catch {
      throw new Error('图片无法解码，请选择其他图片。');
    }
  }
  return {
    id: crypto.randomUUID(),
    name: file.name,
    media,
    role: '本地参考',
    local: true,
    url: URL.createObjectURL(file),
  };
}
