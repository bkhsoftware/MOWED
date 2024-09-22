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
      { name: 'testField', type: 'number' }
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
});
