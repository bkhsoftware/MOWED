import ModuleInterface from '@/core/ModuleInterface';
import EventBus from '@/core/EventBus';
import store from '@/store';

jest.mock('@/core/EventBus');
jest.mock('@/store', () => ({
  state: {
    isOnline: true
  },
  dispatch: jest.fn()
}));

describe('ModuleInterface', () => {
  let moduleInterface;

  beforeEach(() => {
    moduleInterface = new ModuleInterface('Test', 'Test Description');
    moduleInterface.getInputFields = jest.fn().mockReturnValue([
      { name: 'testField', type: 'number' },
      { name: 'testArray', type: 'array' }
    ]);
    moduleInterface._solve = jest.fn().mockResolvedValue({ result: 'test' });
    EventBus.emit.mockClear();
    store.dispatch.mockClear();
  });

  test('getName returns the correct name', () => {
    expect(moduleInterface.getName()).toBe('Test');
  });

  test('getDescription returns the correct description', () => {
    expect(moduleInterface.getDescription()).toBe('Test Description');
  });

  test('solve method calls _solve and emits events when online', async () => {
    const input = { testField: 42 };
    const result = await moduleInterface.solve(input);

    expect(EventBus.emit).toHaveBeenCalledWith('moduleSolveStart', { moduleName: 'Test', input });
    expect(moduleInterface._solve).toHaveBeenCalledWith(input);
    expect(EventBus.emit).toHaveBeenCalledWith('moduleSolveEnd', { moduleName: 'Test', result: { result: 'test' } });
    expect(result).toEqual({ result: 'test' });
  });

  test('solve method queues action when offline', async () => {
    store.state.isOnline = false;
    const input = { testField: 42 };
    const result = await moduleInterface.solve(input);

    expect(store.dispatch).toHaveBeenCalledWith('performAction', {
      type: 'queuedSolve',
      payload: { moduleName: 'Test', input }
    });
    expect(result).toEqual({ message: 'Solve queued for when online' });
  });

  test('_solve method throws an error if not implemented', async () => {
    const moduleInterface = new ModuleInterface('Test', 'Test Description');
    await expect(moduleInterface.solve({})).rejects.toThrow('_solve method must be implemented by subclass');
  });

  test('getInputFields method throws an error if not implemented', () => {
    const testModule = new ModuleInterface('Test', 'Test Description');
    expect(() => testModule.getInputFields()).toThrow('getInputFields method must be implemented by subclass');
  });

  test('validateInput throws error for missing field', () => {
    expect(() => moduleInterface.validateInput({})).toThrow('Missing required field: testField');
  });

  test('validateInput throws error for incorrect field type', () => {
    expect(() => moduleInterface.validateInput({ testField: 'not a number' })).toThrow('Field testField must be a number');
  });

  test('solve method handles _solve rejection', async () => {
    moduleInterface._solve.mockRejectedValue(new Error('Solve failed'));
    const input = { testField: 42, testArray: [] };

    await expect(moduleInterface.solve(input)).rejects.toThrow('Solve failed');
    expect(EventBus.emit).toHaveBeenCalledWith('moduleSolveStart', { moduleName: 'Test', input });
    expect(EventBus.emit).not.toHaveBeenCalledWith('moduleSolveEnd', expect.anything());
  });

  test('validateInput throws error for missing array field', () => {
    expect(() => moduleInterface.validateInput({ testField: 42 })).toThrow('Missing required field: testArray');
  });

  test('validateInput throws error for incorrect array field type', () => {
    expect(() => moduleInterface.validateInput({ testField: 42, testArray: 'not an array' })).toThrow('Field testArray must be an array');
  });

  test('validateInput passes for correct input', () => {
    expect(() => moduleInterface.validateInput({ testField: 42, testArray: [] })).not.toThrow();
  });

  test('solve method handles validation errors', async () => {
    const input = { testField: 'not a number', testArray: [] };
    await expect(moduleInterface.solve(input)).rejects.toThrow('Field testField must be a number');
    expect(moduleInterface._solve).not.toHaveBeenCalled();
  });
});
