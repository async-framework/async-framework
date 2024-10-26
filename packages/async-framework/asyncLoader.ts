// deno-lint-ignore-file no-explicit-any
import { escapeSelector, isPromise } from "./utils.js";
export interface AsyncLoaderConfig {
  handlerRegistry: { handler: (context: any) => Promise<any> | any };
  eventPrefix?: string;
  containers?: Map<Element, Map<string, Map<Element, string>>>;
  events?: string[];
  processedContainers?: WeakSet<Element>;
  context?: any;
}

export class AsyncLoader {
  /**
   * Data structure: Map<Element, Map<string, Map<Element, string>>>
   *
   * This is a three-level nested Map structure:
   *
   * Level 1: Container Element Map
   * - Key: Element (the container element)
   * - Value: Map<string, Map<Element, string>> (event type map for this container)
   *
   *   Level 2: Event Type Map
   *   - Key: string (the event type, e.g., "click", "custom:event")
   *   - Value: Map<Element, string> (element-handler map for this event type)
   *
   *     Level 3: Element-Handler Map
   *     - Key: Element (the element with the event listener)
   *     - Value: string (the attribute value containing handler information)
   *
   * Example structure:
   * Map(
   *   [containerElement1, Map(
   *     ["click", Map(
   *       [buttonElement1, "handleClick"],
   *       [buttonElement2, "handleOtherClick"]
   *     )],
   *     ["custom:event", Map(
   *       [customElement1, "handleCustomEvent"]
   *     )]
   *   )],
   *   [containerElement2, Map(
   *     ["submit", Map(
   *       [formElement1, "handleSubmit"]
   *     )]
   *   )]
   * )
   *
   * This structure allows for efficient lookup of event handlers:
   * 1. Find the container element
   * 2. Find the event type within that container
   * 3. Find the specific element and its associated handler
   */
  private containers: Map<Element, Map<string, Map<Element, string>>>;
  private handlerRegistry: { handler: (context: any) => Promise<any> | any };
  private events: string[];
  private eventPrefix: string;
  private processedContainers: WeakSet<Element>;
  private context: any;
  private config: AsyncLoaderConfig;
  constructor(config: AsyncLoaderConfig) {
    this.config = config;
    this.context = config.context || {};
    this.handlerRegistry = config.handlerRegistry;
    this.eventPrefix = config.eventPrefix || "on:";
    this.containers = config.containers || new Map();
    this.events = this.dedupeEvents(
      config.events || this.discoverCustomEvents(document.body),
    );

    // Set of processed containers
    this.processedContainers = config.processedContainers || new WeakSet();
  }

  // Initializes the event handling system by parsing the DOM
  // Why: Sets up event listeners and observers for all relevant containers upon initialization.
  init(containerElement = document.body) {
    this.parseDOM(containerElement); // Start parsing from the body element
  }

  dedupeEvents(events: string[]) {
    const uniqueEvents = new Set(events);
    if (uniqueEvents.size < events.length) {
      const duplicates = events.filter((event, index) =>
        events.indexOf(event) !== index
      );
      if (this.config.events) {
        console.warn(
          "AsyncLoader.dedupeEvents: Found duplicate events:",
          duplicates,
        );
      }
    }
    return [...uniqueEvents];
  }

  // Discovers custom events on the container element
  // Why: This method identifies and returns all custom events defined on the container element.
  // It does this by querying all elements within the container, extracting their attributes,
  // filtering those that start with the event prefix, and mapping the remaining attributes to event names.
  // The method ensures that each event is represented only once in the resulting array,
  // eliminating duplicates and providing a list of unique custom events.
  discoverCustomEvents(container) {
    const customEventAttributes = Array.from(container.querySelectorAll("*"))
      .flatMap((el: any) => Array.from(el.attributes))
      .filter((attr: any) => attr.name.startsWith(this.eventPrefix))
      .map((attr: any) => attr.name.slice(this.eventPrefix.length));

    console.log(
      "AsyncLoader.discoverCustomEvents: discovered custom events:",
      this.dedupeEvents(customEventAttributes),
    );
    return customEventAttributes;
  }

