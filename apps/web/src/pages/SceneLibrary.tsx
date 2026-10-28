import { useState } from 'react';
import {
  categories,
  defaultFilters,
  filterCatalog,
  type CatalogFilters,
} from '../data/catalog';
import { SceneCard } from '../components/SceneCards';
import { Icon } from '../components/Icon';

let savedFilters = defaultFilters;
export function SceneLibraryPage() {
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [filters, setFilters] = useState(savedFilters),
    result = filterCatalog(filters);
  function change(patch: Partial<CatalogFilters>) {
    savedFilters = { ...filters, page: 1, ...patch };
    setFilters(savedFilters);
  }
  function clear() {
    savedFilters = { ...defaultFilters, size: filters.size };
    setFilters(savedFilters);
  }
  const active = [
    filters.query && `搜索：${filters.query}`,
    filters.category !== '全部' && filters.category,
    filters.input !== '全部' && filters.input,
    filters.output !== '全部' && filters.output,
    filters.ready && '完整演示',
  ].filter(Boolean);
  return (
    <>
      <section className="page-heading">
        <span className="eyebrow">找的是结果，不是模型。</span>
        <h1>场景库</h1>
        <p>每个场景都说明：准备什么、怎么做、会得到什么。</p>
      </section>
      <div className="catalog-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            type="search"
            aria-label="搜索场景"
            placeholder="搜索任务或结果，如：换装、商品套图、参考视频"
            value={filters.query}
            onChange={(event) => change({ query: event.target.value })}
          />
        </label>
        <details
          className="sample-settings"
          open={samplesOpen}
          onToggle={(event) => setSamplesOpen(event.currentTarget.open)}
        >
          <summary>演示数据 · {filters.size}</summary>
          <div className="sample-size" aria-label="场景数据样本">
            <span>数据样本</span>
            {([12, 24, 48] as const).map((size) => (
              <button
                key={size}
                aria-pressed={filters.size === size}
                className={filters.size === size ? 'active' : ''}
                onClick={() => {
                  change({ size });
                  setSamplesOpen(false);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </details>
      </div>
      <div className="category-row" aria-label="业务任务分类">
        {['全部', ...categories].map((category) => (
          <button
            key={category}
            aria-pressed={filters.category === category}
            className={filters.category === category ? 'active' : ''}
            onClick={() => change({ category })}
          >
            {category}
          </button>
        ))}
      </div>
      <details className="facets">
        <summary>
          <Icon name="sliders" />
          筛选场景
          <span>
            {active.length
              ? `${active.length} 项条件`
              : '按任务、素材和输出选择'}
          </span>
        </summary>
        <div className="facet-content">
          <div className="facet-fields">
            <label>
              你有什么素材
              <select
                aria-label="你有什么素材"
                value={filters.input}
                onChange={(event) => change({ input: event.target.value })}
              >
                {['全部', '一张图片', '多张图片', '人物与服装', '参考视频'].map(
                  (value) => (
                    <option key={value}>{value}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              想得到什么
              <select
                aria-label="想得到什么"
                value={filters.output}
                onChange={(event) => change({ output: event.target.value })}
              >
                {['全部', '图片', '视频', '图文'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="check-inline">
              <input
                type="checkbox"
                checked={filters.ready}
                onChange={(event) => change({ ready: event.target.checked })}
              />
              只看完整演示
            </label>
            <button className="text-link" onClick={clear}>
              清除条件
            </button>
          </div>
        </div>
      </details>
      <div className="active-filters">
        {active.map((item) => (
          <span key={String(item)}>{item}</span>
        ))}
      </div>
      <p className="catalog-note">
        <Icon name="info" />3 个场景通过 Mock API
        创建计划；其余为目录扩展样本，标注为“流程预览”，未接后端。
      </p>
      <section id="library-results" aria-label="场景搜索结果">
        <div className="results-meta">
          <p role="status">
            找到 <strong>{result.total}</strong> 个场景
            <span> · 当前样本 {filters.size} 个</span>
          </p>
          <label>
            排序
            <select
              aria-label="场景排序"
              value={filters.sort}
              onChange={(event) => change({ sort: event.target.value })}
            >
              <option value="recommended">推荐顺序</option>
              <option value="name">按名称</option>
            </select>
          </label>
        </div>
        <div className="catalog-grid">
          {result.items.length ? (
            result.items.map((scene) => (
              <SceneCard key={scene.id} scene={scene} />
            ))
          ) : (
            <div className="empty">
              <span>
                <Icon name="search" />
              </span>
              <h3>当前条件下没有场景</h3>
              <p>清除部分条件，或使用“换装”“商品”“参考视频”等关键词。</p>
              <button className="secondary" onClick={clear}>
                清除搜索与筛选
              </button>
            </div>
          )}
        </div>
        <div className="pagination">
          <span>
            每页 12 个
            {result.total > 0
              ? ` · ${(result.page - 1) * 12 + 1}–${Math.min(result.page * 12, result.total)}`
              : ''}
          </span>
          <div>
            <button
              className="secondary"
              disabled={result.page === 1}
              onClick={() => {
                change({ page: result.page - 1 });
                document
                  .getElementById('library-results')
                  ?.scrollIntoView({ block: 'start' });
              }}
            >
              上一页
            </button>
            <span>
              {result.page} / {result.pages}
            </span>
            <button
              className="secondary"
              disabled={result.page === result.pages}
              onClick={() => {
                change({ page: result.page + 1 });
                document
                  .getElementById('library-results')
                  ?.scrollIntoView({ block: 'start' });
              }}
            >
              下一页
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
