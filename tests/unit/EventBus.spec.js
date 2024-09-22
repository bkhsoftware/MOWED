import EventBus from '@/core/EventBus';

describe('EventBus', () => {
  afterEach(() => {
    // Clear all event listeners after each test
    EventBus.events = {};
  });

  test('can subscribe to and emit events', () => {
    const callback = jest.fn();
    EventBus.on('testEvent', callback);

    EventBus.emit('testEvent', 'testData');

    expect(callback).toHaveBeenCalledWith('testData');
  });

  test('can unsubscribe from events', () => {
    const callback = jest.fn();
    EventBus.on('testEvent', callback);
    EventBus.off('testEvent', callback);

    EventBus.emit('testEvent', 'testData');

    expect(callback).not.toHaveBeenCalled();
  });

  test('can handle multiple subscribers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    EventBus.on('testEvent', callback1);
    EventBus.on('testEvent', callback2);

    EventBus.emit('testEvent', 'testData');

    expect(callback1).toHaveBeenCalledWith('testData');
    expect(callback2).toHaveBeenCalledWith('testData');
  });
});
