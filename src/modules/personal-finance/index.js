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
      { name: 'income', type: 'number', label: 'Monthly Income' },
      { name: 'expenses', type: 'number', label: 'Monthly Expenses' },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal' },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate (as decimal)' }
    ];
  }
}
