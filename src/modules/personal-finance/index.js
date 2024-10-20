import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
    this.budgetCategories = [
      'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 
      'Healthcare', 'Debt Payments', 'Personal', 'Entertainment', 'Savings'
    ];
    this.assetCategories = {
      'Liquid Assets': ['Cash', 'Checking Accounts', 'Savings Accounts'],
      'Investments': ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Retirement Accounts'],
      'Real Estate': ['Primary Residence', 'Investment Properties'],
      'Personal Property': ['Vehicles', 'Jewelry', 'Collectibles'],
      'Other Assets': ['Business Ownership', 'Intellectual Property']
    };
    this.liabilityCategories = {
      'Secured Debts': ['Mortgage', 'Auto Loans', 'Home Equity Loans'],
      'Unsecured Debts': ['Credit Card Debt', 'Personal Loans'],
      'Student Loans': ['Federal Student Loans', 'Private Student Loans'],
      'Other Debts': ['Medical Debt', 'Tax Debt']
    };
    this.goals = [];
  }

  _solve(input) {
    const { 
      monthlyIncome, 
      budgetAllocation,
      savingsGoal, 
      investmentRate,
      assets,
      liabilities
    } = input;
    
    const totalAllocated = Object.values(budgetAllocation).reduce((sum, value) => sum + value, 0);
    if (Math.abs(totalAllocated - 100) > 0.01) {
      throw new Error('Budget allocation must sum to 100%');
    }

    const expenses = this.budgetCategories.reduce((sum, category) => {
      if (category !== 'Savings') {
        return sum + (monthlyIncome * budgetAllocation[category] / 100);
      }
      return sum;
    }, 0);

    const availableSavings = monthlyIncome * budgetAllocation['Savings'] / 100;
    
    if (availableSavings <= 0) {
      throw new Error('Savings allocation must be greater than 0');
    }

    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);
    const monthsToGoalWithInvestment = Math.ceil(
      Math.log(savingsGoal / availableSavings * (investmentRate / 12) + 1) / 
      Math.log(1 + investmentRate / 12) / 12
    );

    // Calculate net worth
    const totalAssets = Object.values(assets).reduce((sum, value) => sum + value, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, value) => sum + value, 0);
    const netWorth = totalAssets - totalLiabilities;

    const debtAmount = totalLiabilities;
    const monthsToPayDebt = debtAmount > 0 ? 
      Math.ceil(Math.log(1 - debtAmount * (investmentRate / 12) / availableSavings) / 
      Math.log(1 + investmentRate / 12)) : 0;

    const result = {
      monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      availableSavings: parseFloat(availableSavings.toFixed(2)),
      budgetAllocation,
      monthsToGoal,
      monthsToGoalWithInvestment,
      monthsToPayDebt,
      totalAssets: parseFloat(totalAssets.toFixed(2)),
      totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
      netWorth: parseFloat(netWorth.toFixed(2)),
      assets,
      liabilities,
      date: new Date().toISOString().split('T')[0],
      message: `Your current net worth is $${netWorth.toFixed(2)}. With your current budget allocation, you can save $${availableSavings.toFixed(2)} per month. It will take approximately ${monthsToGoal} months to reach your savings goal without investment, or ${monthsToGoalWithInvestment} months with investment. If you have debt, it will take about ${monthsToPayDebt} months to pay it off.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result }
    });

    const goalProgress = this.trackGoals(input, result);

    // Retirement calculations
    const yearsUntilRetirement = input.retirementAge - input.age;
    const monthsUntilRetirement = yearsUntilRetirement * 12;
    const retirementSavingsAtRetirement = this.calculateRetirementSavings(
      input.retirementSavings,
      input.monthlyRetirementContribution,
      monthsUntilRetirement,
      input.investmentRate / 12
    );
    const monthlyRetirementIncome = this.calculateRetirementIncome(
      retirementSavingsAtRetirement,
      input.investmentRate / 12,
      input.yearsInRetirement * 12 // Use user-provided years in retirement
    );

    return {
      ...result,
      goalProgress,
      retirementProjection: {
        yearsUntilRetirement,
        yearsInRetirement: input.yearsInRetirement,
        retirementSavingsAtRetirement,
        monthlyRetirementIncome,
        desiredMonthlyRetirementIncome: input.desiredRetirementIncome / 12,
        retirementIncomeGap: (input.desiredRetirementIncome / 12) - monthlyRetirementIncome
      }
    };
  }

  calculateRetirementSavings(currentSavings, monthlyContribution, months, monthlyRate) {
    return currentSavings * Math.pow(1 + monthlyRate, months) + 
           monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  calculateRetirementIncome(savingsAtRetirement, monthlyRate, monthsInRetirement) {
    return savingsAtRetirement * (monthlyRate * Math.pow(1 + monthlyRate, monthsInRetirement)) / 
           (Math.pow(1 + monthlyRate, monthsInRetirement) - 1);
  }

  getInputFields() {
    return [
      { name: 'monthlyIncome', type: 'number', label: 'Monthly Income', min: 0, step: 0.01 },
      { 
        name: 'budgetAllocation', 
        type: 'budgetAllocation', 
        label: 'Budget Allocation', 
        categories: this.budgetCategories 
      },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal', min: 0, step: 0.01 },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate', min: 0, max: 1, step: 0.01 },
      { 
        name: 'assets', 
        type: 'nestedCategoryValues', 
        label: 'Assets', 
        categories: this.assetCategories 
      },
      { 
        name: 'liabilities', 
        type: 'nestedCategoryValues', 
        label: 'Liabilities', 
        categories: this.liabilityCategories 
      },
      {
        name: 'incomeGrowthRate',
        type: 'number',
        label: 'Monthly Income Growth Rate (%)',
        min: 0,
        max: 100,
        step: 0.1
      },
      {
        name: 'goals',
        type: 'goals',
        label: 'Financial Goals'
      },
      { name: 'age', type: 'number', label: 'Current Age', min: 18, max: 100, step: 1 },
      { name: 'retirementAge', type: 'number', label: 'Desired Retirement Age', min: 18, max: 100, step: 1 },
      { name: 'yearsInRetirement', type: 'number', label: 'Expected Years in Retirement', min: 1, max: 50, step: 1 },
      { name: 'retirementSavings', type: 'number', label: 'Current Retirement Savings', min: 0, step: 100 },
      { name: 'monthlyRetirementContribution', type: 'number', label: 'Monthly Retirement Contribution', min: 0, step: 10 },
      { name: 'desiredRetirementIncome', type: 'number', label: 'Desired Annual Retirement Income', min: 0, step: 1000 }
    ];
  }

  trackGoals(input, result) {
    const monthlyIncomeGrowth = (input.incomeGrowthRate / 100) * result.monthlyIncome;
    
    return input.goals.map(goal => {
      let progress = 0;
      let timeToGoal = 0;

      switch (goal.type) {
        case 'savings':
          progress = (result.totalAssets - result.totalLiabilities) / goal.target;
          timeToGoal = (goal.target - (result.totalAssets - result.totalLiabilities)) / result.availableSavings;
          break;
        case 'debt_reduction':
          progress = 1 - (result.totalLiabilities / goal.target);
          timeToGoal = result.totalLiabilities / result.availableSavings;
          break;
        case 'income':
          progress = result.monthlyIncome / goal.target;
          timeToGoal = monthlyIncomeGrowth > 0 ? 
            (goal.target - result.monthlyIncome) / monthlyIncomeGrowth : 
            Infinity;
          break;
      }

      return {
        ...goal,
        progress: Math.min(Math.max(progress, 0), 1),
        timeToGoal: Math.max(timeToGoal, 0)
      };
    });
  }

  validateField(field, value) {
    super.validateField(field, value);
    if (field.name === 'investmentRate' && (value < 0 || value > 1)) {
      throw new Error('Investment rate must be between 0 and 1');
    }
    if (field.name === 'budgetAllocation') {
      const total = Object.values(value).reduce((sum, allocation) => sum + allocation, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new Error('Budget allocation must sum to 100%');
      }
    }
    if (field.name === 'assets' || field.name === 'liabilities') {
      Object.values(value).forEach(amount => {
        if (amount < 0) {
          throw new Error(`${field.label} values must be non-negative`);
        }
      });
    }
  }
}
