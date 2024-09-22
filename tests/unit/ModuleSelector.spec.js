import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ModuleSelector from '@/components/ModuleSelector.vue';

describe('ModuleSelector.vue', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      state: {
        currentModuleName: null,
      },
      getters: {
        availableModules: () => [
          { getName: () => 'Module1' },
          { getName: () => 'Module2' },
        ],
        currentModule: (state) => state.currentModuleName ? { getName: () => state.currentModuleName } : null,
      },
      actions: {
        selectModule: jest.fn(),
      },
    });
  });

  test('renders module selector component', () => {
    const wrapper = shallowMount(ModuleSelector, {
      global: {
        plugins: [store],
        mocks: {
          $store: store
        }
      },
    });

    expect(wrapper.find('h2').text()).toBe('Select a Module');
    expect(wrapper.find('select').exists()).toBe(true);
  });

  test('renders options for available modules', async () => {
    const wrapper = shallowMount(ModuleSelector, {
      global: {
        plugins: [store],
        mocks: {
          $store: store
        }
      },
    });

    await wrapper.vm.$nextTick();
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3); // Including the default "-- Select --" option
    expect(options[1].text()).toBe('Module1');
    expect(options[2].text()).toBe('Module2');
  });

  test('calls selectModule action when a module is selected', async () => {
    const wrapper = shallowMount(ModuleSelector, {
      global: {
        plugins: [store],
        mocks: {
          $store: {
            ...store,
            dispatch: jest.fn()
          }
        }
      },
    });

    await wrapper.find('select').setValue('Module1');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('selectModule', 'Module1');
  });

  test('sets selected module to current module on mount', async () => {
    store.state.currentModuleName = 'Module2';
    
    const wrapper = shallowMount(ModuleSelector, {
      global: {
        plugins: [store],
        mocks: {
          $store: store
        }
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedModule).toBe('Module2');
  });
});
