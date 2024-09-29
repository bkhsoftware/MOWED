import { createStore } from 'vuex';
import ModuleRegistry from '../core/ModuleRegistry';
import IndexedDBAdapter from '../utils/indexedDBAdapter';
import EventBus from '../core/EventBus';
import moduleStore from './moduleStore';
import { serialize, deserialize } from '../utils/serializationUtil';


const dbAdapter = new IndexedDBAdapter();

const store = createStore({
  modules: {
    moduleStore
  },
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
    async initStore({ dispatch }) {
      try {
        await dbAdapter.init();
        await dispatch('loadAllModuleData');
      } catch (error) {
        console.error('Error initializing store:', error);
        EventBus.emit('storeInitError', error);
      }
    },
    async selectModule({ commit }, moduleName) {
      commit('setCurrentModule', moduleName);
    },
    async saveModuleData({ commit }, { moduleName, data }) {
      try {
        await dbAdapter.saveData(moduleName, data);
        commit('setModuleData', { moduleName, data });
      } catch (error) {
        console.error('Error saving module data:', error);
        EventBus.emit('saveModuleDataError', { moduleName, error });
      }
    },
    async loadModuleData({ commit }, moduleName) {
      try {
        const data = await dbAdapter.getData(moduleName);
        if (data) {
          commit('setModuleData', { moduleName, data });
        }
      } catch (error) {
        console.error('Error loading module data:', error);
        EventBus.emit('loadModuleDataError', { moduleName, error });
      }
    },
    async loadAllModuleData({ dispatch }) {
      const modules = ModuleRegistry.getAllModules();
      for (const module of modules) {
        await dispatch('loadModuleData', module.getName());
      }
    },
    async solve({ dispatch, state }, { moduleName, input }) {
      try {
        const module = ModuleRegistry.getModule(moduleName);
        const result = await module.solve(input);
        const serializableResult = JSON.parse(JSON.stringify(result));
        await dispatch('saveModuleData', { moduleName, data: { formData: input, result: serializableResult } });
        return serializableResult;
      } catch (error) {
        console.error('Error solving module:', error);
        EventBus.emit('solveError', { moduleName, error });
        throw error;
      }
    },
    async performAction({ dispatch, state }, action) {
      if (state.isOnline) {
        return dispatch(action.type, action.payload);
      } else {
        await dbAdapter.addToOfflineQueue(action);
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const sw = await navigator.serviceWorker.ready;
          await sw.sync.register('sync-solve-queue');
        }
        return { message: 'Action queued for offline processing' };
      }
    },
    async syncOfflineActions({ dispatch }) {
      const offlineQueue = await dbAdapter.getOfflineQueue();
      for (const action of offlineQueue) {
        await dispatch(action.type, action.payload);
      }
      await dbAdapter.clearOfflineQueue();
    }
  },
  getters: {
    availableModules: () => ModuleRegistry.getAllModules(),
    currentModule: (state) => state.currentModuleName ? ModuleRegistry.getModule(state.currentModuleName) : null,
    getModuleData: (state) => (moduleName) => state.moduleData[moduleName] || {}
  }
});

window.addEventListener('online', () => {
  store.commit('setOnlineStatus', true);
  store.dispatch('syncOfflineActions');
});

window.addEventListener('offline', () => {
  store.commit('setOnlineStatus', false);
});

export default store;
