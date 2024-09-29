import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import OnlineStatus from '@/components/OnlineStatus.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('OnlineStatus.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        isOnline: true
      },
      mutations: {
        setOnlineStatus(state, status) {
          state.isOnline = status;
        }
      }
    });
  });

  test('renders online status when online', () => {
    const wrapper = shallowMount(OnlineStatus, { store, localVue });
    expect(wrapper.text()).toContain('Online');
    expect(wrapper.classes()).not.toContain('is-offline');
  });

  test('renders offline status when offline', async () => {
    store.commit('setOnlineStatus', false);
    const wrapper = shallowMount(OnlineStatus, { store, localVue });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Offline');
    expect(wrapper.classes()).toContain('is-offline');
  });

  test('updates status when online status changes', async () => {
    const wrapper = shallowMount(OnlineStatus, { store, localVue });
    expect(wrapper.text()).toContain('Online');
    
    store.commit('setOnlineStatus', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Offline');
    
    store.commit('setOnlineStatus', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Online');
  });

  test('applies correct CSS class based on online status', async () => {
    const wrapper = shallowMount(OnlineStatus, { store, localVue });
    expect(wrapper.classes()).not.toContain('is-offline');
    
    store.commit('setOnlineStatus', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).toContain('is-offline');
    
    store.commit('setOnlineStatus', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).not.toContain('is-offline');
  });
});
