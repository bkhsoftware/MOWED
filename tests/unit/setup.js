import { config } from '@vue/test-utils';
import { createStore } from 'vuex';

const store = createStore({
  state: {},
  mutations: {},
  actions: {},
  getters: {}
});

config.global.plugins = [store];

// Global mocks
config.global.mocks = {
  $store: store
};

// Suppress console warnings
console.warn = jest.fn();