  // Parses a root element to identify and handle new containers
  // Why: Ensures dynamic and consistent event handling across the application by:
  // 1. Supporting containers added after initial load
  // 2. Handling various input types (undefined, array, single element)
  // 3. Targeting only elements with 'data-container' attribute
  // 4. Providing error handling for invalid inputs
  // 5. Scaling from simple to complex DOM structures
  // This approach maintains a robust and adaptable event system for evolving DOM structures.
  parseDOM(containerElement: undefined | any[] | any) {
    if (!containerElement) {
      const containerEls = Array.from(
        document.body.querySelectorAll("[data-container]"),
      );
      containerEls.forEach((el) => this.handleNewContainer(el));
    }
    if (Array.isArray(containerElement)) {
      containerElement.forEach((el) => this.handleNewContainer(el));
    } else if (containerElement?.hasAttribute?.("data-container")) {
      this.handleNewContainer(containerElement);
    } else {
      console.warn("AsyncLoader.parseDOM: no container element provided");
    }
  }

  // Handles the setup for a new container
  // Why: This method is crucial for initializing and managing new containers in the application.
  // It performs several important tasks:
  // 1. Prevents duplicate processing of containers, ensuring efficiency
  // 2. Sets up event listeners for the container, enabling event delegation
  // 3. Prepares the container for dynamic content changes (commented out observer)
  // 4. Marks the container as processed to avoid redundant setup
  // 5. Provides a hook for potential lifecycle management (commented out onMount)
  // This comprehensive approach ensures that each container is properly integrated into the
  // event handling system, supporting both initial load and dynamically added containers.
  // It lays the groundwork for efficient event handling and potential future enhancements
  // like DOM observation and component lifecycle management.
  handleNewContainer(el) {
    // Avoid reprocessing the same container
    if (!el.isConnected) {
      console.warn(
        "AsyncLoader.handleNewContainer: container was processed but is not connected",
        el,
      );
      this.processedContainers.delete(el);
    }
    if (this.processedContainers.has(el)) {
      return;
    }

    // Set up event listeners for the container
    const processed = this.setupContainerListeners(el);
    // this.observeContainer(container); // Watch for DOM changes within the container
    if (processed) {
      this.processedContainers.add(el); // Mark the container as processed
    } else {
      if (!el.isConnected) {
        console.log(
          "AsyncLoader.handleNewContainer: container was processed but is not connected",
          el,
        );
      } else {
        console.warn(
          "AsyncLoader.handleNewContainer: container was processed but is not connected",
          el,
        );
        this.processedContainers.delete(el);
      }
    }

    // TODO: add onMount lifecycle hook
    // if (container._controller && typeof container._controller.onMount === 'function') {
    //   container._controller.onMount.call(container._controller, container); // Invoke the onMount lifecycle hook
    // }
  }

  // Sets up event listeners for a container based on its elements
  // Why: This method implements an efficient and flexible event handling system for each container.
  // It achieves this through several key strategies:
  // 1. Event Delegation: Uses a single listener per event type on the container,
  //    rather than individual listeners on child elements. This significantly
  //    reduces the number of event listeners, improving performance and memory usage.
  // 2. Dynamic Handler Association: Allows for runtime binding of handlers to elements,
  //    supporting both initial and dynamically added content without requiring manual updates.
  // 3. Lazy Parsing: Defers the parsing of event handlers until they're needed,
  //    optimizing initial load time and supporting dynamic content efficiently.
  // 4. Capture Phase Utilization: Intercepts events early in the propagation cycle,
  //    ensuring custom logic can be applied before other listeners.
  // 5. Asynchronous Handling: Supports both synchronous and asynchronous event handlers,
  //    allowing for complex operations without blocking the main thread.
  // This approach creates a scalable, performant, and flexible event system that can
  // adapt to changing DOM structures and complex application needs.
  setupContainerListeners(containerElement): boolean {
    if (!containerElement.isConnected) {
      return false;
    }
    // avoid re-setting up listeners for the same container
    if (this.containers.has(containerElement)) {
      return false;
    }
    const listeners = new Map();
    this.containers.set(containerElement, listeners);

    this.events.forEach((eventName) => {
      // console.log('setupContainerListeners: adding event listener for', eventName);
      containerElement.addEventListener(
        eventName,
        (event) => {
          // Lazy parse the element for the event type before handling the event
          this.parseContainerElement(containerElement, eventName);
          // Handle the event when it occurs
          this.handleContainerEvent(containerElement, event);
          // console.log('setupContainerListeners: event handled', res);
        },
        true, // Use capturing phase to ensure the handler runs before other listeners
      );
    });

    // eager parse all events for the container
    // this.events.map((evt) => {
    //   this.parseContainerElement(containerElement, evt);
    // });
    return true;
  }

