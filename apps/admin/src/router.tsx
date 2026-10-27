import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout, OverviewPage, ScenesPage, NotFoundPage } from './pages';

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: OverviewPage });
const scenesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/scenes', component: ScenesPage });
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, scenesRoute]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
