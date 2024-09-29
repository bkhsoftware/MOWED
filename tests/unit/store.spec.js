import { createStore } from 'vuex';
import ModuleRegistry from '@/core/ModuleRegistry';
import IndexedDBAdapter from '@/utils/indexedDBAdapter';

jest.mock('@/core/ModuleRegistry');
jest.mock('@/utils/indexedDBAdapter');

describe('Vuex Store', () => {
  let store;

  beforeEach(() => {
    ModuleRegistry.getAllModules.mockReturnValue([]);
    IndexedDBAdapter.mockImplementation(() => ({
      init: jest.fn(),
      getData: jest.fn(),
      saveData: jest.fn(),
      addToOfflineQueue: jest.fn(),
      getOfflineQueue: jest.fn(),
      clearOfflineQueue: jest.fn(),
    }));

    store = createStore({
      state: {
        currentModuleName: null,
        moduleData: {},
        isOnline: navigator.onLine
      },
      mutations: {
        setCurrentModule(state, moduleName) {
          state.currentModuleName = moduleName;
        },
        setModuleData(state, { moduleName, data }) {
          state.moduleData[moduleName] = data;
        },
        setOnlineStatus(state, status) {
          state.isOnline = status;
        }
      },
      actions: {
        initStore: jest.fn(),
        selectModule: jest.fn(),
        saveModuleData: jest.fn(),
        loadModuleData: jest.fn(),
        loadAllModuleData: jest.fn(),
        performAction: jest.fn(),
        syncOfflineActions: jest.fn(),
      },
      getters: {
        availableModules: () => ModuleRegistry.getAllModules(),
        currentModule: (state) => state.currentModuleName ? ModuleRegistry.getModule(state.currentModuleName) : null,
        getModuleData: (state) => (moduleName) => state.moduleData[moduleName] || {}
      }
    });
  });

  test('initializes with correct state', () => {
    expect(store.state.currentModuleName).toBeNull();
    expect(store.state.moduleData).toEqual({});
    expect(store.state.isOnline).toBe(navigator.onLine);
  });

  test('setCurrentModule mutation', () => {
    store.commit('setCurrentModule', 'TestModule');
    expect(store.state.currentModuleName).toBe('TestModule');
  });

  test('setModuleData mutation', () => {
    const testData = { test: 'data' };
    store.commit('setModuleData', { moduleName: 'TestModule', data: testData });
    expect(store.state.moduleData['TestModule']).toEqual(testData);
  });

  test('setOnlineStatus mutation', () => {
    store.commit('setOnlineStatus', false);
    expect(store.state.isOnline).toBe(false);
  });

  test('initStore action initializes IndexedDBAdapter and loads all module data', async () => {
    const initMock = IndexedDBAdapter.mock.instances[0].init;
    await store.dispatch('initStore');
    expect(initMock).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith('loadAllModuleData');
  });

  test('selectModule action commits the selected module', async () => {
    await store.dispatch('selectModule', 'TestModule');
    expect(store.state.currentModuleName).toBe('TestModule');
  });

  test('saveModuleData action saves data to IndexedDBAdapter and commits to state', async () => {
    const saveDataMock = IndexedDBAdapter.mock.instances[0].saveData;
    const testData = { test: 'data' };
    await store.dispatch('saveModuleData', { moduleName: 'TestModule', data: testData });
    expect(saveDataMock).toHaveBeenCalledWith('TestModule', testData);
    expect(store.state.moduleData['TestModule']).toEqual(testData);
  });

  test('loadModuleData action loads data from IndexedDBAdapter and commits to state', async () => {
    const getDataMock = IndexedDBAdapter.mock.instances[0].getData;
    const testData = { test: 'data' };
    getDataMock.mockResolvedValue(testData);
    await store.dispatch('loadModuleData', 'TestModule');
    expect(getDataMock).toHaveBeenCalledWith('TestModule');
    expect(store.state.moduleData['TestModule']).toEqual(testData);
  });

  test('performAction action handles online and offline scenarios', async () => {
    const onlineAction = { type: 'testAction', payload: {} };
    store.state.isOnline = true;
    await store.dispatch('performAction', onlineAction);
    expect(store.dispatch).toHaveBeenCalledWith(onlineAction.type, onlineAction.payload);

    const offlineAction = { type: 'offlineAction', payload: {} };
    store.state.isOnline = false;
    const addToOfflineQueueMock = IndexedDBAdapter.mock.instances[0].addToOfflineQueue;
    await store.dispatch('performAction', offlineAction);
    expect(addToOfflineQueueMock).toHaveBeenCalledWith(offlineAction);
  });

  test('syncOfflineActions action processes queued actions when online', async () => {
    const getOfflineQueueMock = IndexedDBAdapter.mock.instances[0].getOfflineQueue;
    const clearOfflineQueueMock = IndexedDBAdapter.mock.instances[0].clearOfflineQueue;
    const queuedActions = [
      { type: 'action1', payload: {} },
      { type: 'action2', payload: {} }
    ];
    getOfflineQueueMock.mockResolvedValue(queuedActions);
    
    await store.dispatch('syncOfflineActions');
    
    expect(getOfflineQueueMock).toHaveBeenCalled();
    queuedActions.forEach(action => {
      expect(store.dispatch).toHaveBeenCalledWith(action.type, action.payload);
    });
    expect(clearOfflineQueueMock).toHaveBeenCalled();
  });

  // Add tests for getters
  test('availableModules getter returns all modules from ModuleRegistry', () => {
    const mockModules = [{ name: 'Module1' }, { name: 'Module2' }];
    ModuleRegistry.getAllModules.mockReturnValue(mockModules);
    expect(store.getters.availableModules).toEqual(mockModules);
  });

  test('currentModule getter returns the current module from ModuleRegistry', () => {
    const mockModule = { name: 'CurrentModule' };
    store.state.currentModuleName = 'CurrentModule';
    ModuleRegistry.getModule.mockReturnValue(mockModule);
    expect(store.getters.currentModule).toEqual(mockModule);
  });

  test('getModuleData getter returns module data for a given module name', () => {
    store.state.moduleData = {
      TestModule: { data: 'test' }
    };
    expect(store.getters.getModuleData('TestModule')).toEqual({ data: 'test' });
    expect(store.getters.getModuleData('NonExistentModule')).toEqual({});
  });
});
