import { createStore } from 'vuex';
import ModuleRegistry from '../core/ModuleRegistry';
import { saveState, loadState } from '../utils/storage';

const savedState = loadState();

export default createStore({
  state: savedState || {
    currentModuleName: null,
    moduleData: {}
  },
  mutations: {
    setCurrentModule(state, moduleName) {
      state.currentModuleName = moduleName;
    },
    setModuleData(state, { moduleName, data }) {
      state.moduleData[moduleName] = data;
    }
  },
  actions: {
    selectModule({ commit }, moduleName) {
      commit('setCurrentModule', moduleName);
    },
    saveModuleData({ commit, state }, { moduleName, data }) {
      commit('setModuleData', { moduleName, data });
      saveState(state);
    }
  },
  getters: {
    availableModules: () => ModuleRegistry.getAllModules(),
    getModuleData: (state) => (moduleName) => state.moduleData[moduleName] || {},
    currentModule: (state) => state.currentModuleName ? ModuleRegistry.getModule(state.currentModuleName) : null
  }
});
