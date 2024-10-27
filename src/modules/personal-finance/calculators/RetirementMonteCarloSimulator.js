// calculators/RetirementMonteCarloSimulator.js

export class RetirementMonteCarloSimulator {
  static runSimulation(input, options = {}) {
    const {
      simulationCount = 1000,
      confidenceLevels = [0.95, 0.75, 0.50],
      inflationMean = 0.02,
      inflationVolatility = 0.01,
      marketConditions = 'normal' // 'normal', 'bull', 'bear'
    } = options;

    const simulations = [];
    const currentAge = input.age;
    const retirementAge = input.retirementAge;
    const maxAge = retirementAge + input.yearsInRetirement;
    const timeHorizon = maxAge - currentAge;

    // Run multiple simulations
    for (let i = 0; i < simulationCount; i++) {
      const simulation = this.runSingleSimulation(
        input,
        timeHorizon,
        marketConditions,
        inflationMean,
        inflationVolatility
      );
      simulations.push(simulation);
    }

    // Analyze simulation results
    const analysis = this.analyzeSimulations(
      simulations,
      input,
      confidenceLevels
    );

    return {
      simulations,
      analysis,
      recommendations: this.generateRecommendations(analysis, input),
      riskMetrics: this.calculateRiskMetrics(simulations, input)
    };
  }

  static runSingleSimulation(input, timeHorizon, marketConditions, inflationMean, inflationVolatility) {
    const simulation = [];
    let currentPortfolio = {
      age: input.age,
      savings: input.retirementSavings,
      income: input.monthlyIncome * 12,
      expenses: this.calculateAnnualExpenses(input),
      inflation: inflationMean
    };

    // Pre-retirement phase
    for (let year = 0; year < (input.retirementAge - input.age); year++) {
      currentPortfolio = this.simulatePreRetirementYear(
        currentPortfolio,
        input,
        marketConditions
      );
      simulation.push({ ...currentPortfolio });
    }

    // Retirement phase
    for (let year = 0; year < input.yearsInRetirement; year++) {
      currentPortfolio = this.simulateRetirementYear(
        currentPortfolio,
        input,
        marketConditions,
        inflationMean,
        inflationVolatility
      );
      simulation.push({ ...currentPortfolio });
    }

    return simulation;
  }

  static simulatePreRetirementYear(portfolio, input, marketConditions) {
    // Generate random returns based on market conditions and asset allocation
    const returns = this.generateReturns(input, marketConditions);
    const inflation = this.generateInflation();
    
    // Calculate investment returns
    const investmentReturns = portfolio.savings * returns.totalReturn;
    
    // Calculate contributions
    const annualContribution = input.monthlyRetirementContribution * 12;
    
    // Update portfolio
    return {
      age: portfolio.age + 1,
      savings: portfolio.savings * (1 + returns.totalReturn) + annualContribution,
      income: portfolio.income * (1 + this.generateIncomeGrowth(input)),
      expenses: portfolio.expenses * (1 + inflation),
      inflation,
      returns: {
        ...returns,
        total: investmentReturns
      }
    };
  }

  static simulateRetirementYear(portfolio, input, marketConditions, inflationMean, inflationVolatility) {
    // Generate random returns and inflation
    const returns = this.generateReturns(input, marketConditions);
    const inflation = this.generateRandomNormal(inflationMean, inflationVolatility);
    
    // Calculate withdrawal
    const withdrawal = this.calculateWithdrawal(portfolio, input, inflation);
    
    // Update portfolio
    return {
      age: portfolio.age + 1,
      savings: Math.max(0, portfolio.savings * (1 + returns.totalReturn) - withdrawal),
      income: this.calculateRetirementIncome(portfolio, input, inflation),
      expenses: portfolio.expenses * (1 + inflation),
      inflation,
      returns: {
        ...returns,
        total: portfolio.savings * returns.totalReturn
      },
      withdrawal
    };
  }

  static generateReturns(input, marketConditions) {
    // Market condition adjustments
    const conditions = {
      normal: { mean: 0, volatility: 1 },
      bull: { mean: 0.02, volatility: 0.8 },
      bear: { mean: -0.02, volatility: 1.2 }
    }[marketConditions];

    // Asset class returns
    return {
      stocks: this.generateAssetReturn(0.10, 0.15, conditions),
      bonds: this.generateAssetReturn(0.04, 0.05, conditions),
      cash: this.generateAssetReturn(0.02, 0.01, conditions),
      totalReturn: this.calculatePortfolioReturn(input)
    };
  }

