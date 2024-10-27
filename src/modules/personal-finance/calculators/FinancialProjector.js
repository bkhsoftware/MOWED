// calculators/FinancialProjector.js

export class FinancialProjector {
  static generateProjections(input, currentMetrics, options = {}) {
    const {
      projectionYears = 30,
      scenarioCount = 3,
      inflationRate = 0.02,
      marketVolatility = 0.15,
      simulationCount = 1000  // For Monte Carlo
    } = options;

    // Generate base case and alternative scenarios
    const scenarios = this.generateScenarios(scenarioCount, input);
    
    // Project each scenario
    const projections = scenarios.map(scenario => 
      this.projectScenario(scenario, currentMetrics, {
        years: projectionYears,
        inflationRate,
        marketVolatility
      })
    );

    // Run Monte Carlo simulation for uncertainty analysis
    const monteCarloResults = this.runMonteCarloSimulation(
      input,
      currentMetrics,
      simulationCount,
      projectionYears
    );

    return {
      scenarios: projections.map((projection, index) => ({
        name: scenarios[index].name,
        description: scenarios[index].description,
        assumptions: scenarios[index].assumptions,
        projection,
        keyMetrics: this.calculateScenarioMetrics(projection),
        risks: this.identifyScenarioRisks(projection)
      })),
      monteCarloAnalysis: monteCarloResults,
      summary: this.generateProjectionSummary(projections, monteCarloResults),
      recommendations: this.generateStrategicRecommendations(projections, monteCarloResults)
    };
  }

  static generateScenarios(count, input) {
    const baseScenario = {
      name: 'Base Case',
      description: 'Expected trajectory based on current parameters',
      assumptions: {
        incomeGrowthRate: input.incomeGrowthRate,
        investmentReturn: input.investmentRate,
        expenseGrowthRate: 0.02,  // Inflation rate
        savingsRate: input.budgetAllocation.Savings
      }
    };

    const optimisticScenario = {
      name: 'Optimistic Scenario',
      description: 'Favorable economic conditions and career progression',
      assumptions: {
        incomeGrowthRate: input.incomeGrowthRate * 1.5,
        investmentReturn: input.investmentRate * 1.2,
        expenseGrowthRate: 0.02,
        savingsRate: input.budgetAllocation.Savings * 1.2
      }
    };

    const pessimisticScenario = {
      name: 'Conservative Scenario',
      description: 'Challenging economic conditions and slower growth',
      assumptions: {
        incomeGrowthRate: Math.max(input.incomeGrowthRate * 0.5, 0.01),
        investmentReturn: Math.max(input.investmentRate * 0.7, 0.02),
        expenseGrowthRate: 0.03,
        savingsRate: input.budgetAllocation.Savings * 0.8
      }
    };

    return [baseScenario, optimisticScenario, pessimisticScenario];
  }

  static projectScenario(scenario, currentMetrics, params) {
    const projection = [];
    let currentYear = {
      year: 0,
      ...this.initializeYearMetrics(currentMetrics)
    };

    for (let year = 1; year <= params.years; year++) {
      const nextYear = this.projectNextYear(currentYear, scenario, params);
      projection.push(nextYear);
      currentYear = nextYear;
    }

    return projection;
  }

  static initializeYearMetrics(currentMetrics) {
    return {
      income: currentMetrics.monthlyIncome * 12,
      expenses: currentMetrics.expenses * 12,
      savings: currentMetrics.availableSavings * 12,
      assets: currentMetrics.totalAssets,
      liabilities: currentMetrics.totalLiabilities,
      netWorth: currentMetrics.netWorth,
      investmentReturns: 0,
      debtPayments: 0,
      cashflow: 0
    };
  }

