// analyzers/CashflowAnalyzer.js

export class CashflowAnalyzer {
  static analyzeCashflowStability(input) {
    const stabilityFactors = [
      this.analyzeIncomeStability(input),
      this.analyzeEmergencyFund(input),
      this.analyzeDebtLoad(input),
      this.analyzeBudgetBuffer(input),
      this.analyzeExpenseStability(input)
    ];

    const stabilityScore = stabilityFactors.reduce((sum, factor) => sum + factor.score, 0) / 
                          stabilityFactors.length;

    return {
      score: Math.max(1, Math.min(5, stabilityScore)),
      factors: stabilityFactors,
      recommendations: this.generateStabilityRecommendations(stabilityFactors)
    };
  }

  static analyzeIncomeStability(input) {
    let score = 3;
    let reason = '';

    if (input.incomeGrowthRate > 5) {
      score += 0.5;
      reason = 'Strong income growth';
    } else if (input.incomeGrowthRate < 2) {
      score -= 0.5;
      reason = 'Limited income growth';
    }

    return { type: 'income', score, reason };
  }

  static analyzeEmergencyFund(input) {
    const monthlyExpenses = input.monthlyIncome * (1 - input.budgetAllocation.Savings / 100);
    const liquidAssets = Object.values(input.assets['Liquid Assets'] || {})
      .reduce((sum, value) => sum + value, 0);
    const monthsOfExpenses = liquidAssets / monthlyExpenses;

    let score = 3;
    let reason = '';

    if (monthsOfExpenses >= 6) {
      score += 1;
      reason = 'Strong emergency fund';
    } else if (monthsOfExpenses >= 3) {
      score += 0.5;
      reason = 'Adequate emergency fund';
    } else if (monthsOfExpenses < 1) {
      score -= 1;
      reason = 'Limited emergency fund';
    }

    return { type: 'emergency_fund', score, reason, months: monthsOfExpenses };
  }

  static analyzeDebtLoad(input) {
    const annualIncome = input.monthlyIncome * 12;
    const totalDebt = Object.values(input.liabilities)
      .reduce((sum, category) => sum + 
        Object.values(category).reduce((s, v) => s + v, 0), 0);
    const debtToIncome = totalDebt / annualIncome;

    let score = 3;
    let reason = '';

    if (debtToIncome > 0.5) {
      score -= 1;
      reason = 'High debt-to-income ratio';
    } else if (debtToIncome < 0.3) {
      score += 0.5;
      reason = 'Low debt-to-income ratio';
    }

    return { type: 'debt_load', score, reason, ratio: debtToIncome };
  }

  static analyzeBudgetBuffer(input) {
    const necessities = ['Housing', 'Food', 'Utilities', 'Healthcare'];
    const necessityRatio = necessities.reduce((sum, category) => 
      sum + (input.budgetAllocation[category] || 0), 0) / 100;

    let score = 3;
    let reason = '';

    if (necessityRatio > 0.7) {
      score -= 1;
      reason = 'High proportion of income going to necessities';
    } else if (necessityRatio < 0.5) {
      score += 1;
      reason = 'Good buffer in budget';
    }

    return { type: 'budget_buffer', score, reason, ratio: necessityRatio };
  }

  static analyzeExpenseStability(input) {
    const variableExpenses = ['Entertainment', 'Personal', 'Shopping'];
    const variableRatio = variableExpenses.reduce((sum, category) =>
      sum + (input.budgetAllocation[category] || 0), 0) / 100;

    let score = 3;
    let reason = '';

    if (variableRatio > 0.3) {
      score -= 0.5;
      reason = 'High proportion of variable expenses';
    } else if (variableRatio < 0.15) {
      score += 0.5;
      reason = 'Well-controlled variable expenses';
    }

    return { type: 'expense_stability', score, reason, ratio: variableRatio };
  }

  static generateStabilityRecommendations(factors) {
    return factors
      .filter(factor => factor.score < 3)
      .map(factor => {
        switch (factor.type) {
          case 'income':
            return {
              priority: 'high',
              suggestion: 'Consider ways to increase income stability',
              actions: ['Develop additional income streams', 'Improve job skills']
            };
          case 'emergency_fund':
            return {
              priority: 'high',
              suggestion: 'Build up emergency fund',
              actions: ['Aim for 3-6 months of expenses', 'Automate savings']
            };
          case 'debt_load':
            return {
              priority: 'medium',
              suggestion: 'Reduce debt burden',
              actions: ['Focus on high-interest debt', 'Consider debt consolidation']
            };
          case 'budget_buffer':
            return {
              priority: 'medium',
              suggestion: 'Increase budget flexibility',
              actions: ['Look for ways to reduce fixed expenses', 'Negotiate bills']
            };
          case 'expense_stability':
            return {
              priority: 'low',
              suggestion: 'Stabilize variable expenses',
              actions: ['Track discretionary spending', 'Set spending limits']
            };
          default:
            return null;
        }
      })
      .filter(recommendation => recommendation !== null);
  }
}
