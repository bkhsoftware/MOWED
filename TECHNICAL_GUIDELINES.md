# MOWED Technical Guidelines

## Core Architecture

### EventBus
- Located in `src/core/EventBus.js`
- Use `EventBus.on()` to subscribe to events
- Use `EventBus.off()` to unsubscribe from events
- Use `EventBus.emit()` to trigger events

Example usage in a component:
```javascript
import EventBus from '../../core/EventBus';

export default {
  // ...
  created() {
    EventBus.on('eventName', this.handleEvent);
  },
  beforeUnmount() {
    EventBus.off('eventName', this.handleEvent);
  },
  methods: {
    handleEvent(data) {
      // Handle the event
    }
  }
  // ...
}
```

### Module Development
- Extend `ModuleInterface` from `src/core/ModuleInterface.js`
- Implement required methods: `getName()`, `getDescription()`, `_solve()`, `getInputFields()`
- Use `EventBus.emit()` to communicate module state changes

### State Management
- Use Vuex for global state management
- Use local component state for component-specific data
- Persist data using `localStorage` or `IndexedDB` as appropriate

## IndexedDB Usage

1. Always use the `IndexedDBAdapter` class for interacting with IndexedDB.
2. Ensure that the `init()` method of `IndexedDBAdapter` is called before any other operations.
3. Use the correct store names when performing transactions ('moduleData' for module-specific data, 'offlineQueue' for offline actions).
4. Handle potential errors in all IndexedDB operations using try-catch blocks.

## Vuex Store Best Practices

1. Initialize the IndexedDBAdapter in the `initStore` action before loading module data.
2. Use the `saveModuleData` and `loadModuleData` actions for all module data operations.
3. Implement error handling for all store actions that interact with IndexedDB.
4. Use EventBus to emit error events for critical errors in store actions.

## Component Best Practices

1. Implement a `validateInput()` method to check user inputs before processing.
2. Use try-catch blocks to handle errors in async methods like `solveOptimization`.
3. Check for the existence of DOM elements (e.g., chart canvas) before interacting with them.
4. Clean up resources (e.g., destroy charts) in the `beforeUnmount` hook.
5. Use defensive programming techniques (e.g., null checks, default values) when rendering data.

## Error Handling

1. Log errors to the console for debugging purposes.
2. Emit specific error events using EventBus for critical errors.
3. Provide user-friendly error messages in the UI when operations fail.
4. Implement global error handling for uncaught exceptions.

## Data Management

1. Ensure all data saved to IndexedDB is serializable.
2. Use getters to access module data from the store.
3. Implement data migration strategies for handling changes in data structure between versions.

## Common Pitfalls
1. Forgetting to unsubscribe from EventBus events in the `beforeUnmount` hook
2. Not properly implementing all required methods when creating a new module
3. Misusing Vuex state for component-specific data

## Testing
- Write unit tests for all core functionality and modules
- Use Jest for unit and integration testing
- Use Cypress for end-to-end testing

## Performance Considerations
- Optimize EventBus usage by only subscribing to necessary events
- Use lazy loading for module components to improve initial load time
- Implement proper error handling and logging

## Contribution Guidelines
- Follow the Vue.js style guide for component and module development
- Use meaningful commit messages following conventional commits specification
- Create pull requests for all significant changes

By following these guidelines and implementing the suggested changes, we can significantly reduce the likelihood of similar errors in the future and improve the overall robustness of the MOWED application.

Remember to consult this document when developing new features or modules for MOWED.
