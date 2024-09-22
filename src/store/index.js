import { createStore } from 'vuex';
import ModuleRegistry from '../core/ModuleRegistry';
import IndexedDBAdapter from '../utils/indexedDBAdapter';
import EventBus from '../core/EventBus';

const dbAdapter = new IndexedDBAdapter();

const store = createStore({
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
      await dbAdapter.init();
      await dispatch('loadAllModuleData');
    },
    async selectModule({ commit }, moduleName) {
      commit('setCurrentModule', moduleName);
    },
    async saveModuleData({ commit }, { moduleName, data }) {
      await dbAdapter.saveData(moduleName, data);
      commit('setModuleData', { moduleName, data });
    },
    async loadModuleData({ commit }, moduleName) {
      const data = await dbAdapter.getData(moduleName);
      if (data) {
        commit('setModuleData', { moduleName, data });
      }
    },
    async loadAllModuleData({ dispatch }) {
      const modules = ModuleRegistry.getAllModules();
      for (const module of modules) {
        await dispatch('loadModuleData', module.getName());
      }
    },
    async performAction({ state, dispatch }, action) {
      if (state.isOnline) {
        await dispatch(action.type, action.payload);
      } else {
        await dbAdapter.addToOfflineQueue(action);
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const sw = await navigator.serviceWorker.ready;
          await sw.sync.register('sync-solve-queue');
        }
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
