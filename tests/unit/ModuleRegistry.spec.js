import ModuleRegistry from '@/core/ModuleRegistry';
import PersonalFinance from '@/modules/PersonalFinance';

describe('ModuleRegistry', () => {
  beforeEach(() => {
    // Clear the registry before each test
    ModuleRegistry.modules.clear();
  });

  it('should register and retrieve a module', () => {
    const module = new PersonalFinance();
    ModuleRegistry.registerModule(module);
    expect(ModuleRegistry.getModule('Personal Finance')).toBe(module);
  });

  it('should return all registered modules', () => {
    const module1 = new PersonalFinance();
    const module2 = { 
      getName: () => 'Dummy Module', 
      getDescription: () => 'A dummy module for testing' 
    };
    ModuleRegistry.registerModule(module1);
    ModuleRegistry.registerModule(module2);
    expect(ModuleRegistry.getAllModules()).toHaveLength(2);
    expect(ModuleRegistry.getAllModules()).toContainEqual(module1);
    expect(ModuleRegistry.getAllModules()).toContainEqual(module2);
  });
});
