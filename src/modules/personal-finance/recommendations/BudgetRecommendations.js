// recommendations/BudgetRecommendations.js

export class BudgetRecommendations {
  static generate(currentBudget, optimizedBudget) {
    const recommendations = [];
    const significantChange = 3; // Percentage points threshold for recommendations

    Object.entries(optimizedBudget).forEach(([category, recommendedPercent]) => {
      const currentPercent = currentBudget[category] || 0;
      const difference = recommendedPercent - currentPercent;

      if (Math.abs(difference) >= significantChange) {
        recommendations.push({
          category,
          currentPercent,
          recommendedPercent,
          difference,
          action: difference > 0 ? 'increase' : 'decrease',
          reason: this.getRecommendationReason(category, difference),
          priority: this.calculatePriority(category, difference)
        });
      }
    });

    return {
      recommendations: this.sortRecommendations(recommendations),
      summary: this.generateSummary(recommendations),
      impactAnalysis: this.analyzeImpact(currentBudget, optimizedBudget)
    };
  }

  static getRecommendationReason(category, difference) {
    const reasons = {
      Savings: {
        increase: 'Increasing savings will help you reach your financial goals faster and build a stronger emergency fund',
        decrease: 'Consider temporarily reducing savings to address more urgent financial needs, but aim to increase this again when possible'
      },
      'Debt Payments': {
        increase: 'Increasing debt payments will reduce interest costs and help you become debt-free sooner',
        decrease: 'A smaller debt payment allocation might be more sustainable for your current situation, but try to avoid taking on new debt'
      },
      Housing: {
        increase: 'Your housing allocation might need to increase to ensure stable accommodation, but try to keep it below 30% of income',
        decrease: 'Your housing costs might be higher than recommended. Consider options like refinancing or finding more affordable housing'
      },
      Transportation: {
        increase: 'Consider increasing transportation budget to ensure reliable access to work and essential services',
        decrease: 'You might save money by optimizing transportation costs through public transit, carpooling, or fuel-efficient options'
      },
      Food: {
        increase: 'Consider increasing food budget to ensure adequate nutrition while maintaining a balanced diet',
        decrease: 'You might reduce food expenses through meal planning, bulk buying, and reducing dining out'
      },
      Utilities: {
        increase: 'A higher utilities budget might be needed to ensure basic comfort and account for seasonal changes',
        decrease: 'Consider energy-efficient improvements or usage modifications to reduce utility costs'
      },
      Insurance: {
        increase: 'Adequate insurance coverage is crucial for financial security - consider reviewing and upgrading your policies',
        decrease: 'You might save on insurance by comparing providers or adjusting coverage, but maintain essential protection'
      },
      Healthcare: {
        increase: 'Healthcare is essential - consider increasing this allocation to ensure proper medical care and preventive services',
        decrease: 'You might optimize healthcare costs through preventive care and using in-network providers, but don\'t compromise on health'
      },
      Personal: {
        increase: 'A modest increase in personal spending can improve quality of life while maintaining financial goals',
        decrease: 'Reducing personal expenses can free up money for savings and debt reduction'
      },
      Entertainment: {
        increase: 'A balanced life includes entertainment, but keep this category reasonable relative to essential needs',
        decrease: 'Consider free or low-cost entertainment options to reduce expenses while maintaining social connections'
      }
    };

    return reasons[category]?.[difference > 0 ? 'increase' : 'decrease'] ||
      `Consider ${difference > 0 ? 'increasing' : 'decreasing'} your ${category.toLowerCase()} allocation for better financial balance`;
  }

  static calculatePriority(category, difference) {
    const priorityCategories = {
      'Debt Payments': 5,
      'Savings': 4,
      'Housing': 4,
      'Food': 4,
      'Healthcare': 4,
      'Utilities': 3,
      'Insurance': 3,
      'Transportation': 3,
      'Personal': 2,
      'Entertainment': 1
    };

    const basePriority = priorityCategories[category] || 2;
    const magnitudePriority = Math.min(Math.abs(difference) / 5, 2);

    return Math.min(5, basePriority + magnitudePriority);
  }