  static generateAssetReturn(mean, stdDev, conditions) {
    return this.generateRandomNormal(
      mean + conditions.mean,
      stdDev * conditions.volatility
    );
  }

  static calculatePortfolioReturn(input) {
    // Simplified asset allocation based on age
    const yearsToRetirement = input.retirementAge - input.age;
    const equityAllocation = Math.min(0.9, Math.max(0.2, yearsToRetirement / 30));
    const bondAllocation = 1 - equityAllocation;

    return (
      equityAllocation * this.generateAssetReturn(0.10, 0.15, { mean: 0, volatility: 1 }) +
      bondAllocation * this.generateAssetReturn(0.04, 0.05, { mean: 0, volatility: 1 })
    );
  }

  static generateIncomeGrowth(input) {
    return this.generateRandomNormal(input.incomeGrowthRate / 100, 0.01);
  }

  static generateInflation() {
    return this.generateRandomNormal(0.02, 0.01);
  }

  static calculateWithdrawal(portfolio, input, inflation) {
    // Dynamic withdrawal strategy based on portfolio performance
    const baseWithdrawal = input.desiredRetirementIncome;
    const portfolioValue = portfolio.savings;
    const withdrawalRate = baseWithdrawal / portfolioValue;

    if (withdrawalRate > 0.05) {
      // Reduce withdrawal if rate is too high
      return Math.min(baseWithdrawal, portfolioValue * 0.05);
    }
    
    return baseWithdrawal * (1 + inflation);
  }

  static calculateRetirementIncome(portfolio, input, inflation) {
    // Combine all retirement income sources
    const socialSecurityEstimate = this.estimateSocialSecurity(input) * (1 + inflation);
    return socialSecurityEstimate + portfolio.withdrawal;
  }

  static estimateSocialSecurity(input) {
    // Simplified Social Security estimate
    return Math.min(input.monthlyIncome * 0.4, 3000) * 12;
  }

  static calculateAnnualExpenses(input) {
    const monthlyExpenses = input.monthlyIncome * 
      (1 - input.budgetAllocation.Savings / 100);
    return monthlyExpenses * 12;
  }

  static generateRandomNormal(mean, stdDev) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  static analyzeSimulations(simulations, input, confidenceLevels) {
    const results = {
      successRate: this.calculateSuccessRate(simulations, input),
      confidenceIntervals: this.calculateConfidenceIntervals(simulations, confidenceLevels),
      medianPath: this.calculateMedianPath(simulations),
      extremeScenarios: this.identifyExtremeScenarios(simulations),
      keyMetrics: this.calculateKeyMetrics(simulations, input)
    };

    return {
      ...results,
      interpretation: this.interpretResults(results, input)
    };
  }

  static calculateSuccessRate(simulations, input) {
    const successfulSimulations = simulations.filter(simulation => {
      // Success means not running out of money and maintaining minimum income
      return simulation.every(year => 
        year.savings > 0 && 
        year.income >= input.desiredRetirementIncome * 0.7
      );
    });

    return (successfulSimulations.length / simulations.length) * 100;
  }

  static calculateConfidenceIntervals(simulations, confidenceLevels) {
    const intervals = {};
    
    confidenceLevels.forEach(level => {
      const index = Math.floor((1 - level) * simulations.length);
      const sortedOutcomes = simulations.map(sim => 
        sim[sim.length - 1].savings
      ).sort((a, b) => a - b);

      intervals[`${level * 100}%`] = sortedOutcomes[index];
    });

    return intervals;
  }

  static calculateMedianPath(simulations) {
    const timePoints = simulations[0].length;
    const medianPath = [];

    for (let t = 0; t < timePoints; t++) {
      const pointValues = simulations.map(sim => ({
        age: sim[t].age,
        savings: sim[t].savings,
        income: sim[t].income,
        expenses: sim[t].expenses
      }));

      medianPath.push({
        age: pointValues[0].age,
        savings: this.calculateMedian(pointValues.map(p => p.savings)),
        income: this.calculateMedian(pointValues.map(p => p.income)),
        expenses: this.calculateMedian(pointValues.map(p => p.expenses))
      });
    }

    return medianPath;
  }

