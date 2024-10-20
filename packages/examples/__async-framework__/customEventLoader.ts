// deno-lint-ignore-file no-explicit-any

export class CustomEventLoader {
  private eventPrefix: string;
  private containers: Map<any, any>;
  private handlerRegistry: any;
  private events: string[];
  private processedContainers: WeakSet<any>;
  private parsedElements: WeakMap<any, any>;
  private parsedElementsEvents: WeakMap<any, any>;

  constructor(config: any) {
    this.eventPrefix = config.eventPrefix || "on:";
    this.containers = config.containers || new Map();
    this.handlerRegistry = config.handlerRegistry;
    this.events = config.events || this.discoverCustomEvents(document.body);

    // Set of processed containers
    this.processedContainers = config.processedContainers || new WeakSet();
    // Map of elements to their processed events
    this.parsedElements = config.parsedElements || new WeakMap();
    // Map of elements to their processed events
    this.parsedElementsEvents = config.parsedElementsEvents || new WeakMap();
  }

  // Initializes the event handling system by parsing the DOM
  // Why: Sets up event listeners and observers for all relevant containers upon initialization.
  init(containerElement = document.body) {
    this.parseDOM(containerElement); // Start parsing from the body element
  }
  discoverCustomEvents(container) {
    const customEventAttributes = Array.from(container.querySelectorAll("*"))
      .flatMap((el: any) => Array.from(el.attributes))
      .filter((attr: any) => attr.name.startsWith(this.eventPrefix))
      .map((attr: any) => attr.name.slice(this.eventPrefix.length));

    const events = [...new Set(customEventAttributes)]; // Remove duplicates
    console.log("discoverCustomEvents: discovered custom events:", events);
    return events;
  }

  // Parses a root element to identify and handle new containers
  // Why: Dynamically supports containers added after initial load, ensuring event handling remains consistent.
  parseDOM(containerElement: undefined | any[] | any) {
    if (!containerElement) {
      const containers = Array.from(
        document.body.querySelectorAll("[data-container]")
      );
      containers.forEach((container) => this.handleNewContainer(container));
    }
    if (Array.isArray(containerElement)) {
      containerElement.forEach((container) =>
        this.handleNewContainer(container)
      );
    } else if (containerElement?.hasAttribute?.("data-container")) {
      this.handleNewContainer(containerElement);
    } else {
      console.warn("parseDOM: no container element provided");
    }
  }

  // Handles the setup for a new container
  // Why: Establishes event listeners and observers for each container, and initializes component lifecycle.
  handleNewContainer(container) {
    if (this.processedContainers.has(container)) return; // Avoid reprocessing the same container

    this.setupContainerListeners(container); // Set up event listeners
    // this.observeContainer(container); // Watch for DOM changes within the container
    this.processedContainers.add(container); // Mark the container as processed

    // TODO: add onMount lifecycle hook
    // if (container._controller && typeof container._controller.onMount === 'function') {
    //   container._controller.onMount.call(container._controller, container); // Invoke the onMount lifecycle hook
    // }
  }

  // Sets up event listeners for a container based on its elements
  // Why: Dynamically binds event handlers to elements within the container using event delegation.
  setupContainerListeners(container) {
    const listeners = new Map();
    this.containers.set(container, listeners);

    // Add a generic event listener for each supported event type
    // Why: Reduces the number of event listeners by delegating events to a single listener per event type.
    const supportedEvents = this.events; // Extend as needed
    supportedEvents.forEach((eventName) => {
      // console.log('setupContainerListeners: adding event listener for', eventName);
      container.addEventListener(
        eventName,
        async (event) => {
          // console.log('setupContainerListeners: event triggered', event);
          // Parse the element for the event type before handling the event
          this.parseContainerElement(container, eventName);
          // Handle the event when it occurs
          await this.handleContainerEvent(container, event);
          // Use capturing phase to ensure the handler runs before other listeners
        },
        true
      );
    });
    // console.log('setupContainerListeners: container listeners', this.containers);
  }

  // Parses an element to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseElementForEvent(container, element, eventName, eventAttr) {
    const processedElementEvent = getCachedSet(
      this.parsedElementsEvents,
      element
    );

    // If this event has already been processed for this element, return
    if (processedElementEvent.has(eventName)) {
      // console.log('parseElementForEvent: event already processed', eventName, 'for element', element);
      return;
    }

    const attrValue = element.getAttribute(eventAttr);
    // console.log('parseElementForEvent: event attribute value', attrValue, eventAttr, eventName);
    if (attrValue) {
      const splitIndex = this.handlerRegistry.splitIndex;
      // console.log('parseElementForEvent: event name', eventName);
      const split = attrValue.split(splitIndex);
      // console.log('parseElementForEvent: event name', split);

      // Handle multiple handlers separated by commas
      const scriptPaths = split
        .map((path) => path.trim())
        .filter((path) => path);
      // console.log('parseElementForEvent: script paths', scriptPaths);

      // Register the event listener
      this.addListener(container, eventName, element, scriptPaths);
    }

