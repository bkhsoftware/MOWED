import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
  }

  _solve(input) {
    const { 
      monthlyIncome, 
      monthlyExpenses, 
      savingsGoal, 
      investmentRate,
      debtAmount,
      debtInterestRate
    } = input;
    
    const availableSavings = monthlyIncome - monthlyExpenses;
    
    if (availableSavings <= 0) {
      throw new Error('Expenses cannot be greater than or equal to income');
    }

    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);
    const monthsToGoalWithInvestment = Math.ceil(
      Math.log(savingsGoal / availableSavings * (investmentRate / 12) + 1) / 
      Math.log(1 + investmentRate / 12) / 12
    );

    const monthsToPayDebt = debtAmount > 0 ? 
      Math.ceil(Math.log(1 - debtAmount * (debtInterestRate / 12) / availableSavings) / 
      Math.log(1 + debtInterestRate / 12)) : 0;

    const result = {
      monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
      monthlyExpenses: parseFloat(monthlyExpenses.toFixed(2)),
      availableSavings: parseFloat(availableSavings.toFixed(2)),
      monthsToGoal,
      monthsToGoalWithInvestment,
      monthsToPayDebt,
      date: new Date().toISOString().split('T')[0],
      message: `With your current income and expenses, you can save $${availableSavings.toFixed(2)} per month. It will take approximately ${monthsToGoal} months to reach your savings goal without investment, or ${monthsToGoalWithInvestment} months with investment. If you have debt, it will take about ${monthsToPayDebt} months to pay it off.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'monthlyIncome', type: 'number', label: 'Monthly Income', min: 0, step: 0.01 },
      { name: 'monthlyExpenses', type: 'number', label: 'Monthly Expenses', min: 0, step: 0.01 },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal', min: 0, step: 0.01 },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate', min: 0, max: 1, step: 0.01 },
      { name: 'debtAmount', type: 'number', label: 'Current Debt Amount', min: 0, step: 0.01 },
      { name: 'debtInterestRate', type: 'number', label: 'Annual Debt Interest Rate', min: 0, max: 1, step: 0.01 }
    ];
  }

  validateField(field, value) {
    super.validateField(field, value);
    if ((field.name === 'investmentRate' || field.name === 'debtInterestRate') && (value < 0 || value > 1)) {
      throw new Error(`${field.label} must be between 0 and 1`);
    }
  }
}
