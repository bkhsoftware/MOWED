// recommendations/InvestmentRecommendations.js

export class InvestmentRecommendations {
  static generate(optimization, input) {
    const recommendations = [];
    const portfolioValue = this.calculatePortfolioValue(input.assets.Investments || {});

    // Core allocation recommendations
    recommendations.push({
      type: 'allocation',
      title: 'Asset Allocation',
      description: `Based on your ${optimization.rationale.overview.toLowerCase()}, we recommend the following allocation:`,
      details: this.formatAllocationDetails(optimization.recommendedAllocation),
      priority: 'high'
    });

    // Add rebalancing recommendations if needed
    if (optimization.rebalancingPlan.length > 0) {
      recommendations.push({
        type: 'rebalancing',
        title: 'Portfolio Rebalancing',
        description: 'To achieve the optimal allocation, consider these trades:',
        actions: this.formatRebalancingActions(optimization.rebalancingPlan, portfolioValue),
        priority: 'high'
      });
    }

    // Add diversification recommendations if needed
    if (optimization.diversificationScore < 70) {
      recommendations.push(this.generateDiversificationRecommendations(optimization));
    }

    // Add income-focused recommendations if needed
    if (input.desiredRetirementIncome > 0) {
      const incomeGap = input.desiredRetirementIncome - optimization.expectedIncome;
      if (incomeGap > 0) {
        recommendations.push(this.generateIncomeRecommendations(incomeGap, input));
      }
    }

    // Add risk management recommendations
    recommendations.push({
      type: 'risk',
      title: 'Risk Management',
      description: `Your portfolio has an expected volatility of ${(optimization.expectedRisk * 100).toFixed(1)}%`,
      details: optimization.rationale.keyConsiderations,
      priority: 'medium'
    });

    // Add tax efficiency recommendations
    recommendations.push(this.generateTaxEfficiencyRecommendations(input));

    return {
      recommendations: this.prioritizeRecommendations(recommendations),
      summary: this.generateSummary(optimization, input),
      nextSteps: this.generateNextSteps(recommendations)
    };
  }

  static formatAllocationDetails(allocation) {
    return Object.entries(allocation)
      .map(([asset, weight]) => ({
        asset,
        targetAllocation: weight * 100,
        rationale: this.getAssetClassRationale(asset)
      }));
  }

  static getAssetClassRationale(assetClass) {
    const rationales = {
      'US Large Cap Stocks': 'Core growth component with stable dividend potential',
      'US Mid Cap Stocks': 'Growth potential with moderate volatility',
      'US Small Cap Stocks': 'Higher growth potential with increased volatility',
      'International Developed Stocks': 'Geographic diversification and currency exposure',
      'Emerging Market Stocks': 'High growth potential with higher risk',
      'US Government Bonds': 'Portfolio stability and income generation',
      'Corporate Bonds': 'Higher yield potential than government bonds',
      'High-Yield Bonds': 'Income generation with higher risk',
      'REITs': 'Real estate exposure and income generation',
      'Cash': 'Portfolio stability and emergency reserves'
    };

    return rationales[assetClass] || 'Diversification component of portfolio';
  }

  static formatRebalancingActions(rebalancingPlan, portfolioValue) {
    return rebalancingPlan.map(plan => ({
      action: plan.action,
      asset: plan.asset,
      amount: plan.amount,
      percentageOfPortfolio: (plan.amount / portfolioValue) * 100,
      reason: `Adjust ${plan.asset} position by ${Math.abs(plan.percentageChange).toFixed(1)}% to optimize risk-adjusted returns`,
      priority: this.getRebalancingPriority(plan.percentageChange)
    }));
  }

  static getRebalancingPriority(percentageChange) {
    const absChange = Math.abs(percentageChange);
    if (absChange > 10) return 'high';
    if (absChange > 5) return 'medium';
    return 'low';
  }

  static generateDiversificationRecommendations(optimization) {
    const concentrationIssues = this.identifyConcentrationIssues(optimization.recommendedAllocation);
    
    return {
      type: 'diversification',
      title: 'Improve Diversification',
      description: 'Your portfolio could benefit from increased diversification:',
      suggestions: [
        'Consider adding exposure to different asset classes',
        'Reduce concentration in single assets or sectors',
        'Include international investments for global diversification',
        ...concentrationIssues.map(issue => `Consider reducing exposure to ${issue.asset}`)
      ],
      details: {
        currentScore: optimization.diversificationScore,
        targetScore: 80,
        concentrationIssues
      },
      priority: 'medium'
    };
  }

