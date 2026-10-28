import { useState } from 'react';
import { downloadOutput } from '../demo/download';
import { Button } from '@kivao/ui';
import { requireScene } from '../data/catalog';
import {
  currentVersion,
  type Adjustment,
  type DemoCreation,
  type Output,
} from '../demo/model';
import { demo } from '../demo/store';
import { Icon } from '../components/Icon';
import { OutputMedia } from '../components/Media';
import { errorMessage, useUi } from '../components/ui-context';

export function AdjustmentDialog({
  creation,
  onPrepare,
}: {
  creation: DemoCreation;
  onPrepare: (adjustment: Adjustment) => void;
}) {
  const scene = requireScene(creation.sceneId),
    [intent, setIntent] = useState(scene.adjustments[0]!),
    [note, setNote] = useState(''),
    ui = useUi();
  return (
    <div className="adjust-body">
      <p>从 V{creation.activeVersion} 继续，保留原版本；只重做你选中的项目。</p>
      <fieldset>
        <legend>选择调整方向</legend>
        {scene.adjustments.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="adjustment"
              value={value}
              checked={intent === value}
              onChange={() => setIntent(value)}
            />
            {value}
          </label>
        ))}
      </fieldset>
      <label className="optional-note">
        补充说明 <span>可选，不写也能继续</span>
        <textarea
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="还有哪些要保留或改变的地方？"
        />
      </label>
      <Button
        className="primary full"
        onClick={() => {
          ui.close();
          onPrepare({
            baseVersion: creation.activeVersion,
            ids: [...creation.selected],
            intent,
            note: note.trim(),
          });
        }}
      >
        查看调整计划 <Icon name="arrow" />
      </Button>
    </div>
  );
}
export function SaveDialog({ creation }: { creation: DemoCreation }) {
  const scene = requireScene(creation.sceneId),
    ui = useUi(),
    versionId = currentVersion(creation)!.record.id;
  return (
    <div className="studio-save-body">
      <p>
        请确认选中结果符合本次目标。保存后会固定 V{creation.activeVersion}{' '}
        来源，后续调整不会覆盖作品。
      </p>
      <h3>这次重点检查</h3>
      <ul>
        {scene.checks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>
      <p className="small-note">
        预制演示素材 · 保存仅在当前浏览器，不会写入真实作品服务。
      </p>
      <Button
        className="primary full"
        onClick={() => {
          try {
            if (
              currentVersion(demo.creation(creation.id))?.record.id !==
              versionId
            )
              throw new Error('当前版本已变化，请重新审核。');
            const count = demo.save(creation.id, true);
            ui.close();
            ui.notify(
              `已确认保存 ${count} 项作品，保留 V${creation.activeVersion} 来源。`,
            );
          } catch (error) {
            ui.notify(errorMessage(error));
          }
        }}
      >
        我已检查，保存选中项 <Icon name="check" />
      </Button>
    </div>
  );
}
export function InspectOutput({
  creation,
  output,
}: {
  creation: DemoCreation;
  output: Output;
}) {
  const version = currentVersion(creation)!;
  return (
    <div className="output-inspect">
      <OutputMedia
        output={output}
        ratio={version.snapshot.settings.ratio}
        sceneId={creation.sceneId}
      />
      <p>
        来源 {creation.shortId} · V{version.record.ordinal} · {creation.name}
      </p>
      <p className="small-note">
        预制演示媒体，不代表本次真实生成或修改。下载的是演示原素材，不是排版截图。
      </p>
      <button className="secondary" onClick={() => downloadOutput(output)}>
        <Icon name="download" />
        下载演示素材
      </button>
    </div>
  );
}
