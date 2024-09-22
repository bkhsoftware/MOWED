import SmallBusiness from '@/modules/small-business';
import EventBus from '@/core/EventBus';

jest.mock('@/core/EventBus');

describe('SmallBusiness Module', () => {
  let smallBusiness;

  beforeEach(() => {
    smallBusiness = new SmallBusiness();
    EventBus.emit.mockClear();
  });

  test('solve method calculates correct results', () => {
    const input = {
      revenue: 100000,
      costs: 80000,
      employees: 10
    };

    const result = smallBusiness._solve(input);

    expect(result.profit).toBe(20000);
    expect(result.revenuePerEmployee).toBe(10000);
    expect(result.profitPerEmployee).toBe(2000);
    expect(result.message).toContain('Profit: $20000');
    expect(result.message).toContain('Revenue per employee: $10000.00');
    expect(result.message).toContain('Profit per employee: $2000.00');
  });

  test('solve method throws error when inputs are invalid', () => {
    const input = {
      revenue: -1000,
      costs: 80000,
      employees: 10
    };

    expect(() => smallBusiness._solve(input)).toThrow('Revenue and costs must be non-negative, and number of employees must be positive');
  });

  test('getInputFields returns correct fields', () => {
    const fields = smallBusiness.getInputFields();

    expect(fields).toHaveLength(3);
    expect(fields).toContainEqual({ name: 'revenue', type: 'number', label: 'Monthly Revenue' });
    expect(fields).toContainEqual({ name: 'costs', type: 'number', label: 'Monthly Costs' });
    expect(fields).toContainEqual({ name: 'employees', type: 'number', label: 'Number of Employees' });
  });

  test('solve method emits event with result', () => {
    const input = {
      revenue: 100000,
      costs: 80000,
      employees: 10
    };

    smallBusiness._solve(input);

    expect(EventBus.emit).toHaveBeenCalledWith('updateModuleState', expect.any(Object));
  });
});
