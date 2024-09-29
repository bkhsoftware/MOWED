import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import ModuleForm from '@/components/ModuleForm.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ModuleForm.vue', () => {
  let store;
  let actions;
  let mockModule;

  beforeEach(() => {
    actions = {
      saveModuleData: jest.fn()
    };
    store = new Vuex.Store({
      actions
    });
    mockModule = {
      getName: jest.fn().mockReturnValue('Test Module'),
      getDescription: jest.fn().mockReturnValue('Test Description'),
      getInputFields: jest.fn().mockReturnValue([
        { name: 'field1', type: 'number', label: 'Field 1' },
        { name: 'field2', type: 'array', label: 'Field 2' }
      ]),
      solve: jest.fn().mockReturnValue({ message: 'Solved', result: 42 })
    };
  });

  test('renders module name and description', () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    expect(wrapper.find('h2').text()).toBe('Test Module');
    expect(wrapper.find('p').text()).toBe('Test Description');
  });

  test('renders input fields based on module definition', () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    expect(wrapper.find('input[type="number"]').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('Add Field 2');
  });

  test('calls solve method and saves result when form is submitted', async () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    await wrapper.find('form').trigger('submit.prevent');
    expect(mockModule.solve).toHaveBeenCalled();
    expect(actions.saveModuleData).toHaveBeenCalled();
    expect(wrapper.vm.result).toEqual({ message: 'Solved', result: 42 });
  });

  test('adds array item when button is clicked', async () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.vm.formData.field2).toEqual(['']);
  });

  test('initializes formData correctly', () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    expect(wrapper.vm.formData).toEqual({
      field1: '',
      field2: []
    });
  });

  test('displays result when available', async () => {
    const wrapper = shallowMount(ModuleForm, {
      propsData: { module: mockModule },
      store,
      localVue
    });
    await wrapper.setData({ result: { message: 'Test Result', value: 10 } });
    expect(wrapper.find('.result').exists()).toBe(true);
    expect(wrapper.find('.result p').text()).toBe('Test Result');
    expect(wrapper.find('.result li').text()).toBe('value: 10');
  });
});
