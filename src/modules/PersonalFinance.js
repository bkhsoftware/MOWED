import ModuleInterface from '../core/ModuleInterface';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
  }

  solve(input) {
    // This is a very simplistic implementation for demonstration
    const { income, expenses, savingsGoal } = input;
    const availableSavings = income - expenses;
    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);

    return {
      availableSavings,
      monthsToGoal,
      message: `With your current income and expenses, you can save ${availableSavings} per month. It will take approximately ${monthsToGoal} months to reach your savings goal.`
    };
  }

  getInputFields() {
    return [
      { name: 'income', type: 'number', label: 'Monthly Income' },
      { name: 'expenses', type: 'number', label: 'Monthly Expenses' },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal' }
    ];
  }
}
