import PersonalFinance from '@/modules/PersonalFinance';

describe('PersonalFinance', () => {
  let module;

  beforeEach(() => {
    module = new PersonalFinance();
  });

  it('should have the correct name and description', () => {
    expect(module.getName()).toBe('Personal Finance');
    expect(module.getDescription()).toBe('Optimize your personal financial decisions');
  });

  it('should return correct input fields', () => {
    const fields = module.getInputFields();
    expect(fields).toHaveLength(3);
    expect(fields[0].name).toBe('income');
    expect(fields[1].name).toBe('expenses');
    expect(fields[2].name).toBe('savingsGoal');
  });

  it('should solve the optimization problem correctly', () => {
    const input = { income: 5000, expenses: 3000, savingsGoal: 10000 };
    const result = module.solve(input);
    expect(result.availableSavings).toBe(2000);
    expect(result.monthsToGoal).toBe(5);
  });
});
