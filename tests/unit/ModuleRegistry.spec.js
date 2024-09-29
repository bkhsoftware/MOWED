mport ModuleRegistry from '@/core/ModuleRegistry';

describe('ModuleRegistry', () => {
  beforeEach(() => {
    ModuleRegistry.modules.clear();
  });

  const createMockModule = (name) => ({
    getName: () => name,
    getDescription: () => `Description of ${name}`,
    solve: () => {},
    getInputFields: () => []
  });

  test('should register and retrieve a module', () => {
    const module = createMockModule('TestModule');
    ModuleRegistry.registerModule(module);
    expect(ModuleRegistry.getModule('TestModule')).toBe(module);
  });

  test('should return all registered modules', () => {
    const module1 = createMockModule('Module1');
    const module2 = createMockModule('Module2');
    ModuleRegistry.registerModule(module1);
    ModuleRegistry.registerModule(module2);
    expect(ModuleRegistry.getAllModules()).toHaveLength(2);
    expect(ModuleRegistry.getAllModules()).toContainEqual(module1);
    expect(ModuleRegistry.getAllModules()).toContainEqual(module2);
  });

  test('should throw error when registering invalid module', () => {
    const invalidModule = { getName: () => 'InvalidModule' };
    expect(() => ModuleRegistry.registerModule(invalidModule)).toThrow('Invalid module');
  });

  test('should throw error when registering duplicate module', () => {
    const module = createMockModule('DuplicateModule');
    ModuleRegistry.registerModule(module);
    expect(() => ModuleRegistry.registerModule(module)).toThrow('already registered');
  });

  test('should throw error when getting non-existent module', () => {
    expect(() => ModuleRegistry.getModule('NonExistentModule')).toThrow('Module not found');
  });
});