  // Parses elements within a container to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseContainerElement(containerElement, eventName) {
    // Select elements with 'on:{event}' attributes for example 'on:click'
    const eventAttr = `${this.eventPrefix}${eventName}`;
    const elements = containerElement.querySelectorAll(
      `[${escapeSelector(eventAttr)}]`,
    );
    // console.log('parseContainerElement: parsing container elements', elements, eventName);
    elements.forEach((element: Element) => {
      const eventAttrValue = element.getAttribute(eventAttr);
      if (eventAttrValue) {
        // console.log('parseContainerElement: one attribute value', eventAttrValue);
        this.addEventData(containerElement, eventName, element, eventAttrValue);
      }
    });

    // Mark this event as processed for this container
    // processedEvents.add(eventName);
  }

  // Registers event listeners for specific elements within a container
  // Why: This method organizes event handlers by associating them with specific elements and event types within a container.
  // It enables efficient lookup and invocation of handlers during event propagation.
  // By storing handlers in a nested map structure (container -> event -> element -> handlers),
  // it allows for quick retrieval and execution of relevant handlers when an event occurs,
  // supporting the event delegation pattern and improving performance for containers with many elements.
  addEventData(containerElement, eventName, element, attrValue) {
    if (!containerElement.isConnected) {
      console.warn(
        "AsyncLoader.addEventData: container is not connected",
        containerElement,
      );
      this.processedContainers.delete(containerElement);
      this.containers.delete(containerElement);
      return;
    }
    const listeners = this.containers.get(containerElement);
    if (!listeners) {
      console.warn(
        "AsyncLoader.addEventData: no listeners found for container",
        containerElement,
      );
      return;
    }
    let eventListeners = listeners.get(eventName);
    if (!eventListeners) {
      // console.log('addEventData: adding event listener for', eventName, 'to container', container);
      eventListeners = new Map();
      listeners.set(eventName, eventListeners);
    }
    if (!eventListeners.has(element)) {
      if (element.isConnected) {
        eventListeners.set(element, attrValue); // Map script paths to the element for the given event
      } else {
        console.warn(
          "AsyncLoader.addEventData: element is not connected",
          element,
        );
        eventListeners.delete(element);
      }
    } else {
      /*
        if an element doesn't have any event listeners,
        it means it's a new element or just an element with an attribute like 'on:click'
      */
      // console.warn('addEventData: event listener already exists for', eventName, 'on element', element);
    }
    // console.log('addEventData: listeners', listeners);
  }

  // Creates a custom event
  createEvent(eventName, detail) {
    return new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: detail,
    });
  }

  // Dispatches a custom event to all registered listeners across containers
  // Why: This method provides a centralized mechanism for broadcasting custom events throughout the application.
  // It creates a custom event with the given name and detail, then iterates through all registered containers
  // to find elements with matching event listeners. By parsing container elements on-demand and dispatching
  // the event to relevant elements, it ensures that newly added or dynamically created elements are included.
  // The method uses a null check before accessing properties of potentially undefined objects, addressing
  // the "Object is possibly 'undefined'" linter error. This approach supports a flexible and scalable event
  // system that can handle both static and dynamically generated content, allowing for efficient communication
  // between different parts of the application while maintaining type safety.
  dispatch(eventName: string | CustomEvent, detail?: any) {
    // create the custom event
    let customEvent;
    if (eventName instanceof CustomEvent) {
      customEvent = eventName;
      detail = eventName.detail;
      eventName = eventName.type;
    } else {
      customEvent = this.createEvent(eventName, detail);
    }
    // grab all listeners for the event and emit the event to all elements that have registered handlers for the event
    this.containers.forEach((listeners, containerElement) => {
      // console.log('dispatch: parsing container elements for event', eventName);
      // lazy parse the container for the event type
      this.parseContainerElement(containerElement, eventName);

      // if there are listeners for the event and rely on side effects
      if (listeners.has(eventName)) {
        // Parse the container for the event type before handling the event
        const eventListeners = listeners.get(eventName);
        if (eventListeners) {
          const cleanup: Element[] = [];
          eventListeners.forEach((_attrValue, element) => {
            if (element.isConnected) {
              element.dispatchEvent(customEvent);
            } else {
              cleanup.push(element);
            }
          });
          // remove elements that are not connected
          cleanup.forEach((element) => {
            eventListeners.delete(element);
          });
        }
      }
    });
  }

  // Handles an event occurring within a container
  // Why: This method is responsible for coordinating the execution of event handlers for a given event within a container.
  // It implements event delegation by traversing the DOM tree from the event target up to the container,
  // allowing for efficient event handling even with dynamically added elements.
  // The method:
  // 1. Retrieves the appropriate handler data for the event type and elements
  // 2. Creates a context object with relevant information about the event and container
  // 3. Delegates the actual handler execution to the HandlerRegistry
  // 4. Supports both bubbling and non-bubbling events
  // 5. Manages the execution flow, allowing handlers to break the chain if needed
  // This approach ensures proper coordination between the AsyncLoader and HandlerRegistry,
  // providing a flexible and performant event handling system while keeping the core logic
  // of handler execution separate and reusable.
  async handleContainerEvent(containerElement, domEvent) {
    // deno-lint-ignore no-this-alias
    const self = this;
    // console.log('handleContainerEvent: handling container event', event);
    const listeners = this.containers.get(containerElement);
    if (!listeners) {
      // console.error(
      //   "handleContainerEvent: no listeners found for container",
      //   container
      // );
      return;
    }

    const eventListeners = listeners.get(domEvent.type);
    if (!eventListeners) {
      // if click on elements that don't have event listeners
      // console.error(
      //   "handleContainerEvent: no event listeners found for event",
      //   event.type,
      //   "in container",
      //   container
      // );
      return;
    }

    let element = domEvent.target;
    let stop = false;
    while (element && element !== containerElement && !stop) {
      // console.log('handleContainerEvent: handling event for element', element.tagName, event.type, eventListeners);
      if (eventListeners.has(element)) {
        // Define the context with getters for accessing current state and elements
        let value = undefined;
        const attrValue = eventListeners.get(element); // || element.getAttribute(this.eventPrefix + domEvent.type);
        const context = {
          set value(v) {
            value = v;
          },
          get value() {
            return value;
          },
          // get the attribute value for the event
          get attrValue() {
            return attrValue;
          },
          get dispatch() {
            return self.dispatch.bind(self);
          },
          get element() {
            return element;
          },
          get event() {
            return domEvent;
          },
          get eventName() {
            return domEvent.type;
          },
          get handlers() {
            return self.handlerRegistry;
          },
          get container() {
            return containerElement;
          },
          get canceled() {
            return stop;
          },
          // If the handler sets break to true, stop processing further handlers for this event
          stop() {
            stop = true;
            return stop;
          },
        };
        // copy the context properties from the async loader
        Object.defineProperties(
          context,
          Object.getOwnPropertyDescriptors(this.context),
          // get signals() {
          //   return container._controller.signals;
          // }
        );

        try {
          const res = self.handlerRegistry.handler(context);
          if (isPromise(res)) {
            await res;
          }
        } catch (error) {
          // Reset value if there's an error
          value = undefined;
          console.error(
            `AsyncLoader.handleContainerEvent: Error`,
            error,
          ); // Log any errors during handler execution
        }
        // clear and references to avoid memory leak
        value = undefined;

        // If the event doesn't bubble, stop after handling the first matching element
        if (stop) {
          console.log(
            "AsyncLoader.handleContainerEvent: event was stopped by the handler",
            domEvent,
          );
          break;
        }
        if (!domEvent.bubbles) {
          console.log(
            "AsyncLoader.handleContainerEvent: event does not bubble",
            domEvent,
          );
          stop = true;
          break;
        }
        // if (domEvent.cancelBubble) {
        //   console.log('handleContainerEvent: event was cancelled by the handler', domEvent);
        //   stop = true;
        //   break;
        // }
      }
      // Traverse up the DOM tree for event delegation
      element = element.parentElement;
    }
  }
}