  static projectNextYear(currentYear, scenario, params) {
    const {
      incomeGrowthRate,
      investmentReturn,
      expenseGrowthRate,
      savingsRate
    } = scenario.assumptions;

    // Calculate next year's income and expenses
    const income = currentYear.income * (1 + incomeGrowthRate);
    const expenses = currentYear.expenses * (1 + expenseGrowthRate);
    const savings = income * (savingsRate / 100);
    
    // Calculate investment returns
    const investmentReturns = currentYear.assets * investmentReturn;
    
    // Calculate debt payments and remaining liabilities
    const debtPayments = this.calculateDebtPayments(currentYear.liabilities);
    const remainingLiabilities = Math.max(0, currentYear.liabilities - debtPayments);
    
    // Calculate new asset levels
    const assets = currentYear.assets + savings + investmentReturns;
    
    // Calculate net worth and cash flow
    const netWorth = assets - remainingLiabilities;
    const cashflow = income - expenses - debtPayments;

    return {
      year: currentYear.year + 1,
      income,
      expenses,
      savings,
      assets,
      liabilities: remainingLiabilities,
      netWorth,
      investmentReturns,
      debtPayments,
      cashflow
    };
  }

  static runMonteCarloSimulation(input, currentMetrics, simulationCount, years) {
    const simulations = [];
    
    for (let i = 0; i < simulationCount; i++) {
      const simulation = this.runSingleSimulation(input, currentMetrics, years);
      simulations.push(simulation);
    }

    return {
      confidenceIntervals: this.calculateConfidenceIntervals(simulations),
      probabilityOfSuccess: this.calculateSuccessProbability(simulations, input),
      riskMetrics: this.calculateRiskMetrics(simulations),
      extremeScenarios: this.identifyExtremeScenarios(simulations)
    };
  }

  static runSingleSimulation(input, currentMetrics, years) {
    const simulation = [];
    let currentYear = this.initializeYearMetrics(currentMetrics);

    for (let year = 1; year <= years; year++) {
      const yearMetrics = this.simulateYear(currentYear, input);
      simulation.push(yearMetrics);
      currentYear = yearMetrics;
    }

    return simulation;
  }

  static simulateYear(currentYear, input) {
    // Add random variations to returns and growth rates
    const randomizedReturns = this.generateRandomReturn(input.investmentRate);
    const randomizedGrowth = this.generateRandomGrowth(input.incomeGrowthRate);

    return this.projectNextYear(
      currentYear,
      {
        assumptions: {
          incomeGrowthRate: randomizedGrowth,
          investmentReturn: randomizedReturns,
          expenseGrowthRate: this.generateRandomInflation(),
          savingsRate: input.budgetAllocation.Savings
        }
      },
      {}
    );
  }

  static generateRandomReturn(baseReturn, volatility = 0.15) {
    return this.generateRandomNormal(baseReturn, volatility);
  }

  static generateRandomGrowth(baseGrowth, volatility = 0.05) {
    return Math.max(0, this.generateRandomNormal(baseGrowth, volatility));
  }

  static generateRandomInflation(mean = 0.02, volatility = 0.01) {
    return Math.max(0, this.generateRandomNormal(mean, volatility));
  }

  static generateRandomNormal(mean, stdDev) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  static calculateConfidenceIntervals(simulations) {
    const intervals = {};
    const percentiles = [5, 25, 50, 75, 95];
    const metrics = ['netWorth', 'assets', 'income'];

    metrics.forEach(metric => {
      intervals[metric] = this.calculateMetricIntervals(simulations, metric, percentiles);
    });

    return intervals;
  }

  static calculateMetricIntervals(simulations, metric, percentiles) {
    const years = simulations[0].length;
    const intervals = Array(years).fill().map(() => ({}));

    for (let year = 0; year < years; year++) {
      const yearValues = simulations.map(sim => sim[year][metric]).sort((a, b) => a - b);
      
      percentiles.forEach(p => {
        const index = Math.floor((p / 100) * yearValues.length);
        intervals[year][`p${p}`] = yearValues[index];
      });
    }

    return intervals;
  }

  static calculateSuccessProbability(simulations, input) {
    const targetNetWorth = input.savingsGoal;
    const targetIncome = input.desiredRetirementIncome;

    const successfulSimulations = simulations.filter(sim => {
      const finalYear = sim[sim.length - 1];
      return finalYear.netWorth >= targetNetWorth && 
             finalYear.income >= targetIncome;
    });

    return (successfulSimulations.length / simulations.length) * 100;
  }

