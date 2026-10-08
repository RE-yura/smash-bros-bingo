import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { BingoPage } from "./components/BingoPage";
import { newCardSearch, parseSearch, stringifySearch, validateBingoSearch } from "./lib/search";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: validateBingoSearch,
  beforeLoad: ({ search }) => {
    // カードが無い（初回・不正な URL）ときは、描画前に生成して URL を置き換える
    if (!search.cells) {
      throw redirect({ to: "/", search: newCardSearch(search), replace: true });
    }
  },
  component: BingoPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
  // 本番は "/smash-bros-bingo/"、開発時は "/"
  basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
  parseSearch,
  stringifySearch,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
