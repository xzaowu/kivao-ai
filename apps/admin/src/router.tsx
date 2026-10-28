import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
const rootRoute = createRootRoute({
  component: Layout,
  notFoundComponent: lazyRouteComponent(
    () => import("./pages/Framework"),
    "NotFoundPage",
  ),
});
const routes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: lazyRouteComponent(
      () => import("./pages/Overview"),
      "OverviewPage",
    ),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/models",
    component: lazyRouteComponent(() => import("./pages/Models"), "ModelsPage"),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/scenes",
    component: lazyRouteComponent(() => import("./pages/Scenes"), "ScenesPage"),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/tasks",
    validateSearch: (search: Record<string, unknown>): { task?: string } =>
      typeof search.task === "string"
        ? { task: search.task.slice(0, 100) }
        : {},
    component: lazyRouteComponent(() => import("./pages/Tasks"), "TasksPage"),
  }),
  ...(["users", "billing", "orders", "library", "settings"] as const).map(
    (path) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path: `/${path}`,
        component: lazyRouteComponent(
          () => import("./pages/Framework"),
          "FrameworkPage",
        ),
      }),
  ),
];
export const router = createRouter({
  routeTree: rootRoute.addChildren(routes),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
