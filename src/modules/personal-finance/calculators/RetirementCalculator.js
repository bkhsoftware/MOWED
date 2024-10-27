// calculators/RetirementCalculator.js
import { RetirementMonteCarloSimulator } from './RetirementMonteCarloSimulator';

export class RetirementCalculator {
  static calculate(input) {
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
      input.yearsInRetirement * 12
    );

    // Generate base retirement recommendations
    const baseRecommendations = this.generateBaseRecommendations(
      input,
      monthlyRetirementIncome,
      retirementSavingsAtRetirement
    );

    // Add Monte Carlo simulation
    const monteCarloResults = RetirementMonteCarloSimulator.runSimulation(input, {
      simulationCount: 1000,
      marketConditions: this.determineMarketConditions(input),
      confidenceLevels: [0.95, 0.75, 0.50]
    });

    return {
      yearsUntilRetirement,
      yearsInRetirement: input.yearsInRetirement,
      retirementSavingsAtRetirement,
      monthlyRetirementIncome,
      desiredMonthlyRetirementIncome: input.desiredRetirementIncome / 12,
      retirementIncomeGap: (input.desiredRetirementIncome / 12) - monthlyRetirementIncome,
      savingsRate: (input.monthlyRetirementContribution / input.monthlyIncome) * 100,
      projectedCoverageRatio: monthlyRetirementIncome / (input.desiredRetirementIncome / 12),
      additionalSavingsNeeded: this.calculateAdditionalSavingsNeeded(
        input,
        monthlyRetirementIncome,
        monthsUntilRetirement
      ),
      monteCarloAnalysis: monteCarloResults.analysis,
      simulationResults: monteCarloResults.simulations,
      successProbability: monteCarloResults.analysis.successRate,
      recommendations: [
        ...baseRecommendations,
        ...monteCarloResults.recommendations
      ]
    };
  }

  static generateBaseRecommendations(input, monthlyRetirementIncome, projectedSavings) {
    const recommendations = [];
    const retirementIncomeRatio = monthlyRetirementIncome / (input.desiredRetirementIncome / 12);
    const currentSavingsRate = (input.monthlyRetirementContribution / input.monthlyIncome) * 100;

    if (retirementIncomeRatio < 0.85) {
      recommendations.push({
        priority: 'high',
        category: 'savings',
        suggestion: 'Increase retirement savings rate',
        impact: 'Bridge retirement income gap',
        actions: [
          `Consider increasing monthly contributions by $${Math.ceil(input.monthlyIncome * 0.05)}`,
          'Review and reduce current expenses',
          'Explore additional income sources'
        ]
      });
    }

    if (currentSavingsRate < 15) {
      recommendations.push({
        priority: 'medium',
        category: 'savings_rate',
        suggestion: 'Boost retirement savings percentage',
        impact: 'Build stronger retirement foundation',
        actions: [
          'Aim for at least 15% savings rate',
          'Take full advantage of employer match if available',
          'Consider automatic savings increases'
        ]
      });
    }

    return recommendations;
  }

  static calculateRetirementSavings(currentSavings, monthlyContribution, months, monthlyRate) {
    return currentSavings * Math.pow(1 + monthlyRate, months) + 
           monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  static calculateRetirementIncome(savingsAtRetirement, monthlyRate, monthsInRetirement) {
    return savingsAtRetirement * (monthlyRate * Math.pow(1 + monthlyRate, monthsInRetirement)) / 
           (Math.pow(1 + monthlyRate, monthsInRetirement) - 1);
  }

  static calculateAdditionalSavingsNeeded(input, projectedIncome, monthsUntilRetirement) {
    const incomeGap = (input.desiredRetirementIncome / 12) - projectedIncome;
    if (incomeGap <= 0) return 0;

    // Calculate required additional monthly savings
    const monthlyRate = input.investmentRate / 12;
    const requiredSavings = incomeGap * 
      ((Math.pow(1 + monthlyRate, input.yearsInRetirement * 12) - 1) / 
      (monthlyRate * Math.pow(1 + monthlyRate, input.yearsInRetirement * 12)));

    return requiredSavings / 
      ((Math.pow(1 + monthlyRate, monthsUntilRetirement) - 1) / monthlyRate);
  }

  static determineMarketConditions(input) {
    // Analyze current market indicators
    const marketIndicators = this.analyzeMarketConditions();
    
    if (marketIndicators.volatility > 25) return 'bear';
    if (marketIndicators.momentum > 75) return 'bull';
    return 'normal';
  }

  static analyzeMarketConditions() {
    // This would typically connect to market data
    // For now, return moderate conditions
    return {
      volatility: 15,
      momentum: 50,
      trend: 'neutral'
    };
  }

}
