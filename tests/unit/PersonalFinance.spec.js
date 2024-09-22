import PersonalFinance from '@/modules/personal-finance';
import EventBus from '@/core/EventBus';

jest.mock('@/core/EventBus');

describe('PersonalFinance Module', () => {
  let personalFinance;

  beforeEach(() => {
    personalFinance = new PersonalFinance();
    EventBus.emit.mockClear();
  });

  test('solve method calculates correct results', () => {
    const input = {
      income: 5000,
      expenses: 3000,
      savingsGoal: 10000
    };

    const result = personalFinance._solve(input);

    expect(result.availableSavings).toBe(2000);
    expect(result.monthsToGoal).toBe(5);
    expect(result.message).toContain('save 2000 per month');
    expect(result.message).toContain('5 months to reach your savings goal');
  });

  test('solve method throws error when expenses exceed income', () => {
    const input = {
      income: 3000,
      expenses: 5000,
      savingsGoal: 10000
    };

    expect(() => personalFinance._solve(input)).toThrow('Expenses cannot be greater than or equal to income');
  });

  test('getInputFields returns correct fields', () => {
    const fields = personalFinance.getInputFields();

    expect(fields).toHaveLength(3);
    expect(fields).toContainEqual({ name: 'income', type: 'number', label: 'Monthly Income' });
    expect(fields).toContainEqual({ name: 'expenses', type: 'number', label: 'Monthly Expenses' });
    expect(fields).toContainEqual({ name: 'savingsGoal', type: 'number', label: 'Savings Goal' });
  });

  test('solve method emits event with result', () => {
    const input = {
      income: 5000,
      expenses: 3000,
      savingsGoal: 10000
    };

    personalFinance._solve(input);

    expect(EventBus.emit).toHaveBeenCalledWith('updateModuleState', expect.any(Object));
  });
});
