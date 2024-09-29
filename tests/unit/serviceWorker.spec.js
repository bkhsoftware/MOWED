import { register } from '@/registerServiceWorker';

describe('Service Worker', () => {
  let originalNavigator;
  let mockRegistration;

  beforeEach(() => {
    originalNavigator = global.navigator;
    mockRegistration = {
      scope: '/app/',
      update: jest.fn().mockResolvedValue(undefined)
    };
    global.navigator = {
      serviceWorker: {
        register: jest.fn().mockResolvedValue(mockRegistration),
      },
    };
    global.window = {
      addEventListener: jest.fn(),
    };
    console.log = jest.fn();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    jest.clearAllMocks();
  });

  test('registers service worker successfully', async () => {
    await register();
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
    expect(console.log).toHaveBeenCalledWith('Service worker registered successfully');
  });

  test('handles registration error', async () => {
    const error = new Error('Registration failed');
    navigator.serviceWorker.register.mockRejectedValue(error);
    
    await register();
    expect(console.log).toHaveBeenCalledWith('Service worker registration failed:', error);
  });

  test('does not register when service workers are not supported', async () => {
    delete global.navigator.serviceWorker;
    
    await register();
    expect(console.log).toHaveBeenCalledWith('Service workers are not supported.');
  });

  test('adds load event listener', async () => {
    await register();
    expect(window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  test('updates service worker on controllerchange', async () => {
    await register();
    const controllerchangeHandler = navigator.serviceWorker.oncontrollerchange;
    
    await controllerchangeHandler();
    expect(mockRegistration.update).toHaveBeenCalled();
  });
});
