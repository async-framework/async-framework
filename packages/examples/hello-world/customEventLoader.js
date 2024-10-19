
export class CustomEventLoader {
  constructor(config) {
    this.processedContainers = config.processedContainers || new WeakSet();
    this.containers = config.containers || new Map();
    this.handlerRegistry = config.handlerRegistry;
    this.events = config.events;
  }

    // Initializes the event handling system by parsing the DOM
  // Why: Sets up event listeners and observers for all relevant containers upon initialization.
  init() {
    this.parseDOM(document.body); // Start parsing from the body element
  }
  // init() {
  //   this.setupGlobalListeners();
  // }

  // Parses a root element to identify and handle new containers
  // Why: Dynamically supports containers added after initial load, ensuring event handling remains consistent.
  parseDOM(rootElement) {
    if (rootElement.hasAttribute('data-container')) {
      this.handleNewContainer(rootElement);
    } else {
      const containers = Array.from(rootElement.querySelectorAll('[data-container]'));
      containers.forEach(container => this.handleNewContainer(container));
    }
  }
  // Handles the setup for a new container
  // Why: Establishes event listeners and observers for each container, and initializes component lifecycle.
  handleNewContainer(container) {
    if (this.processedContainers.has(container)) return; // Avoid reprocessing the same container

    this.setupContainerListeners(container); // Set up event listeners
    // this.observeContainer(container); // Watch for DOM changes within the container
    this.processedContainers.add(container); // Mark the container as processed

    if (container._controller && typeof container._controller.onMount === 'function') {
      container._controller.onMount.call(container._controller, container); // Invoke the onMount lifecycle hook
    }
  }
  // Sets up event listeners for a container based on its elements
  // Why: Dynamically binds event handlers to elements within the container using event delegation.
  setupContainerListeners(container) {
    const listeners = new Map();
    this.containers.set(container, listeners);

    // Add a generic event listener for each supported event type
    // Why: Reduces the number of event listeners by delegating events to a single listener per event type.
    const supportedEvents = this.events; // Extend as needed
    supportedEvents.forEach(eventType => {
      container.addEventListener(eventType, async (event) => {
        await this.handleContainerEvent(container, event); // Handle the event when it occurs
      }, true); // Use capturing phase to ensure the handler runs before other listeners
    });

    this.parseContainerElements(container); // Parse and register specific event handlers within the container
  }
  // Parses elements within a container to identify and register event handlers
  // Why: Associates event types and handler scripts with specific elements, enabling dynamic event handling.
  parseContainerElements(container) {
    // Select elements with 'on:event' attributes
    this.events.map((evt) => {
      const elements = container.querySelectorAll(`[on\\:${evt}]`);
      elements.forEach(element => {
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('on:')) {
            const splitIndex = ',';
            // Extract the event name (e.g., 'click' from 'on:click')
            const eventName = attr.name.slice(3);
            // Handle multiple handlers separated by commas
            const scriptPaths = attr.value.split(splitIndex).map(path => path.trim()).filter(path => path);
            // Register the event listener
            this.addListener(container, eventName, element, scriptPaths);
          }
        });
      });
    })
  }

  // Registers event listeners for specific elements within a container
  // Why: Organizes event handlers, enabling efficient lookup and invocation during events.
  addListener(container, eventName, element, scriptPaths) {
    const listeners = this.containers.get(container);
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Map());
    }
    listeners.get(eventName).set(element, scriptPaths); // Map script paths to the element for the given event
  }

// Handles an event occurring within a container
  // Why: Executes all relevant handlers for the event, ensuring proper signal updates and rendering.
  async handleContainerEvent(container, event) {
    const listeners = this.containers.get(container);
    if (!listeners) return;

    const eventListeners = listeners.get(event.type);
    if (!eventListeners) return;

    let element = event.target;
    while (element && element !== container) {
      if (eventListeners.has(element)) {
        const scriptPaths = eventListeners.get(element);

        // Define the context with getters for accessing current state and elements
        let value = undefined;
        const context = {
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
            const handler = await this.handlerRegistry.getHandler(scriptPath);
            if (typeof handler === 'function') {
              const returnedValue = await handler(context); // Execute the handler asynchronously
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
            console.error(`Error executing handler at ${scriptPath}:`, error); // Log any errors during handler execution
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