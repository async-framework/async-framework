import type { AsyncLoaderContext } from "@async/framework";

export default function handler(
  { rootContext }: AsyncLoaderContext<any, any, any>,
) {
  rootContext.appElement.decrement();
}
