import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import App from '@/App.vue';

describe('App.vue', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      getters: {
        currentModule: () => null,
      },
    });
  });

  test('renders MOWED header', () => {
    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector']
      },
    });

    expect(wrapper.find('h1').text()).toBe('MOWED');
    expect(wrapper.find('p').text()).toBe('Mathematical Optimization With End-user Devices');
  });

  test('renders ModuleSelector component', () => {
    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector']
      },
    });

    expect(wrapper.findComponent({ name: 'ModuleSelector' }).exists()).toBe(true);
  });

  test('renders correct module component when currentModule is set', async () => {
    store.getters.currentModule = { getName: () => 'Personal Finance' };

    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector', 'PersonalFinanceComponent']
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'PersonalFinanceComponent' }).exists()).toBe(true);
  });
});
