class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  registerModule(module) {
    this.modules.set(module.getName(), module);
  }

  getModule(name) {
    return this.modules.get(name);
  }

  getAllModules() {
    return Array.from(this.modules.values());
  }
}

export default new ModuleRegistry();