  static sortRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return Math.abs(b.difference) - Math.abs(a.difference);
    });
  }

  static generateSummary(recommendations) {
    const totalAdjustments = recommendations.reduce((sum, rec) => sum + Math.abs(rec.difference), 0);
    const majorChanges = recommendations.filter(rec => Math.abs(rec.difference) >= 5);

    return {
      totalAdjustments,
      numberOfChanges: recommendations.length,
      majorChanges: majorChanges.length,
      primaryFocus: this.identifyPrimaryFocus(recommendations),
      estimatedImpact: this.estimateImpact(recommendations)
    };
  }

  static identifyPrimaryFocus(recommendations) {
    if (recommendations.length === 0) return 'Maintain current budget';

    const highestPriority = Math.max(...recommendations.map(r => r.priority));
    const primaryRecs = recommendations.filter(r => r.priority === highestPriority);

    if (primaryRecs.length === 0) return 'Balance budget allocations';
    
    const categories = primaryRecs.map(r => r.category);
    return `Focus on optimizing ${categories.join(' and ')}`;
  }

  static estimateImpact(recommendations) {
    const savingsImpact = recommendations
      .filter(r => r.category === 'Savings')
      .reduce((sum, r) => sum + r.difference, 0);

    const debtImpact = recommendations
      .filter(r => r.category === 'Debt Payments')
      .reduce((sum, r) => sum + r.difference, 0);

    return {
      savingsChange: savingsImpact,
      debtPaymentChange: debtImpact,
      lifestyleImpact: this.calculateLifestyleImpact(recommendations)
    };
  }

  static calculateLifestyleImpact(recommendations) {
    const lifestyleCategories = ['Personal', 'Entertainment', 'Food'];
    const changes = recommendations
      .filter(r => lifestyleCategories.includes(r.category))
      .reduce((sum, r) => sum + r.difference, 0);
    
    if (changes <= -5) return 'Significant lifestyle adjustment needed';
    if (changes < 0) return 'Minor lifestyle adjustments recommended';
    if (changes > 0) return 'Room for lifestyle enhancement';
    return 'Minimal lifestyle impact';
  }

  static analyzeImpact(currentBudget, optimizedBudget) {
    const essentialCategories = ['Housing', 'Food', 'Utilities', 'Healthcare'];
    const currentEssentials = this.calculateEssentials(currentBudget, essentialCategories);
    const optimizedEssentials = this.calculateEssentials(optimizedBudget, essentialCategories);

    return {
      essentialsChange: optimizedEssentials - currentEssentials,
      financialHealth: this.assessFinancialHealth(optimizedBudget),
      sustainabilityScore: this.calculateSustainabilityScore(optimizedBudget)
    };
  }

  static calculateEssentials(budget, essentialCategories) {
    return essentialCategories.reduce((sum, category) => sum + (budget[category] || 0), 0);
  }

  static assessFinancialHealth(budget) {
    const savingsRate = budget.Savings || 0;
    const debtPayments = budget['Debt Payments'] || 0;
    const essentials = this.calculateEssentials(budget, ['Housing', 'Food', 'Utilities', 'Healthcare']);

    if (savingsRate >= 20 && debtPayments <= 15 && essentials <= 50) return 'Excellent';
    if (savingsRate >= 15 && debtPayments <= 20 && essentials <= 60) return 'Good';
    if (savingsRate >= 10 && debtPayments <= 25 && essentials <= 70) return 'Fair';
    return 'Needs Improvement';
  }

  static calculateSustainabilityScore(budget) {
    const weights = {
      Savings: 0.3,
      'Debt Payments': 0.2,
      Housing: 0.15,
      Food: 0.1,
      Healthcare: 0.1,
      Entertainment: 0.05,
      Personal: 0.05,
      Utilities: 0.05
    };

    return Object.entries(weights).reduce((score, [category, weight]) => {
      const value = budget[category] || 0;
      const normalizedValue = this.normalizeCategory(category, value);
      return score + (normalizedValue * weight);
    }, 0);
  }

  static normalizeCategory(category, value) {
    const optimal = {
      Savings: { min: 15, max: 25 },
      'Debt Payments': { min: 10, max: 20 },
      Housing: { min: 25, max: 35 },
      Food: { min: 10, max: 15 },
      Healthcare: { min: 5, max: 10 },
      Entertainment: { min: 5, max: 10 },
      Personal: { min: 5, max: 10 },
      Utilities: { min: 5, max: 10 }
    };

    const range = optimal[category] || { min: 0, max: 100 };
    if (value < range.min) return value / range.min;
    if (value > range.max) return range.max / value;
    return 1;
  }
}
