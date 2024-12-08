export default {
  namespaced: true,
  state: () => ({
    moduleStates: {}
  }),
  mutations: {
    setModuleState(state, { moduleName, moduleState }) {
      state.moduleStates[moduleName] = {
        ...state.moduleStates[moduleName],
        ...moduleState
      };
    }
  },
  actions: {
    updateModuleState({ commit }, { moduleName, moduleState }) {
      commit('setModuleState', { moduleName, moduleState });
    }
  },
  getters: {
    getModuleState: (state) => (moduleName) => state.moduleStates[moduleName] || {}
  }
};
