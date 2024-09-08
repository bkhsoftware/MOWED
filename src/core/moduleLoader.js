const modules = {}

export function registerModule(name, module) {
  modules[name] = module
}

export function getModule(name) {
  return modules[name]
}

export function getAllModules() {
  return Object.keys(modules)
}
