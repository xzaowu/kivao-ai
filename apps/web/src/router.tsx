import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout, ScenesPage, AboutPage, NotFoundPage } from './pages';

const rootRoute = createRootRoute({ component: Layout, notFoundComponent: NotFoundPage });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: ScenesPage });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: AboutPage });
export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, aboutRoute]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
