# MOWED Module System

The MOWED application uses a modular architecture to allow for easy extension and maintenance of different optimization problems.

## Module Structure

Each module should implement the following interface:

```javascript
class MyModule {
  getName() {
    // Return the name of the module
  }

  getDescription() {
    // Return a description of what the module does
  }

  solve(input) {
    // Implement the optimization logic
  }

  getInputFields() {
    // Return an array of input field definitions
  }
}
```

## Registering a Module

To register a new module:

1. Create your module class implementing the above interface.
2. In `src/registerModules.js`, import your module and add it to the `ModuleRegistry`:

```javascript
import MyNewModule from './modules/myNewModule';

export function registerModules() {
  // ...
  ModuleRegistry.registerModule(new MyNewModule());
}
```

## Using Module-Specific State

To use module-specific state in your module:

1. Dispatch the `updateModuleState` action in your module's methods:

```javascript
this.$store.dispatch('moduleStore/updateModuleState', {
  moduleName: this.getName(),
  moduleState: { /* your module state */ }
});
```

2. Access the state using the `getModuleState` getter:

```javascript
const moduleState = this.$store.getters['moduleStore/getModuleState'](this.getName());
```

Remember to save the overall state after significant changes:

```javascript
this.$store.dispatch('saveState');
```

## Best Practices

- Keep modules focused on a single type of optimization problem.
- Use clear, descriptive names for your module and its methods.
- Implement proper error handling within your module's `solve` method.
- Use TypeScript or JSDoc comments to document your module's interface and methods.
