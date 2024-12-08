// analyzers/FinancialHealthAnalyzer.js

export class FinancialHealthAnalyzer {
  static analyzeFinancialHealth(input, result) {
    const metrics = this.calculateFinancialMetrics(input, result);
    const scores = this.calculateHealthScores(metrics);
    const recommendations = this.generateRecommendations(metrics, scores);

    return {
      overallScore: this.calculateOverallScore(scores),
      metrics,
      scores,
      recommendations,
      summary: this.generateSummary(scores, recommendations)
    };
  }

  static calculateFinancialMetrics(input, result) {
    return {
      // Savings and Emergency Fund
      savingsRate: (input.budgetAllocation.Savings / 100),
      monthsOfEmergencyFund: this.calculateEmergencyFundCoverage(input, result),
      
      // Debt Metrics
      debtToIncomeRatio: result.totalLiabilities / (input.monthlyIncome * 12),
      monthlyDebtPaymentRatio: (input.budgetAllocation['Debt Payments'] / 100),
      
      // Net Worth Metrics
      netWorthRatio: result.netWorth / (input.monthlyIncome * 12),
      netWorthGrowthRate: this.calculateNetWorthGrowthRate(result.historicalData),
      
      // Investment and Retirement
      investmentDiversification: this.calculateDiversificationScore(result.assets.Investments),
      retirementSavingsRate: input.monthlyRetirementContribution / input.monthlyIncome,
      retirementReadiness: this.calculateRetirementReadiness(input, result),
      
      // Budget Health
      essentialExpensesRatio: this.calculateEssentialExpensesRatio(input.budgetAllocation),
      discretionaryExpensesRatio: this.calculateDiscretionaryExpensesRatio(input.budgetAllocation),
      
      // Income Stability
      incomeGrowthRate: input.incomeGrowthRate / 100,
      incomeSourceDiversification: this.calculateIncomeSourceDiversification(input)
    };
  }

  static calculateHealthScores(metrics) {
    return {
      emergencyFund: this.scoreEmergencyFund(metrics.monthsOfEmergencyFund),
      debtManagement: this.scoreDebtManagement(metrics.debtToIncomeRatio, metrics.monthlyDebtPaymentRatio),
      netWorthHealth: this.scoreNetWorthHealth(metrics.netWorthRatio, metrics.netWorthGrowthRate),
      investmentHealth: this.scoreInvestmentHealth(metrics.investmentDiversification),
      retirementPlanning: this.scoreRetirementPlanning(metrics.retirementSavingsRate, metrics.retirementReadiness),
      budgetHealth: this.scoreBudgetHealth(metrics.essentialExpensesRatio, metrics.discretionaryExpensesRatio),
      incomeHealth: this.scoreIncomeHealth(metrics.incomeGrowthRate, metrics.incomeSourceDiversification)
    };
  }

  static generateRecommendations(metrics, scores) {
    const recommendations = [];

    // Emergency Fund Recommendations
    if (scores.emergencyFund < 0.7) {
      recommendations.push({
        category: 'Emergency Fund',
        priority: metrics.monthsOfEmergencyFund < 3 ? 'high' : 'medium',
        title: 'Build Emergency Fund',
        description: `Aim to save ${this.getEmergencyFundTarget(metrics)} months of expenses`,
        actions: [
          'Automate monthly savings transfers',
          'Keep emergency fund in high-yield savings account',
          'Review and reduce monthly expenses'
        ],
        impact: 'Increased financial security and stress reduction'
      });
    }

    // Debt Management Recommendations
    if (scores.debtManagement < 0.7) {
      recommendations.push({
        category: 'Debt Management',
        priority: metrics.debtToIncomeRatio > 0.5 ? 'high' : 'medium',
        title: 'Improve Debt Management',
        description: 'Reduce debt-to-income ratio and optimize debt payments',
        actions: this.generateDebtActions(metrics),
        impact: 'Lower interest costs and improved credit score'
      });
    }

    // Investment Health Recommendations
    if (scores.investmentHealth < 0.7) {
      recommendations.push({
        category: 'Investments',
        priority: 'medium',
        title: 'Optimize Investment Strategy',
        description: 'Improve investment diversification and returns',
        actions: this.generateInvestmentActions(metrics),
        impact: 'Better risk-adjusted returns and long-term growth'
      });
    }

    // Budget Health Recommendations
    if (scores.budgetHealth < 0.7) {
      recommendations.push({
        category: 'Budget Management',
        priority: metrics.essentialExpensesRatio > 0.7 ? 'high' : 'medium',
        title: 'Optimize Budget Allocation',
        description: 'Better balance between essential and discretionary expenses',
        actions: this.generateBudgetActions(metrics),
        impact: 'Improved financial flexibility and savings capacity'
      });
    }

    // Retirement Planning Recommendations
    if (scores.retirementPlanning < 0.7) {
      recommendations.push({
        category: 'Retirement',
        priority: 'high',
        title: 'Enhance Retirement Planning',
        description: 'Strengthen long-term retirement preparation',
        actions: this.generateRetirementActions(metrics),
        impact: 'Better retirement readiness and financial security'
      });
    }

    // Income Health Recommendations
    if (scores.incomeHealth < 0.7) {
      recommendations.push({
        category: 'Income',
        priority: 'medium',
        title: 'Improve Income Stability and Growth',
        description: 'Enhance income security and growth potential',
        actions: this.generateIncomeActions(metrics),
        impact: 'Increased financial stability and earning potential'
      });
    }

    return this.prioritizeRecommendations(recommendations);
  }

