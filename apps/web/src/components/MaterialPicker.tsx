import { useRef, useState } from 'react';
import {
  assetUrl,
  demoMaterials,
  materialUrl,
  type Material,
} from '../data/catalog';
import { library, useLibrary } from '../demo/library';
import { demo, useDemo } from '../demo/store';
import { importUpload } from '../demo/uploads';
import { DemoImage } from './Media';
import { Icon } from './Icon';
import { errorMessage, useUi } from './ui-context';

export function UploadButton({
  onImport,
  media,
  multiple = true,
  className = 'secondary',
  children,
}: {
  onImport?: (materials: Material[]) => void;
  media?: 'image' | 'video';
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null),
    [pending, setPending] = useState(false),
    ui = useUi();
  const [error, setError] = useState('');
  const accept =
    media === 'image'
      ? 'image/jpeg,image/png,image/webp'
      : media === 'video'
        ? 'video/mp4,video/webm'
        : 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
  return (
    <>
      <input
        ref={ref}
        type="file"
        aria-label="选择本地文件"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={async (event) => {
          const files = Array.from(event.target.files || []);
          event.target.value = '';
          setError('');
          setPending(true);
          const imported: Material[] = [];
          try {
            if (
              files.length > 4 ||
              demo.getState().uploads.length + files.length > 30
            )
              throw new Error('一次最多导入 4 份素材，素材库最多保留 30 份。');
            for (const file of files)
              imported.push(await importUpload(file, media));
            if (imported.length) {
              demo.addUploads(imported);
              onImport?.(imported);
              ui.notify(`已添加 ${imported.length} 份本地素材，未上传。`);
            }
          } catch (failure) {
            imported.forEach((item) => {
              if (item.url) URL.revokeObjectURL(item.url);
            });
            const message = errorMessage(failure);
            setError(message);
            ui.notify(message);
          } finally {
            setPending(false);
          }
        }}
      />
      <button
        className={className}
        disabled={pending}
        onClick={() => ref.current?.click()}
      >
        <Icon name="upload" />
        {pending ? '正在检查素材…' : children || '从本地导入'}
      </button>
      {error && (
        <span className="upload-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
export function MaterialPreview({
  material,
  controls = false,
}: {
  material: Material;
  controls?: boolean;
}) {
  const url = materialUrl(material);
  if (!url) return <div className="missing-file">本地文件需重新选择</div>;
  if (material.media === 'video')
    return controls ? (
      <video
        controls
        playsInline
        preload="metadata"
        poster={material.poster ? assetUrl(material.poster) : undefined}
        src={url}
        aria-label={`${material.name}预览`}
      />
    ) : (
      <DemoImage
        asset={material.poster || 'bakery'}
        alt={`${material.name} · 视频参考`}
      />
    );
  return (
    <img
      className={`asset-${material.asset || 'local'}`}
      src={url}
      alt={material.name}
    />
  );
}
export function MaterialPicker({
  media,
  label,
  help,
  onSelect,
}: {
  media: 'image' | 'video';
  label: string;
  help: string;
  onSelect: (material: Material) => void;
}) {
  const state = useDemo(),
    ui = useUi();
  useLibrary();
  const [query, setQuery] = useState(''),
    [source, setSource] = useState('all');
  const materials = [...demoMaterials, ...state.uploads].filter(
    (material) =>
      material.media === media &&
      !library.meta('materials', material.id).trashed &&
      (source === 'all' ||
        (source === 'mine' ? material.local : !material.local)) &&
      (library.meta('materials', material.id).name || material.name).includes(
        query.trim(),
      ),
  );
  function select(material: Material) {
    onSelect(material);
    ui.close();
  }
  return (
    <div className="picker-body">
      <p>{help}</p>
      <UploadButton
        media={media}
        multiple={false}
        onImport={(items) => {
          if (items[0]) select(items[0]);
        }}
      >
        从本地选择{media === 'video' ? '视频' : '图片'}
      </UploadButton>
      <span className="small-note">
        文件不上传；只绑定到本次的“{label}”。刷新后需重新选择。
      </span>
      <div className="ix-picker-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            type="search"
            aria-label="搜索素材"
            placeholder="搜索素材"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="素材来源"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">全部来源</option>
          <option value="mine">我的导入</option>
          <option value="demo">演示素材</option>
        </select>
      </div>
      {!materials.length && <p className="empty">没有找到相符素材</p>}
      <div className="picker-grid">
        {materials.map((material) => (
          <button
            key={material.id}
            disabled={!materialUrl(material)}
            onClick={() => select(material)}
          >
            <MaterialPreview material={material} />
            <b>{material.name}</b>
            <span>{material.local ? '本地文件' : '演示素材'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
