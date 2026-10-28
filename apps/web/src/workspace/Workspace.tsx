import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiCreation, getApiCreation, getApiPlan } from '../api';
import { requireScene, scenes } from '../data/catalog';
import { preparePlan } from '../demo/bridge';
import {
  snapshot,
  startRun,
  validateCreation,
  type Adjustment,
} from '../demo/model';
import { demo, useDemo } from '../demo/store';
import { SceneChoices } from '../components/SceneCards';
import { useStartCreation } from '../components/useStartCreation';
import { Icon } from '../components/Icon';
import { errorMessage, useUi } from '../components/ui-context';
import { NotFoundPage } from '../pages/StaticPages';
import { Inputs } from './Inputs';
import { Plan, Running } from './Plan';
import { Results } from './Results';

export function Workspace({ sessionId }: { sessionId: string }) {
  const state = useDemo(),
    creation = state.creations.find((item) => item.id === sessionId);
  const [pane, setPane] = useState<'inputs' | 'results'>(
    creation && creation.phase !== 'materials' ? 'results' : 'inputs',
  );
  const navigate = useNavigate(),
    client = useQueryClient(),
    ui = useUi(),
    start = useStartCreation(),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const planMutation = useMutation({
    mutationFn: async (adjustment: Adjustment | null) => {
      const current = demo.creation(sessionId);
      validateCreation(current, demo.getState().uploads);
      const token = JSON.stringify(snapshot(current)),
        plan = await preparePlan(current, client, adjustment);
      if (JSON.stringify(snapshot(demo.creation(sessionId))) !== token)
        throw new Error('设置在准备计划时发生变化，请重新预览计划。');
      demo.update(sessionId, (item) => ({
        ...item,
        plan,
        phase: 'confirm',
        draft: false,
      }));
    },
    onSuccess: () => {
      if (mounted.current) {
        setPane('results');
        window.scrollTo({ top: 0, behavior: 'instant' });
        void navigate({
          to: '/creations/$creationId',
          params: { creationId: sessionId },
        });
      }
    },
    onError: (error) => {
      if (mounted.current) ui.notify(errorMessage(error));
    },
  });
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const current = demo.creation(sessionId);
      validateCreation(current, demo.getState().uploads);
      const plan = current.plan;
      if (!plan) throw new Error('请先预览创作计划。');
      let backend = current.backend;
      if (plan.backend) {
        await getApiPlan(plan.backend.id);
        if (backend) {
          try {
            await getApiCreation(backend.id);
          } catch {
            throw new Error(
              'Mock 创作引用已失效，请从首页新建；原版本与作品仍保留在本地。',
            );
          }
        } else backend = (await createApiCreation(plan.backend.id)).data;
      }
      demo.update(sessionId, (item) => {
        if (item.phase !== 'confirm' || item.plan !== plan)
          throw new Error('当前计划已变化，请重新确认。');
        return startRun(
          { ...item, ...(backend ? { backend } : {}) },
          Date.now(),
        );
      });
    },
    onSuccess: () => {
      if (mounted.current) setPane('results');
    },
    onError: (error) => {
      if (mounted.current) ui.notify(errorMessage(error));
    },
  });
  if (!creation) return <NotFoundPage />;
  const scene = requireScene(creation.sceneId),
    video = scene.output === '视频',
    free = creation.sceneId.startsWith('free-');
  function chooseScene() {
    ui.open(
      `选择${video ? '视频' : '图片'}场景`,
      <SceneChoices
        list={scenes.filter(
          (item) => item.ready && item.output === scene.output,
        )}
        onChoose={(item) => start(item.id)}
      />,
    );
  }
  function switchMode(mode: 'free' | 'scene') {
    if (mode === 'scene') chooseScene();
    else void navigate({ to: video ? '/videos' : '/images' });
  }
  return (
    <>
      <div className="studio-title">
        <div>
          <h1>
            {creation.draft ? (video ? '视频创作' : '图片创作') : creation.name}
          </h1>
          <span>
            {creation.draft
              ? '直接开始，或选择一个场景'
              : `${creation.shortId} · ${scene.name}`}
          </span>
          {!creation.draft && (
            <span
              className={`status ${creation.phase === 'review' ? 'review' : creation.phase === 'running' ? 'running' : ''}`}
            >
              {creation.phase === 'review'
                ? '待审核'
                : creation.phase === 'confirm'
                  ? '待确认'
                  : creation.phase === 'running'
                    ? '模拟执行中'
                    : '素材准备'}
            </span>
          )}
        </div>
        <Link className="text-link" to="/creations">
          <Icon name="clock" />
          创作记录
        </Link>
      </div>
      <div className="studio-mobile-tabs" aria-label="工作区面板">
        <button
          aria-pressed={pane === 'inputs'}
          onClick={() => setPane('inputs')}
        >
          素材与配置
        </button>
        <button
          aria-pressed={pane === 'results'}
          onClick={() => setPane('results')}
        >
          {creation.phase === 'confirm' ? '确认计划' : '结果与参考'}
          {creation.versions.length ? ` · V${creation.activeVersion}` : ''}
        </button>
      </div>
      <div
        className={`studio-shell ${pane === 'results' ? 'mobile-results' : 'mobile-inputs'}`}
      >
        <Inputs
          creation={creation}
          pending={planMutation.isPending}
          error={planMutation.error ? errorMessage(planMutation.error) : ''}
          onPlan={() => planMutation.mutate(null)}
          onMode={switchMode}
          onChooseScene={chooseScene}
        />
        <section className="studio-area" aria-label="结果与计划">
          {creation.phase === 'confirm' && creation.plan ? (
            <Plan
              creation={creation}
              pending={confirmMutation.isPending}
              error={
                confirmMutation.error ? errorMessage(confirmMutation.error) : ''
              }
              onConfirm={() => confirmMutation.mutate()}
              onBack={() => {
                demo.update(sessionId, (item) => ({
                  ...item,
                  phase: item.versions.length ? 'review' : 'materials',
                  plan: null,
                }));
                confirmMutation.reset();
                planMutation.reset();
                setPane('inputs');
              }}
            />
          ) : creation.phase === 'running' ? (
            <Running
              creation={creation}
              onCancel={() => {
                demo.cancel(sessionId);
                ui.notify('模拟已取消，素材和计划已保留。');
              }}
            />
          ) : (
            <Results
              key={free ? creation.id : sessionId}
              creation={creation}
              onPrepare={(adjustment) => planMutation.mutate(adjustment)}
            />
          )}
        </section>
      </div>
    </>
  );
}
