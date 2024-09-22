import { register } from '@/registerServiceWorker';

describe('Service Worker', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: jest.fn().mockResolvedValue({ scope: '/app/' }),
      },
      configurable: true,
    });
  });

  test('registers service worker', async () => {
    await register();
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
  });
});
