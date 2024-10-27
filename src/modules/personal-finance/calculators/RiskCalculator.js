// calculators/RiskCalculator.js
export class RiskCalculator {
  static calculateRiskTolerance(input) {
    let score = 3;

    score += this.calculateAgeBasedAdjustment(input);
    score += this.calculateIncomeAdjustment(input);
    score += this.calculateEmergencyFundAdjustment(input);
    score += this.calculateDebtLoadAdjustment(input);

    return Math.max(1, Math.min(5, Math.round(score)));
  }

  static calculateAgeBasedAdjustment(input) {
    const yearsToRetirement = input.retirementAge - input.age;
    if (yearsToRetirement > 30) return 1;
    if (yearsToRetirement < 10) return -1;
    return 0;
  }

  static calculateIncomeAdjustment(input) {
    if (input.incomeGrowthRate > 5) return 0.5;
    if (input.incomeGrowthRate < 2) return -0.5;
    return 0;
  }

  static calculateEmergencyFundAdjustment(input) {
    const monthlyExpenses = input.monthlyIncome * (1 - input.budgetAllocation.Savings / 100);
    const liquidAssets = Object.values(input.assets['Liquid Assets'] || {})
      .reduce((sum, value) => sum + value, 0);
    const monthsOfExpenses = liquidAssets / monthlyExpenses;
    
    if (monthsOfExpenses < 3) return -1;
    if (monthsOfExpenses > 6) return 0.5;
    return 0;
  }

  static calculateDebtLoadAdjustment(input) {
    const totalDebt = Object.values(input.liabilities)
      .reduce((sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0), 0);
    const debtToIncome = totalDebt / (input.monthlyIncome * 12);
    
    if (debtToIncome > 3) return -1;
    if (debtToIncome < 1) return 0.5;
    return 0;
  }
}
