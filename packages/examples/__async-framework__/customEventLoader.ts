// deno-lint-ignore-file no-explicit-any

export class CustomEventLoader {
  private eventPrefix: string;
  private containers: Map<any, any>;
  private handlerRegistry: any;
  private events: string[];
  private processedContainers: WeakSet<any>;
  // private parsedElements: WeakMap<any, any>;
  // private parsedElementsEvents: WeakMap<any, any>;

  constructor(config: any) {
    this.eventPrefix = config.eventPrefix || "on:";
    this.containers = config.containers || new Map();
    this.handlerRegistry = config.handlerRegistry;
    this.events = config.events || this.discoverCustomEvents(document.body);

    // Set of processed containers
    this.processedContainers = config.processedContainers || new WeakSet();
    // Map of elements to their processed events
    // this.parsedElements = config.parsedElements || new WeakMap();
    // Map of elements to their processed events
    // this.parsedElementsEvents = config.parsedElementsEvents || new WeakMap();
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
        document.body.querySelectorAll("[data-container]")
      );
      containerEls.forEach((el) => this.handleNewContainer(el));
    }
    if (Array.isArray(containerElement)) {
      containerElement.forEach((el) =>
        this.handleNewContainer(el)
      );
    } else if (containerElement?.hasAttribute?.("data-container")) {
      this.handleNewContainer(containerElement);
    } else {
      console.warn("parseDOM: no container element provided");
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
    if (this.processedContainers.has(el)) return;

    // Set up event listeners for the container
    this.setupContainerListeners(el);
    // this.observeContainer(container); // Watch for DOM changes within the container
    this.processedContainers.add(el); // Mark the container as processed

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
  setupContainerListeners(containerElement) {
    const listeners = new Map();
    this.containers.set(containerElement, listeners);
    const supportedEvents = this.events; // Extend as needed

    supportedEvents.forEach((eventName) => {
      // console.log('setupContainerListeners: adding event listener for', eventName);
      containerElement.addEventListener(
        eventName,
        async (event) => {
          // console.log('setupContainerListeners: event triggered', event);
          // Lazy parse the element for the event type before handling the event
          this.parseContainerElement(containerElement, eventName);
          // Handle the event when it occurs
          await this.handleContainerEvent(containerElement, event);
          // console.log('setupContainerListeners: event handled', res);
        },
        true // Use capturing phase to ensure the handler runs before other listeners
      );
    });
    // console.log('setupContainerListeners: container listeners', this.containers);
    
    // eager parse all events for the container
    // this.parseContainerElements(container, supportedEvents);
  }

  // Parses an element to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseElementForEvent(containerElement, element, eventName, eventAttr) {
    // const processedElementEvent = getCachedSet(
    //   this.parsedElementsEvents,
    //   element
    // );

    // If this event has already been processed for this element, return
    // if (processedElementEvent.has(eventName)) {
      // console.log('parseElementForEvent: event already processed', eventName, 'for element', element);
    //   return;
    // }

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
      this.addEventData(containerElement, eventName, element, scriptPaths);
    }

    // processedElementEvent.add(eventName);
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
  parseContainerElement(containerElement, eventName) {
    // console.log('parseContainerElement: parsing container elements', eventName);
    // Get the Set of processed events for this container, or create a new one if it doesn't exist
    // const processedEvents = getCachedSet(this.parsedElements, container);

    // If this event has already been processed for this container, return
    // if (processedEvents.has(eventName)) {
      // console.log('parseContainerElement: event already processed', eventName, 'for container', container);
    //   return;
    // }
    // console.log('parseContainerElement: processing event', eventName, 'for container', container);

    // Select elements with 'on:{event}' attributes for example 'on:click'
    const eventAttr = `${this.eventPrefix}${eventName}`;
    const elements = containerElement.querySelectorAll(
      `[${escapeSelector(eventAttr)}]`
    );
    // console.log('parseContainerElement: parsing container elements', elements, eventName);
    elements.forEach((element) => {
      const eventAttrValue = element.getAttribute(eventAttr);
      if (eventAttrValue) {
        // console.log('parseContainerElement: one attribute value', eventAttrValue);
        this.parseElementForEvent(containerElement, element, eventName, eventAttr);
      } else {
        // Parse the element for the event type before handling the event
        Array.from(element.attributes).forEach((attr: any) => {
          if (attr.name.startsWith(this.eventPrefix)) {
            // console.log('parseContainerElement: parsing element attribute', attr.name);
            this.parseElementForEvent(containerElement, element, eventName, attr.name);
          }
        });
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
  addEventData(containerElement, eventName, element, scriptPaths) {
    const listeners = this.containers.get(containerElement);
    if (!listeners) {
      console.warn("addEventData: no listeners found for container", containerElement);
      return;
    }
    if (!listeners.has(eventName)) {
      // console.log('addEventData: adding event listener for', eventName, 'to container', container);
      listeners.set(eventName, new Map());
    }
    if (!listeners.get(eventName).has(element)) {
      listeners.get(eventName).set(element, scriptPaths); // Map script paths to the element for the given event
    } else {
      /*
        if an element doesn't have any event listeners,
        it means it's a new element or just an element with an attribute like 'on:click'
      */
      // console.warn('addEventData: event listener already exists for', eventName, 'on element', element);
    }
    // console.log('addEventData: listeners', listeners);
  }

  // Why: This method provides a centralized mechanism for dispatching custom events across the application.
  // It creates a custom event with the given name and detail, then iterates through all registered containers
  // to find elements with matching event listeners. By parsing container elements on-demand and dispatching
  // the event to relevant elements, it ensures that newly added or dynamically created elements are included.
  // This approach supports a flexible and scalable event system that can handle both static and dynamically
  // generated content, allowing for efficient communication between different parts of the application.
  dispatch(eventName, detail) {
    // create the custom event
    const customEvent = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: detail,
    });
    // grab all listeners for the event and emit the event to all elements that have registered handlers for the event
    this.containers.forEach((listeners, containerElement) => {
      // console.log('dispatch: parsing container elements for event', eventName);
      this.parseContainerElement(containerElement, eventName);
      if (listeners.has(eventName)) {
        // Parse the container for the event type before handling the event
        listeners.get(eventName).forEach((_handlers, element) => {
          // console.log('dispatch: dispatching event', eventName, 'to element', element);
          element.dispatchEvent(customEvent);
        });
      }
    });
  }

  // Handles an event occurring within a container
  // Why: This method is responsible for executing all relevant handlers for a given event within a container.
  // It implements event delegation by traversing the DOM tree from the event target up to the container,
  // allowing for efficient event handling even with dynamically added elements.
  // The method:
  // 1. Retrieves the appropriate handlers for the event type and elements
  // 2. Executes handlers in order, passing a context object with relevant information
  // 3. Supports both synchronous and asynchronous handlers
  // 4. Allows handlers to break the execution chain if needed
  // 5. Manages the execution context to prevent memory leaks
  // This approach ensures proper updates to the application state and triggers necessary re-renders,
  // while providing a flexible and performant event handling system.
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
      // this.parseContainerElement(container, event.type);
      // return this.handleContainerEvent(container, event);
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
      // this.parseContainerElement(container, event.type);
      // return this.handleContainerEvent(container, event);
      return;
    }

    let element = domEvent.target;
    while (element && element !== containerElement) {
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
            return domEvent;
          },
          get container() {
            return containerElement;
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
              // console.log('handleContainerEvent: waiting for handler to resolve', scriptPath);
              handler = await handler;
            }
            if (typeof handler === "function") {
              let returnedValue = handler(context);
              // if the handler returns a promise, wait for it to resolve
              if (isPromise(returnedValue)) {
                // console.log('handleContainerEvent: waiting for handler to resolve', scriptPath);
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
        if (!domEvent.bubbles) break;
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
// function getCachedSet(map, key) {
//   let set = map.get(key);
//   if (!set) {
//     set = new Set();
//     map.set(key, set);
//   }
//   return set;
// }

function isPromise(value) {
  return value && typeof value === "object" && typeof value.then === "function";
}