  static identifyConcentrationIssues(allocation) {
    return Object.entries(allocation)
      .filter(([_, weight]) => weight > 0.25)
      .map(([asset, weight]) => ({
        asset,
        currentAllocation: weight * 100,
        recommendedMaximum: 25,
        excessAllocation: (weight * 100) - 25
      }));
  }

  static generateIncomeRecommendations(incomeGap, input) {
    return {
      type: 'income',
      title: 'Income Generation Strategy',
      description: 'To meet your income needs:',
      suggestions: [
        'Consider increasing allocation to dividend-paying stocks',
        'Add high-quality corporate bonds for stable income',
        'Consider REITs for additional income generation',
        `Increase monthly investment by $${(incomeGap / 12).toFixed(2)} to meet income goals`
      ],
      details: {
        currentIncome: input.monthlyIncome,
        targetIncome: input.desiredRetirementIncome / 12,
        gap: incomeGap / 12,
        strategies: this.getIncomeStrategies(incomeGap, input)
      },
      priority: 'high'
    };
  }

  static getIncomeStrategies(incomeGap, input) {
    return [
      {
        strategy: 'Dividend Focus',
        expectedYield: 3.5,
        requiredInvestment: (incomeGap / 0.035),
        timeToReach: this.calculateTimeToReach(incomeGap / 0.035, input)
      },
      {
        strategy: 'Balanced Income',
        expectedYield: 4.0,
        requiredInvestment: (incomeGap / 0.04),
        timeToReach: this.calculateTimeToReach(incomeGap / 0.04, input)
      },
      {
        strategy: 'High Yield',
        expectedYield: 5.0,
        requiredInvestment: (incomeGap / 0.05),
        timeToReach: this.calculateTimeToReach(incomeGap / 0.05, input)
      }
    ];
  }

  static generateTaxEfficiencyRecommendations(input) {
    return {
      type: 'tax',
      title: 'Tax Efficiency Improvements',
      description: 'Optimize your portfolio\'s tax efficiency:',
      suggestions: [
        'Consider municipal bonds for tax-free income',
        'Maximize retirement account contributions',
        'Place high-yield investments in tax-advantaged accounts',
        'Consider tax-loss harvesting opportunities'
      ],
      priority: 'medium'
    };
  }

  static calculatePortfolioValue(investments) {
    return Object.values(investments).reduce((sum, value) => sum + value, 0);
  }

  static calculateTimeToReach(target, input) {
    const monthlyInvestment = input.monthlyRetirementContribution;
    const years = Math.log(1 + (target * input.investmentRate) / (12 * monthlyInvestment)) /
                 Math.log(1 + input.investmentRate / 12);
    return Math.ceil(years);
  }

  static prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  static generateSummary(optimization, input) {
    return {
      expectedReturn: optimization.expectedReturn,
      expectedRisk: optimization.expectedRisk,
      diversificationScore: optimization.diversificationScore,
      timeHorizon: input.retirementAge - input.age,
      riskProfile: optimization.rationale.overview,
      majorChangesNeeded: optimization.rebalancingPlan.length > 0
    };
  }

  static generateNextSteps(recommendations) {
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
    return {
      immediate: highPriorityRecs.map(r => r.title),
      timeline: this.createActionTimeline(recommendations),
      monitoringPoints: this.createMonitoringPoints(recommendations)
    };
  }

  static createActionTimeline(recommendations) {
    return {
      now: recommendations.filter(r => r.priority === 'high').map(r => r.title),
      soon: recommendations.filter(r => r.priority === 'medium').map(r => r.title),
      later: recommendations.filter(r => r.priority === 'low').map(r => r.title)
    };
  }

  static createMonitoringPoints(recommendations) {
    return [
      'Review portfolio allocation quarterly',
      'Rebalance when allocations drift more than 5%',
      'Assess income generation progress semi-annually',
      'Review risk tolerance annually'
    ];
  }
}