  static calculateMedian(values) {
    const sorted = values.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  static identifyExtremeScenarios(simulations) {
    const finalOutcomes = simulations.map(sim => ({
      simulation: sim,
      finalSavings: sim[sim.length - 1].savings
    }));

    const sorted = finalOutcomes.sort((a, b) => a.finalSavings - b.finalSavings);
    
    return {
      worst: sorted[0].simulation,
      best: sorted[sorted.length - 1].simulation,
      tenthPercentile: sorted[Math.floor(simulations.length * 0.1)].simulation,
      ninetiethPercentile: sorted[Math.floor(simulations.length * 0.9)].simulation
    };
  }

  static calculateKeyMetrics(simulations, input) {
    return {
      medianFinalWealth: this.calculateMedian(
        simulations.map(sim => sim[sim.length - 1].savings)
      ),
      probabilityOfRuin: this.calculateRuinProbability(simulations),
      sustainableWithdrawalRate: this.calculateSustainableWithdrawalRate(simulations, input),
      realWealthPreservation: this.calculateRealWealthPreservation(simulations, input)
    };
  }

  static calculateRuinProbability(simulations) {
    const ruinedSimulations = simulations.filter(sim =>
      sim.some(year => year.savings <= 0)
    );
    return (ruinedSimulations.length / simulations.length) * 100;
  }

  static calculateSustainableWithdrawalRate(simulations, input) {
    // Binary search for highest sustainable withdrawal rate
    let low = 0;
    let high = 0.10; // 10% maximum withdrawal rate
    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations && (high - low) > 0.0001) {
      const mid = (low + high) / 2;
      const successRate = this.testWithdrawalRate(simulations, mid);

      if (successRate >= 0.95) { // 95% success rate threshold
        low = mid;
      } else {
        high = mid;
      }
      iterations++;
    }

    return (low + high) / 2;
  }

  static testWithdrawalRate(simulations, rate) {
    const successfulSimulations = simulations.filter(sim => {
      return sim.every(year => {
        const withdrawal = year.savings * rate;
        return year.savings - withdrawal > 0;
      });
    });

    return successfulSimulations.length / simulations.length;
  }

  static calculateRealWealthPreservation(simulations, input) {
    const initialWealth = input.retirementSavings;
    const successfulPreservation = simulations.filter(sim => {
      const finalWealth = sim[sim.length - 1].savings;
      const cumulativeInflation = sim.reduce((acc, year) => acc * (1 + year.inflation), 1);
      return finalWealth >= initialWealth * cumulativeInflation;
    });

    return (successfulPreservation.length / simulations.length) * 100;
  }

  static interpretResults(results, input) {
    const interpretation = {
      summary: this.generateSummary(results, input),
      risks: this.identifyKeyRisks(results, input),
      opportunities: this.identifyOpportunities(results, input),
      actionItems: this.generateActionItems(results, input)
    };

    return interpretation;
  }

