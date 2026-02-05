import widgetStyles from "./index.css?inline";
import { createElement } from "react";
import type { Root } from "react-dom/client";
import type { WidgetProps } from "./Widget";

export { default as Widget } from "./Widget";
export type { WidgetProps } from "./Widget";

export type CreateWidgetOptions = WidgetProps & {
  element?: HTMLElement | string;
  defer?: boolean;
  idleTimeoutMs?: number;
  useShadowDom?: boolean;
};

const DEFAULT_IDLE_TIMEOUT_MS = 1500;
type IdleCallbackOptions = { timeout?: number };
type IdleDeadline = { didTimeout: boolean; timeRemaining: () => number };
type RequestIdleCallback = (callback: (deadline: IdleDeadline) => void, options?: IdleCallbackOptions) => number;

const resolveHostElement = (element?: HTMLElement | string): HTMLElement => {
  if (!element) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return el;
  }

  if (typeof element === "string") {
    const el = document.querySelector(element);
    if (!el) {
      throw new Error(`cintrix-widget: element not found for selector "${element}"`);
    }
    return el as HTMLElement;
  }

  return element;
};

export const createWidget = (options: CreateWidgetOptions) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("cintrix-widget: createWidget can only run in a browser environment.");
  }

  const {
    element,
    defer = true,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    useShadowDom = true,
    ...props
  } = options;

  let root: Root | null = null;
  let shadowRoot: ShadowRoot | null = null;
  let hostElement: HTMLElement | null = null;

  const mount = async () => {
    const host = resolveHostElement(element);
    hostElement = host;
    const [{ createRoot }, { default: Widget }] = await Promise.all([
      import("react-dom/client"),
      import("./Widget"),
    ]);

    let mountNode: HTMLElement = host;
    if (useShadowDom && host.attachShadow) {
      shadowRoot = host.attachShadow({ mode: "open" });
      const styleTag = document.createElement("style");
      styleTag.textContent = widgetStyles;
      shadowRoot.appendChild(styleTag);
      const shadowMount = document.createElement("div");
      shadowRoot.appendChild(shadowMount);
      mountNode = shadowMount;
    }

    root = createRoot(mountNode);
    root.render(createElement(Widget, props));
  };

  if (defer) {
    const requestIdle = (window as Window & { requestIdleCallback?: RequestIdleCallback }).requestIdleCallback;
    if (requestIdle) {
      requestIdle(() => void mount(), { timeout: idleTimeoutMs });
    } else {
      setTimeout(() => void mount(), idleTimeoutMs);
    }
  } else {
    void mount();
  }

  return {
    mount: () => void mount(),
    destroy: () => {
      root?.unmount();
      if (shadowRoot && hostElement) {
        hostElement.removeAttribute("data-cintrix-widget");
      }
    },
  };
};