  static calculateRiskMetrics(simulations) {
    return {
      volatility: this.calculateVolatility(simulations),
      maxDrawdown: this.calculateMaxDrawdown(simulations),
      tailRisk: this.calculateTailRisk(simulations)
    };
  }

  static calculateVolatility(simulations) {
    // Calculate standard deviation of annual returns
    const returns = this.calculateAnnualReturns(simulations);
    return this.standardDeviation(returns);
  }

  static calculateMaxDrawdown(simulations) {
    return simulations.map(sim => {
      let maxDrawdown = 0;
      let peak = sim[0].netWorth;

      sim.forEach(year => {
        if (year.netWorth > peak) {
          peak = year.netWorth;
        }
        const drawdown = (peak - year.netWorth) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      });

      return maxDrawdown;
    }).sort((a, b) => b - a)[0]; // Return worst drawdown
  }

  static calculateTailRisk(simulations) {
    const returns = this.calculateAnnualReturns(simulations);
    const sortedReturns = returns.sort((a, b) => a - b);
    const var95 = sortedReturns[Math.floor(0.05 * sortedReturns.length)];
    
    return {
      var95,
      cvar95: sortedReturns
        .filter(r => r <= var95)
        .reduce((sum, r) => sum + r, 0) / (sortedReturns.length * 0.05)
    };
  }

  static standardDeviation(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length);
  }

  static calculateAnnualReturns(simulations) {
    return simulations.flatMap(sim => 
      sim.slice(1).map((year, index) => 
        (year.netWorth - sim[index].netWorth) / sim[index].netWorth
      )
    );
  }

  static generateProjectionSummary(projections, monteCarloResults) {
    return {
      expectedOutcome: this.summarizeBaseScenario(projections[0]),
      uncertaintyAnalysis: {
        successProbability: monteCarloResults.probabilityOfSuccess,
        confidenceRanges: this.summarizeConfidenceIntervals(monteCarloResults.confidenceIntervals),
        keyRisks: this.summarizeRisks(monteCarloResults.riskMetrics)
      },
      longTermProjections: this.summarizeLongTermProjections(projections)
    };
  }

  static generateStrategicRecommendations(projections, monteCarloResults) {
    const recommendations = [];

    // Success probability based recommendations
    if (monteCarloResults.probabilityOfSuccess < 75) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        recommendation: 'Consider increasing savings rate or adjusting financial goals',
        impact: 'Improve probability of achieving long-term objectives'
      });
    }

    // Risk metric based recommendations
    if (monteCarloResults.riskMetrics.volatility > 0.15) {
      recommendations.push({
        type: 'portfolio',
        priority: 'medium',
        recommendation: 'Consider rebalancing portfolio for lower volatility',
        impact: 'Reduce potential for significant losses'
      });
    }

    // Projection based recommendations
    const baseProjection = projections[0];
    if (this.identifyNegativeTrends(baseProjection)) {
      recommendations.push({
        type: 'planning',
        priority: 'high',
        recommendation: 'Address negative trends in base case scenario',
        impact: 'Prevent deterioration of financial position'
      });
    }

    return recommendations;
  }

  static summarizeBaseScenario(baseProjection) {
    const finalYear = baseProjection[baseProjection.length - 1];
    const initialYear = baseProjection[0];

    return {
      netWorthGrowth: (finalYear.netWorth - initialYear.netWorth) / initialYear.netWorth,
      averageAnnualGrowth: Math.pow(finalYear.netWorth / initialYear.netWorth, 
        1 / baseProjection.length) - 1,
      finalNetWorth: finalYear.netWorth,
      finalIncome: finalYear.income
    };
  }

  static identifyNegativeTrends(projection) {
    // Look for consecutive years of decline in key metrics
    let consecutiveDeclines = 0;
    
    for (let i = 1; i < projection.length; i++) {
      if (projection[i].netWorth < projection[i-1].netWorth) {
        consecutiveDeclines++;
      } else {
        consecutiveDeclines = 0;
      }

      if (consecutiveDeclines >= 3) return true;
    }

    return false;
  }
}
