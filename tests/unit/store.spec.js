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

  // Add more tests for actions and getters as needed
});
