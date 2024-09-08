import { createStore } from 'vuex';
import ModuleRegistry from '../core/ModuleRegistry';

export default createStore({
  state: {
    currentModule: null,
  },
  mutations: {
    setCurrentModule(state, moduleName) {
      state.currentModule = ModuleRegistry.getModule(moduleName);
    },
  },
  actions: {
    selectModule({ commit }, moduleName) {
      commit('setCurrentModule', moduleName);
    },
  },
  getters: {
    availableModules: () => ModuleRegistry.getAllModules(),
  },
});
