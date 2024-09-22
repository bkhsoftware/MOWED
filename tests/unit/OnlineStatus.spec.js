import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import OnlineStatus from '@/components/OnlineStatus.vue';

describe('OnlineStatus.vue', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      state: {
        isOnline: true
      }
    });
  });

  test('renders online status when online', () => {
    const wrapper = shallowMount(OnlineStatus, {
      global: {
        plugins: [store]
      }
    });

    expect(wrapper.text()).toContain('Online');
    expect(wrapper.classes()).not.toContain('is-offline');
  });

  test('renders offline status when offline', async () => {
    store.state.isOnline = false;

    const wrapper = shallowMount(OnlineStatus, {
      global: {
        plugins: [store]
      }
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Offline');
    expect(wrapper.classes()).toContain('is-offline');
  });
});
