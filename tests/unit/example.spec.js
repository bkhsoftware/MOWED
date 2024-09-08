import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import App from '@/App.vue';

const createVuexStore = () => {
  return createStore({
    state: {
      currentModule: null,
    },
    getters: {
      availableModules: () => [],
    },
  });
};

test('App renders a message', () => {
  const store = createVuexStore();
  const wrapper = mount(App, {
    global: {
      plugins: [store],
    },
  });
  expect(wrapper.text()).toContain('MOWED');
  expect(wrapper.text()).toContain('Mathematical Optimization With End-user Devices');
});