    processedElementEvent.add(eventName);
  }
  // Parses elements within a container to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseContainerElements(container, events) {
    // Select elements with 'on:event' attributes
    events.map((evt) => {
      this.parseContainerElement(container, evt);
    });
  }
  // Parses elements within a container to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseContainerElement(container, eventName) {
    // Get the Set of processed events for this container, or create a new one if it doesn't exist
    const processedEvents = getCachedSet(this.parsedElements, container);

    // If this event has already been processed for this container, return
    if (processedEvents.has(eventName)) {
      // console.log('parseContainerElement: event already processed', eventName, 'for container', container);
      return;
    }
    // console.log('parseContainerElement: processing event', eventName, 'for container', container);

    // Select elements with 'on:{event}' attributes for example 'on:click'
    const eventAttr = `${this.eventPrefix}${eventName}`;
    const elements = container.querySelectorAll(
      `[${escapeSelector(eventAttr)}]`
    );
    // console.log('parseContainerElement: parsing container elements', elements, eventName);
    elements.forEach((element) => {
      const eventAttrValue = element.getAttribute(eventAttr);
      if (eventAttrValue) {
        // console.log('parseContainerElement: one attribute value', eventAttrValue);
        this.parseElementForEvent(container, element, eventName, eventAttr);
      } else {
        // Parse the element for the event type before handling the event
        Array.from(element.attributes).forEach((attr) => {
          if (attr.name.startsWith(this.eventPrefix)) {
            // console.log('parseContainerElement: parsing element attribute', attr.name);
            this.parseElementForEvent(container, element, eventName, attr.name);
          }
        });
      }
    });

    // Mark this event as processed for this container
    processedEvents.add(eventName);
  }

  // Registers event listeners for specific elements within a container
  // Why: Organizes event handlers, enabling efficient lookup and invocation during events.
  addListener(container, eventName, element, scriptPaths) {
    const listeners = this.containers.get(container);
    if (!listeners) {
      console.warn("addListener: no listeners found for container", container);
      return;
    }
    if (!listeners.has(eventName)) {
      // console.log('addListener: adding event listener for', eventName, 'to container', container);
      listeners.set(eventName, new Map());
    }
    listeners.get(eventName).set(element, scriptPaths); // Map script paths to the element for the given event
    // console.log('addListener: listeners', listeners);
  }

  // Why: Dispatches an event to all elements that have registered handlers for the event
  dispatch(eventName, detail) {
    // create the custom event
    const event = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: detail,
    });
    // grab all listeners for the event and emit the event to all elements that have registered handlers for the event
    this.containers.forEach((listeners, container) => {
      // console.log('dispatch: parsing container elements for event', eventName);
      this.parseContainerElement(container, eventName);
      if (listeners.has(eventName)) {
        // Parse the container for the event type before handling the event
        listeners.get(eventName).forEach((_handlers, element) => {
          // console.log('dispatch: dispatching event', eventName, 'to element', element);
          element.dispatchEvent(event);
        });
      }
    });
  }

  // Handles an event occurring within a container
  // Why: Executes all relevant handlers for the event, ensuring proper signal updates and rendering.
  async handleContainerEvent(container, event) {
    // deno-lint-ignore no-this-alias
    const self = this;
    // console.log('handleContainerEvent: handling container event', event);
    const listeners = this.containers.get(container);
    if (!listeners) {
      console.warn(
        "handleContainerEvent: no listeners found for container",
        container
      );
      return;
    }

    const eventListeners = listeners.get(event.type);
    if (!eventListeners) {
      console.warn(
        "handleContainerEvent: no event listeners found for event",
        event.type,
        "in container",
        container
      );
      return;
    }

    let element = event.target;
    while (element && element !== container) {
      // console.log('handleContainerEvent: handling event for element', element.tagName, event.type, eventListeners);
      if (eventListeners.has(element)) {
        // console.log('handleContainerEvent: found event listeners for element', element.tagName, event.type, eventListeners);
        const scriptPaths = eventListeners.get(element);

        // Define the context with getters for accessing current state and elements
        let value = undefined;
        const context = {
          get dispatch() {
            return self.dispatch.bind(self);
          },
          get value() {
            return value;
          },
          get element() {
            return element;
          },
          get event() {
            return event;
          },
          get container() {
            return container;
          },
          // If the handler sets break to true, stop processing further handlers for this event
          break: false,
          // TODO: controller/signal
          // get controller() {
          //   return container._controller;
          // },
          // get signals() {
          //   return container._controller.signals;
          // }
        };

        for (const scriptPath of scriptPaths) {
          try {
            // Retrieve the handler from the registry
            let handler = self.handlerRegistry.getHandler(scriptPath);
            // If we need to grab an async handler, wait for it to resolve
            if (isPromise(handler)) {
              handler = await handler;
            }
            if (typeof handler === "function") {
              let returnedValue = handler(context);
              // if the handler returns a promise, wait for it to resolve
              if (isPromise(returnedValue)) {
                // Execute the handler asynchronously
                returnedValue = await returnedValue;
              }
              // If the handler returns a value, store it
              if (returnedValue !== undefined) {
                value = returnedValue;
              }
              // If the handler sets break to true, stop processing further handlers for this event
              if (context.break) break;
            }
          } catch (error) {
            // Reset value if there's an error
            value = undefined;
            console.error(
              `handleContainerEvent: Error executing handler at ${scriptPath}:`,
              error
            ); // Log any errors during handler execution
          }
        }
        // clear and references to avoid memory leak
        value = undefined;

        // If the event doesn't bubble, stop after handling the first matching element
        if (!event.bubbles) break;
      }
      // Traverse up the DOM tree for event delegation
      element = element.parentElement;
    }
  }
}

// Why: Escapes special characters in selectors to ensure they are treated as literal characters in CSS selectors
function escapeSelector(selector) {
  return selector.replace(/[^\w\s-]/g, (match) => `\\${match}`);
}

// Memoization/Caching helper function
// Why: Implements a "compute once, use many times" pattern to efficiently manage Sets for various keys
function getCachedSet(map, key) {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  return set;
}

function isPromise(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}
