mport { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import ModuleSelector from '@/components/ModuleSelector.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ModuleSelector.vue', () => {
  let store;
  let actions;
  let getters;

  beforeEach(() => {
    actions = {
      selectModule: jest.fn()
    };
    getters = {
      availableModules: () => [
        { getName: () => 'Module1' },
        { getName: () => 'Module2' },
      ],
      currentModule: () => null
    };
    store = new Vuex.Store({
      actions,
      getters
    });
  });

  test('renders module selector component', () => {
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    expect(wrapper.find('h2').text()).toBe('Select a Module');
    expect(wrapper.find('select').exists()).toBe(true);
  });

  test('renders options for available modules', () => {
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3); // Including the default "-- Select --" option
    expect(options.at(1).text()).toBe('Module1');
    expect(options.at(2).text()).toBe('Module2');
  });

  test('calls selectModule action when a module is selected', async () => {
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    await wrapper.find('select').setValue('Module1');
    expect(actions.selectModule).toHaveBeenCalledWith(expect.anything(), 'Module1');
  });

  test('sets selected module to current module on mount', async () => {
    getters.currentModule = () => ({ getName: () => 'Module2' });
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedModule).toBe('Module2');
  });

  test('does not call selectModule when no module is selected', async () => {
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    await wrapper.find('select').setValue('');
    expect(actions.selectModule).not.toHaveBeenCalled();
  });

  test('updates selectedModule when currentModule changes', async () => {
    const wrapper = shallowMount(ModuleSelector, { store, localVue });
    await wrapper.vm.$nextTick();
    getters.currentModule = () => ({ getName: () => 'Module1' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedModule).toBe('Module1');
  });
});
