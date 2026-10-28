import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  lazyRouteComponent,
} from '@tanstack/react-router';
import { AppRoot } from './components/AppRoot';
import { CanvasPage, DesignPage, NotFoundPage } from './pages/StaticPages';
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
  loader: () => demo.ensureDraft('free-image'),
  component: lazyRouteComponent(
    () => import('./pages/WorkspacePages'),
    'ImagesPage',
  ),
});
const videosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/videos',
  loader: () => demo.ensureDraft('free-video'),
  component: lazyRouteComponent(
    () => import('./pages/WorkspacePages'),
    'VideosPage',
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
  component: CanvasPage,
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
    videosRoute,
    scenesRoute,
    sceneRoute,
    creationsRoute,
    creationRoute,
    worksRoute,
    materialsRoute,
    canvasRoute,
    designRoute,
    aboutRoute,
  ]),
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
