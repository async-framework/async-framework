// Why: Define shared types for the context system
export interface BaseContext {
  id: string;
  cleanup: Set<() => void>;
  parent?: BaseContext | null;
}

export interface ComponentContext extends BaseContext {
  type: "component";
  hooks: any[];
  hookIndex: number;
  signals: Set<any>;
  mounted: boolean;
  element: HTMLElement | null;
}

export interface SignalContext extends BaseContext {
  type: "signal";
  value: any;
}

export interface ComputedContext extends SignalContext {
  type: "computed";
  dependencies: Set<string>;
}

export interface GlobalContext extends BaseContext {
  type: "global";
  children: Set<BaseContext>;
}
