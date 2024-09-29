import moduleStore from '@/store/moduleStore';

describe('moduleStore', () => {
  let store;

  beforeEach(() => {
    store = {
      state: moduleStore.state(),
      commit: jest.fn(),
      dispatch: jest.fn(),
    };
  });

  test('initial state', () => {
    expect(store.state.moduleStates).toEqual({});
  });

  test('setModuleState mutation', () => {
    const state = { moduleStates: {} };
    const moduleState = { data: 'test' };
    moduleStore.mutations.setModuleState(state, { moduleName: 'testModule', moduleState });
    expect(state.moduleStates.testModule).toEqual(moduleState);
  });

  test('updateModuleState action', () => {
    const moduleState = { data: 'test' };
    moduleStore.actions.updateModuleState(store, { moduleName: 'testModule', moduleState });
    expect(store.commit).toHaveBeenCalledWith('setModuleState', { moduleName: 'testModule', moduleState });
  });

  test('getModuleState getter', () => {
    const state = { moduleStates: { testModule: { data: 'test' } } };
    const result = moduleStore.getters.getModuleState(state)('testModule');
    expect(result).toEqual({ data: 'test' });
  });

  test('getModuleState getter returns empty object for non-existent module', () => {
    const state = { moduleStates: {} };
    const result = moduleStore.getters.getModuleState(state)('nonExistentModule');
    expect(result).toEqual({});
  });
});