  static generateRecommendations(analysis, input) {
    const recommendations = [];

    // Success rate based recommendations
    if (analysis.successRate < 85) {
      recommendations.push({
        priority: 'high',
        category: 'savings',
        suggestion: 'Increase retirement savings',
        impact: 'Improve probability of retirement success',
        actions: [
          'Increase monthly contributions',
          'Review investment allocation',
          'Consider delaying retirement'
        ]
      });
    }

    // Withdrawal rate recommendations
    if (analysis.keyMetrics.sustainableWithdrawalRate < 0.04) {
      recommendations.push({
        priority: 'high',
        category: 'spending',
        suggestion: 'Adjust retirement spending expectations',
        impact: 'Ensure sustainable retirement income',
        actions: [
          'Review discretionary spending plans',
          'Consider part-time work in retirement',
          'Explore ways to reduce fixed expenses'
        ]
      });
    }

    // Asset allocation recommendations
    const idealEquityAllocation = this.calculateIdealEquityAllocation(input);
    const currentEquityAllocation = this.calculateCurrentEquityAllocation(input);
    
    if (Math.abs(idealEquityAllocation - currentEquityAllocation) > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'investment',
        suggestion: 'Rebalance investment portfolio',
        impact: 'Optimize risk-adjusted returns',
        actions: [
          `Adjust equity allocation to ${idealEquityAllocation}%`,
          'Consider gradual rebalancing to minimize taxes',
          'Review risk tolerance annually'
        ]
      });
    }

    // Risk management recommendations
    if (analysis.keyMetrics.probabilityOfRuin > 5) {
      recommendations.push({
        priority: 'high',
        category: 'risk',
        suggestion: 'Enhance retirement risk management',
        impact: 'Reduce probability of outliving assets',
        actions: [
          'Build larger cash reserves',
          'Consider longevity insurance',
          'Develop multiple income streams'
        ]
      });
    }

    // Inflation protection recommendations
    if (analysis.keyMetrics.realWealthPreservation < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'inflation',
        suggestion: 'Strengthen inflation protection',
        impact: 'Maintain purchasing power over time',
        actions: [
          'Include inflation-protected securities',
          'Consider real estate investments',
          'Review fixed income allocation'
        ]
      });
    }

    // Social Security optimization
    const retirementAge = input.retirementAge;
    if (retirementAge < 70 && analysis.successRate < 90) {
      recommendations.push({
        priority: 'medium',
        category: 'social_security',
        suggestion: 'Optimize Social Security strategy',
        impact: 'Maximize guaranteed lifetime income',
        actions: [
          'Consider delaying benefits to age 70',
          'Review spousal benefit options',
          'Calculate break-even analysis'
        ]
      });
    }

    // Health care planning
    if (!this.hasAdequateHealthcarePlanning(input)) {
      recommendations.push({
        priority: 'high',
        category: 'healthcare',
        suggestion: 'Enhance healthcare planning',
        impact: 'Protect against medical expenses',
        actions: [
          'Review Medicare options',
          'Consider long-term care insurance',
          'Build dedicated healthcare savings'
        ]
      });
    }

    return this.prioritizeRecommendations(recommendations, analysis);
  }

  static calculateIdealEquityAllocation(input) {
    // Basic age-based allocation with adjustments for risk tolerance
    const baseAllocation = 100 - input.age;
    const riskAdjustment = (input.riskTolerance - 3) * 5; // +/- 5% per risk level
    return Math.min(90, Math.max(20, baseAllocation + riskAdjustment));
  }

  static calculateCurrentEquityAllocation(input) {
    // Calculate current equity allocation from asset mix
    const equityAssets = ['Stocks', 'ETFs', 'Mutual Funds'];
    const totalInvestments = Object.values(input.assets.Investments || {})
      .reduce((sum, value) => sum + value, 0);
    
    const equityTotal = Object.entries(input.assets.Investments || {})
      .filter(([category]) => equityAssets.includes(category))
      .reduce((sum, [, value]) => sum + value, 0);

    return totalInvestments > 0 ? (equityTotal / totalInvestments) * 100 : 0;
  }

  static hasAdequateHealthcarePlanning(input) {
    // Check for healthcare-specific savings and insurance
    const hasLongTermCare = input.insuranceCoverage?.includes('long_term_care') || false;
    const healthcareSavings = input.assets['Healthcare Savings'] || 0;
    const adequateSavings = healthcareSavings > input.monthlyIncome * 24; // 2 years of income

    return hasLongTermCare || adequateSavings;
  }

  static prioritizeRecommendations(recommendations, analysis) {
    // Adjust priorities based on analysis results
    return recommendations
      .map(rec => {
        // Increase priority if success rate is low
        if (analysis.successRate < 75 && 
            ['savings', 'spending', 'risk'].includes(rec.category)) {
          rec.priority = 'high';
        }

        // Add urgency information
        rec.urgency = this.calculateRecommendationUrgency(rec, analysis);

        return rec;
      })
      .sort((a, b) => {
        // Sort by priority and urgency
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.urgency - a.urgency;
      });
  }

  static calculateRecommendationUrgency(recommendation, analysis) {
    // Calculate urgency score (0-10) based on various factors
    let urgency = 5;

    switch (recommendation.category) {
      case 'savings':
        urgency += (100 - analysis.successRate) / 10;
        break;
      case 'risk':
        urgency += analysis.keyMetrics.probabilityOfRuin / 5;
        break;
      case 'spending':
        urgency += (4 - analysis.keyMetrics.sustainableWithdrawalRate * 100) / 2;
        break;
      default:
        urgency += (90 - analysis.successRate) / 20;
    }

    return Math.min(10, Math.max(0, urgency));
  }
}
