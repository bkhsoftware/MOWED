import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
  }

  _solve(input) {
    const { income, expenses, savingsGoal, investmentRate } = input;
    const availableSavings = income - expenses;
    
    if (availableSavings <= 0) {
      throw new Error('Expenses cannot be greater than or equal to income');
    }

    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);
    const monthsToGoalWithInvestment = Math.ceil(
      Math.log(savingsGoal / availableSavings * (investmentRate / 12) + 1) / 
      Math.log(1 + investmentRate / 12) / 12
    );

    const result = {
      income: parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      availableSavings: parseFloat(availableSavings.toFixed(2)),
      monthsToGoal,
      monthsToGoalWithInvestment,
      date: new Date().toISOString().split('T')[0],
      message: `With your current income and expenses, you can save $${availableSavings.toFixed(2)} per month. It will take approximately ${monthsToGoal} months to reach your savings goal without investment, or ${monthsToGoalWithInvestment} months with investment.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'income', type: 'number', label: 'Monthly Income', min: 0 },
      { name: 'expenses', type: 'number', label: 'Monthly Expenses', min: 0 },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal', min: 0 },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate', min: 0, max: 1, step: 0.01 }
    ];
  }

  validateField(field, value) {
    super.validateField(field, value);
    if (field.name === 'investmentRate' && (value < 0 || value > 1)) {
      throw new Error('Investment rate must be between 0 and 1');
    }
  }
}
