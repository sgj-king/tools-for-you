import { createRouter, createWebHistory } from 'vue-router';
import { layouts } from './layouts/index';
import HomePage from './pages/HomeNew.page.vue';
import NotFound from './pages/404.page.vue';
import CategoryList from './pages/CategoryList.vue';
import ToolsList from './pages/ToolsList.vue';
import { tools } from './tools';
import { config } from './config';
import { routes as demoRoutes } from './ui/demo/demo.routes';

// 导入布局
import NoSidebarLayout from './layouts/no-sidebar.layout.vue';
import ToolDetailLayout from './layouts/tool-detail.layout.vue';

// 定义布局映射
const customLayouts = {
  base: layouts.base,
  toolLayout: layouts.toolLayout,
  noSidebar: NoSidebarLayout,
  toolDetail: ToolDetailLayout,
};

const toolsRoutes = tools.map(({ path, name, component, ...config }) => ({
  path,
  name,
  component,
  meta: { isTool: true, layout: customLayouts.toolDetail, name, ...config },
}));

const toolsRedirectRoutes = tools
  .filter(({ redirectFrom }) => redirectFrom && redirectFrom.length > 0)
  .flatMap(
    ({ path, redirectFrom }) => redirectFrom?.map(redirectSource => ({ path: redirectSource, redirect: path })) ?? [],
  );

const router = createRouter({
  history: createWebHistory(config.app.baseUrl),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { layout: customLayouts.noSidebar },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('./pages/Auth.vue'),
      meta: { layout: customLayouts.noSidebar },
    },
    {
      path: '/category/:slug',
      name: 'category',
      component: CategoryList,
      meta: { layout: customLayouts.noSidebar },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./pages/About.vue'),
      meta: { layout: customLayouts.noSidebar },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('./pages/Contact.vue'),
      meta: { layout: customLayouts.noSidebar },
    },
    {
      path: '/tools',
      name: 'tools',
      component: ToolsList,
      meta: { layout: customLayouts.toolDetail },
    },
    ...toolsRoutes,
    ...toolsRedirectRoutes,
    ...(config.app.env === 'development' ? demoRoutes : []),
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
    },
  ],
});

export default router;
