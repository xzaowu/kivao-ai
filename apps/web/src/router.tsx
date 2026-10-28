import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from '@tanstack/react-router';
import { AppRoot } from './components/AppRoot';
import { DesignPage, NotFoundPage } from './pages/StaticPages';
import features from './data/features.json';
import { demo } from './demo/store';

const rootRoute = createRootRoute({
  component: AppRoot,
  notFoundComponent: NotFoundPage,
  errorComponent: NotFoundPage,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./pages/Home'), 'HomePage'),
});
const imagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/images',
  component: lazyRouteComponent(
    () => import('./pages/FeaturePages'),
    'ImagesPage',
  ),
});
const videosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/videos',
  component: lazyRouteComponent(
    () => import('./pages/FeaturePages'),
    'VideosPage',
  ),
});
const imageToolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/images/$toolId',
  loader: ({ params }) => {
    const tool = features.IMAGE_TOOLS.find((t) => t.id === params.toolId);
    if (!tool) throw new Error('没有这个图片功能');
    return demo.ensureDraft(tool.scene);
  },
  component: lazyRouteComponent(
    () => import('./pages/FeaturePages'),
    'ImageToolPage',
  ),
});
const videoToolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/videos/$toolId',
  loader: ({ params }) => {
    const tool = features.VIDEO_TOOLS.find((t) => t.id === params.toolId);
    if (!tool) throw new Error('没有这个视频功能');
    return demo.ensureDraft(tool.scene);
  },
  component: lazyRouteComponent(
    () => import('./pages/FeaturePages'),
    'VideoToolPage',
  ),
});
const scenesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scenes',
  component: lazyRouteComponent(
    () => import('./pages/SceneLibrary'),
    'SceneLibraryPage',
  ),
});
const sceneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scenes/$sceneId',
  component: lazyRouteComponent(
    () => import('./pages/SceneDetail'),
    'SceneDetailPage',
  ),
});
const creationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/creations',
  component: lazyRouteComponent(
    () => import('./pages/LibraryPages'),
    'CreationsPage',
  ),
});
const creationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/creations/$creationId',
  component: lazyRouteComponent(
    () => import('./pages/WorkspacePages'),
    'CreationPage',
  ),
});
const worksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/works',
  component: lazyRouteComponent(
    () => import('./pages/LibraryPages'),
    'WorksPage',
  ),
});
const materialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/materials',
  component: lazyRouteComponent(
    () => import('./pages/LibraryPages'),
    'MaterialsPage',
  ),
});
const canvasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canvas',
  component: lazyRouteComponent(
    () => import('./canvas/CanvasPages'),
    'CanvasPage',
  ),
});
const canvasEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/canvas/$boardId',
  component: lazyRouteComponent(
    () => import('./canvas/CanvasPages'),
    'CanvasEditorPage',
  ),
});
const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: DesignPage,
});
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  beforeLoad: () => {
    throw redirect({ to: '/design' });
  },
});
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    imagesRoute,
    imageToolRoute,
    videosRoute,
    videoToolRoute,
    scenesRoute,
    sceneRoute,
    creationsRoute,
    creationRoute,
    worksRoute,
    materialsRoute,
    canvasRoute,
    canvasEditorRoute,
    designRoute,
    aboutRoute,
  ]),
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
