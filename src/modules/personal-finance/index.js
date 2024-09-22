import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
  }

  _solve(input) {
    const { income, expenses, savingsGoal } = input;
    const availableSavings = income - expenses;
    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);

    if (availableSavings <= 0) {
      throw new Error('Expenses cannot be greater than or equal to income');
    }

    const result = {
      availableSavings,
      monthsToGoal,
      message: `With your current income and expenses, you can save ${availableSavings} per month. It will take approximately ${monthsToGoal} months to reach your savings goal.`
    };

    // Update module-specific state
    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: { availableSavings, monthsToGoal } }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'income', type: 'number', label: 'Monthly Income' },
      { name: 'expenses', type: 'number', label: 'Monthly Expenses' },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal' }
    ];
  }

  getLastCalculation() {
    // This method now needs to be implemented differently, possibly using the store or EventBus
    // For now, we'll leave it as a placeholder
    console.warn('getLastCalculation needs to be implemented');
    return null;
  }
}
