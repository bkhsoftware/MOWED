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

  // This method should be overridden by specific modules
  solve(input) {
    throw new Error('solve method must be implemented');
  }

  // This method should be overridden by specific modules
  getInputFields() {
    throw new Error('getInputFields method must be implemented');
  }
}
