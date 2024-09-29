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

  test.each([
    ['Personal Finance', 'PersonalFinanceComponent'],
    ['Education', 'EducationComponent'],
    ['Reforestation', 'ReforestationComponent'],
    ['Small Business', 'SmallBusinessComponent']
  ])('renders correct module component when currentModule is %s', async (moduleName, componentName) => {
    store.getters.currentModule = { getName: () => moduleName };

    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector', componentName]
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: componentName }).exists()).toBe(true);
  });

  test('currentModuleComponent returns null when no module is selected', () => {
    store.getters.currentModule = null;

    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector']
      },
    });

    expect(wrapper.vm.currentModuleComponent).toBeNull();
  });

  test('currentModuleComponent returns null for unknown module', () => {
    store.getters.currentModule = { getName: () => 'Unknown Module' };

    const wrapper = shallowMount(App, {
      global: {
        plugins: [store],
        stubs: ['ModuleSelector']
      },
    });

    expect(wrapper.vm.currentModuleComponent).toBeNull();
  });
});
