import EventBus from './EventBus';
import store from '../store';

export default class ModuleInterface {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  getName() {
    return this.name;
  }

  getDescription() {
    return this.description;
  }

  async solve(input) {
    this.validateInput(input);
    EventBus.emit('moduleSolveStart', { moduleName: this.name, input });
    
    let result;
    if (store.state.isOnline) {
      result = await this._solve(input);
      EventBus.emit('moduleSolveEnd', { moduleName: this.name, result });
    } else {
      // If offline, queue the solve action
      store.dispatch('performAction', {
        type: 'queuedSolve',
        payload: { moduleName: this.name, input }
      });
      result = { message: 'Solve queued for when online' };
    }
    
    return result;
  }

  _solve(input) {
    throw new Error('_solve method must be implemented by subclass');
  }

  getInputFields() {
    throw new Error('getInputFields method must be implemented by subclass');
  }

  validateInput(input) {
    const fields = this.getInputFields();
    for (const field of fields) {
      if (!(field.name in input)) {
        throw new Error(`Missing required field: ${field.name}`);
      }
      if (field.type === 'number' && typeof input[field.name] !== 'number') {
        throw new Error(`Field ${field.name} must be a number`);
      }
      if (field.type === 'array' && !Array.isArray(input[field.name])) {
        throw new Error(`Field ${field.name} must be an array`);
      }
    }
  }
}
