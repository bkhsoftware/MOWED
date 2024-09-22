class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  registerModule(module) {
    if (!this.isValidModule(module)) {
      throw new Error(`Invalid module: ${module.getName()} does not implement all required methods`);
    }
    if (this.modules.has(module.getName())) {
      throw new Error(`Module ${module.getName()} is already registered`);
    }
    this.modules.set(module.getName(), module);
  }

  getModule(name) {
    if (!this.modules.has(name)) {
      throw new Error(`Module not found: ${name}`);
    }
    return this.modules.get(name);
  }

  getAllModules() {
    return Array.from(this.modules.values());
  }

  isValidModule(module) {
    const requiredMethods = ['getName', 'getDescription', 'solve', 'getInputFields'];
    return requiredMethods.every(method => typeof module[method] === 'function');
  }
}

export default new ModuleRegistry();