  // Helper methods for scoring
  static scoreEmergencyFund(months) {
    if (months >= 6) return 1;
    if (months >= 3) return 0.7;
    return months / 3;
  }

  static scoreDebtManagement(debtToIncomeRatio, monthlyDebtPaymentRatio) {
    const dtiScore = 1 - Math.min(debtToIncomeRatio, 1);
    const paymentScore = monthlyDebtPaymentRatio <= 0.36 ? 1 : (0.5 - (monthlyDebtPaymentRatio - 0.36));
    return (dtiScore + paymentScore) / 2;
  }

  static scoreNetWorthHealth(netWorthRatio, growthRate) {
    const ratioScore = Math.min(netWorthRatio / 3, 1); // Target 3x annual income
    const growthScore = Math.min((growthRate + 0.1) / 0.2, 1); // Target 20% growth
    return (ratioScore * 0.7) + (growthScore * 0.3);
  }

  static scoreInvestmentHealth(diversification) {
    return diversification;
  }

  static scoreRetirementPlanning(savingsRate, readiness) {
    const savingsScore = Math.min(savingsRate / 0.15, 1); // Target 15% savings
    return (savingsScore + readiness) / 2;
  }

  static scoreBudgetHealth(essentialRatio, discretionaryRatio) {
    const essentialScore = essentialRatio <= 0.5 ? 1 : (1 - (essentialRatio - 0.5));
    const discretionaryScore = discretionaryRatio <= 0.3 ? 1 : (1 - (discretionaryRatio - 0.3));
    return (essentialScore * 0.7) + (discretionaryScore * 0.3);
  }

  static scoreIncomeHealth(growthRate, diversification) {
    const growthScore = Math.min(growthRate / 0.05, 1); // Target 5% growth
    return (growthScore * 0.6) + (diversification * 0.4);
  }

  // Helper methods for calculations
  static calculateEmergencyFundCoverage(input, result) {
    const monthlyExpenses = input.monthlyIncome * (1 - input.budgetAllocation.Savings / 100);
    const liquidAssets = Object.values(result.assets['Liquid Assets'] || {})
      .reduce((sum, value) => sum + value, 0);
    return liquidAssets / monthlyExpenses;
  }

  static calculateNetWorthGrowthRate(historicalData) {
    if (!historicalData || historicalData.length < 2) return 0;
    
    const oldest = historicalData[0];
    const newest = historicalData[historicalData.length - 1];
    const monthsDiff = (new Date(newest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24 * 30);
    
    return monthsDiff > 0 ? 
      (Math.pow(newest.netWorth / oldest.netWorth, 1 / monthsDiff) - 1) * 12 : 0;
  }

  // Action generators
  static generateDebtActions(metrics) {
    const actions = [];
    if (metrics.debtToIncomeRatio > 0.5) {
      actions.push('Focus on paying down high-interest debt first');
      actions.push('Consider debt consolidation options');
    }
    if (metrics.monthlyDebtPaymentRatio > 0.36) {
      actions.push('Review refinancing options for lower interest rates');
      actions.push('Develop a debt snowball or avalanche strategy');
    }
    return actions;
  }

  static generateInvestmentActions(metrics) {
    return [
      'Increase portfolio diversification across asset classes',
      'Review and rebalance investment allocations regularly',
      'Consider low-cost index funds for core holdings',
      'Maximize tax-advantaged investment accounts'
    ];
  }

  static generateBudgetActions(metrics) {
    const actions = [];
    if (metrics.essentialExpensesRatio > 0.7) {
      actions.push('Look for ways to reduce fixed expenses');
      actions.push('Negotiate better rates for utilities and services');
    }
    if (metrics.discretionaryExpensesRatio > 0.3) {
      actions.push('Track and categorize all spending');
      actions.push('Identify areas to reduce non-essential spending');
    }
    return actions;
  }

  static generateRetirementActions(metrics) {
    return [
      'Increase retirement contributions to at least 15% of income',
      'Take full advantage of employer matching in retirement accounts',
      'Consider opening an IRA for additional tax-advantaged savings',
      'Review and adjust retirement investment allocation'
    ];
  }

  static prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  static calculateOverallScore(scores) {
    const weights = {
      emergencyFund: 0.15,
      debtManagement: 0.15,
      netWorthHealth: 0.15,
      investmentHealth: 0.15,
      retirementPlanning: 0.15,
      budgetHealth: 0.15,
      incomeHealth: 0.1
    };

    return Object.entries(scores).reduce(
      (total, [metric, score]) => total + (score * weights[metric]),
      0
    );
  }

  static generateSummary(scores, recommendations) {
    const overallScore = this.calculateOverallScore(scores);
    const strengths = Object.entries(scores)
      .filter(([, score]) => score >= 0.8)
      .map(([category]) => category);
    const weaknesses = Object.entries(scores)
      .filter(([, score]) => score < 0.6)
      .map(([category]) => category);

    return {
      overallHealth: this.getHealthCategory(overallScore),
      strengths,
      weaknesses,
      priorityActions: recommendations
        .filter(rec => rec.priority === 'high')
        .map(rec => rec.title),
      summary: this.generateHealthSummary(overallScore, strengths, weaknesses)
    };
  }

  static getHealthCategory(score) {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Needs Improvement';
  }
}
