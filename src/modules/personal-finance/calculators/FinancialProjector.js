// calculators/FinancialProjector.js

export class FinancialProjector {
  static generateProjections(input, currentMetrics, options = {}) {
    const {
      projectionYears = 30,
      scenarioCount = 3,
      inflationRate = 0.02,
      marketVolatility = 0.15,
      simulationCount = 1000,  // For Monte Carlo
      taxStrategies = {} // New parameter
    } = options;

    const {
      marginalRate = 0.25,
      stateRate = 0,
      filingStatus = 'single',
      retirementAccounts = {},
      taxableAccounts = {},
      taxFreeAccounts = {},
      itemizingDeductions = false,
      anticipatedDeductions = {}
    } = taxStrategies;

    // Generate tax-aware base case and alternative scenarios
    const scenarios = this.generateTaxAwareScenarios(
      scenarioCount,
      input,
      taxStrategies
    );
    
    // Project each scenario with tax considerations
    const projections = scenarios.map(scenario => 
      this.projectScenarioWithTax(
        scenario,
        currentMetrics,
        {
          years: projectionYears,
          inflationRate,
          marketVolatility,
          taxStrategies
        }
      )
    );

    // Run Monte Carlo simulation for uncertainty analysis with tax awareness
    const monteCarloResults = this.runMonteCarloSimulationWithTax(
      input,
      currentMetrics,
      simulationCount,
      projectionYears,
      taxStrategies
    );

    return {
      scenarios: projections.map((projection, index) => ({
        name: scenarios[index].name,
        description: scenarios[index].description,
        assumptions: scenarios[index].assumptions,
        projection,
        keyMetrics: this.calculateScenarioMetricsWithTax(projection, taxStrategies),
        risks: this.identifyScenarioRisks(projection),
        taxImplications: this.analyzeTaxImplications(projection, taxStrategies)
      })),
      monteCarloAnalysis: monteCarloResults,
      summary: this.generateProjectionSummary(projections, monteCarloResults, taxStrategies),
      taxStrategy: this.generateTaxStrategy(projections, taxStrategies),
      recommendations: this.generateStrategicRecommendations(
        projections,
        monteCarloResults,
        taxStrategies
      )
    };
  }

  static generateTaxAwareScenarios(count, input, taxStrategies) {
    const baseScenario = {
      name: 'Base Case',
      description: 'Expected trajectory based on current parameters',
      assumptions: {
        incomeGrowthRate: input.incomeGrowthRate,
        investmentReturn: input.investmentRate,
        expenseGrowthRate: 0.02,  // Inflation rate
        savingsRate: input.budgetAllocation.Savings,
        taxAssumptions: this.generateBaseTaxAssumptions(input, taxStrategies)
      }
    };

    const optimisticScenario = {
      name: 'Optimistic Scenario',
      description: 'Favorable economic conditions and tax optimization',
      assumptions: {
        incomeGrowthRate: input.incomeGrowthRate * 1.5,
        investmentReturn: input.investmentRate * 1.2,
        expenseGrowthRate: 0.02,
        savingsRate: input.budgetAllocation.Savings * 1.2,
        taxAssumptions: this.generateOptimisticTaxAssumptions(input, taxStrategies)
      }
    };

    const pessimisticScenario = {
      name: 'Conservative Scenario',
      description: 'Challenging economic conditions and tax policy changes',
      assumptions: {
        incomeGrowthRate: Math.max(input.incomeGrowthRate * 0.5, 0.01),
        investmentReturn: Math.max(input.investmentRate * 0.7, 0.02),
        expenseGrowthRate: 0.03,
        savingsRate: input.budgetAllocation.Savings * 0.8,
        taxAssumptions: this.generatePessimisticTaxAssumptions(input, taxStrategies)
      }
    };

    return [baseScenario, optimisticScenario, pessimisticScenario];
  }

  static generateBaseTaxAssumptions(input, taxStrategies) {
    const { marginalRate, stateRate, filingStatus } = taxStrategies;
    return {
      marginalRate,
      stateRate,
      filingStatus,
      taxBracketProgression: this.projectTaxBracketProgression(input, taxStrategies),
      deductionUtilization: this.estimateDeductionUtilization(input, taxStrategies),
      retirementAccountStrategy: this.generateRetirementAccountStrategy(input, taxStrategies)
    };
  }

  static generateOptimisticTaxAssumptions(input, taxStrategies) {
    const baseAssumptions = this.generateBaseTaxAssumptions(input, taxStrategies);
    return {
      ...baseAssumptions,
      marginalRate: Math.max(baseAssumptions.marginalRate - 0.02, 0),
      deductionUtilization: Math.min(baseAssumptions.deductionUtilization * 1.2, 1),
      retirementAccountMaximization: true
    };
  }

  static generatePessimisticTaxAssumptions(input, taxStrategies) {
    const baseAssumptions = this.generateBaseTaxAssumptions(input, taxStrategies);
    return {
      ...baseAssumptions,
      marginalRate: baseAssumptions.marginalRate + 0.02,
      deductionUtilization: baseAssumptions.deductionUtilization * 0.8,
      retirementAccountRestrictions: true
    };
  }

  static projectScenarioWithTax(scenario, currentMetrics, params) {
    const projection = [];
    let currentYear = {
      year: 0,
      ...this.initializeYearMetricsWithTax(currentMetrics, scenario.assumptions.taxAssumptions)
    };

    for (let year = 1; year <= params.years; year++) {
      const nextYear = this.projectNextYearWithTax(
        currentYear,
        scenario,
        params,
        year
      );
      projection.push(nextYear);
      currentYear = nextYear;
    }

    return projection;
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

  static initializeYearMetricsWithTax(currentMetrics, taxAssumptions) {
    const baseMetrics = this.initializeYearMetrics(currentMetrics);
    
    return {
      ...baseMetrics,
      taxableIncome: this.calculateTaxableIncome(baseMetrics, taxAssumptions),
      taxLiability: this.calculateTaxLiability(baseMetrics, taxAssumptions),
      effectiveRate: this.calculateEffectiveRate(baseMetrics, taxAssumptions),
      taxAdvantagedSavings: this.calculateTaxAdvantagedSavings(baseMetrics, taxAssumptions),
      taxableInvestments: this.calculateTaxableInvestments(baseMetrics, taxAssumptions),
      deductions: this.calculateDeductions(baseMetrics, taxAssumptions)
    };
  }

  static projectNextYearWithTax(currentYear, scenario, params, yearIndex) {
    const { taxAssumptions } = scenario.assumptions;
    
    // Calculate next year's income and taxes
    const income = currentYear.income * (1 + scenario.assumptions.incomeGrowthRate);
    const taxableIncome = this.calculateTaxableIncome({
      ...currentYear,
      income
    }, taxAssumptions);
    
    const taxLiability = this.calculateTaxLiability({
      ...currentYear,
      income,
      taxableIncome
    }, taxAssumptions);

    // Calculate investment returns with tax implications
    const investmentReturns = this.calculateTaxAwareInvestmentReturns(
      currentYear,
      scenario,
      taxAssumptions
    );

    // Calculate tax-advantaged contributions
    const taxAdvantagedContributions = this.calculateTaxAdvantagedContributions(
      currentYear,
      scenario,
      taxAssumptions
    );

    // Update portfolio values considering taxes
    const { 
      taxableInvestments,
      taxAdvantagedInvestments,
      taxFreeInvestments
    } = this.updatePortfolioValues(
      currentYear,
      investmentReturns,
      taxAdvantagedContributions,
      taxAssumptions
    );

    // Calculate RMDs if applicable
    const rmds = this.calculateRequiredMinimumDistributions(
      currentYear,
      yearIndex,
      taxAssumptions
    );

    return {
      year: currentYear.year + 1,
      income,
      taxableIncome,
      taxLiability,
      effectiveRate: taxLiability / income,
      expenses: currentYear.expenses * (1 + scenario.assumptions.expenseGrowthRate),
      savings: income * (scenario.assumptions.savingsRate / 100),
      taxAdvantagedSavings: taxAdvantagedContributions.total,
      taxableInvestments,
      taxAdvantagedInvestments,
      taxFreeInvestments,
      totalInvestments: taxableInvestments + taxAdvantagedInvestments + taxFreeInvestments,
      investmentReturns: investmentReturns.total,
      rmds,
      deductions: this.updateDeductions(currentYear.deductions, taxAssumptions, yearIndex),
      netWorth: this.calculateNetWorth({
        taxableInvestments,
        taxAdvantagedInvestments,
        taxFreeInvestments
      }, currentYear.liabilities),
      taxStrategy: this.generateYearlyTaxStrategy(currentYear, taxAssumptions, yearIndex)
    };
  }

  static calculateTaxAwareInvestmentReturns(currentYear, scenario, taxAssumptions) {
    const { investmentReturn } = scenario.assumptions;
    
    // Calculate returns for each account type
    const taxableReturns = this.calculateTaxableReturns(
      currentYear.taxableInvestments,
      investmentReturn,
      taxAssumptions
    );

    const taxAdvantagedReturns = this.calculateTaxAdvantagedReturns(
      currentYear.taxAdvantagedInvestments,
      investmentReturn
    );

    const taxFreeReturns = this.calculateTaxFreeReturns(
      currentYear.taxFreeInvestments,
      investmentReturn
    );

    return {
      taxableReturns,
      taxAdvantagedReturns,
      taxFreeReturns,
      total: taxableReturns.afterTax + taxAdvantagedReturns + taxFreeReturns
    };
  }

  static calculateTaxableReturns(amount, returnRate, taxAssumptions) {
    const grossReturn = amount * returnRate;
    const { dividendYield = 0.02, capitalGainsRate = returnRate - 0.02 } = taxAssumptions;

    // Split returns into dividends and capital gains
    const dividends = amount * dividendYield;
    const capitalGains = amount * capitalGainsRate;

    // Calculate tax on each component
    const dividendTax = this.calculateDividendTax(dividends, taxAssumptions);
    const capitalGainsTax = this.calculateCapitalGainsTax(capitalGains, taxAssumptions);

    return {
      gross: grossReturn,
      dividends,
      capitalGains,
      tax: dividendTax + capitalGainsTax,
      afterTax: grossReturn - (dividendTax + capitalGainsTax)
    };
  }

  static generateTaxStrategy(projections, taxStrategies) {
    return {
      accountAllocation: this.recommendAccountAllocation(projections, taxStrategies),
      withdrawalStrategy: this.generateWithdrawalStrategy(projections, taxStrategies),
      rmdStrategy: this.generateRMDStrategy(projections, taxStrategies),
      bracketManagement: this.generateBracketManagementStrategy(projections, taxStrategies),
      conversionStrategy: this.generateConversionStrategy(projections, taxStrategies),
      deductionStrategy: this.generateDeductionStrategy(projections, taxStrategies)
    };
  }

  static generateStrategicRecommendations(projections, monteCarloResults, taxStrategies) {
    const recommendations = [];

    // Tax efficiency recommendations
    const taxEfficiency = this.analyzeTaxEfficiency(projections, taxStrategies);
    if (taxEfficiency.potentialSavings > 0) {
      recommendations.push({
        type: 'tax_optimization',
        priority: this.calculateRecommendationPriority(taxEfficiency.potentialSavings),
        suggestion: 'Optimize tax-advantaged account utilization',
        impact: `Potential lifetime tax savings of $${taxEfficiency.potentialSavings.toFixed(2)}`,
        actions: this.generateTaxOptimizationActions(taxEfficiency)
      });
    }

    // Portfolio diversification recommendations
    const diversification = this.analyzeDiversification(projections[0]);
    if (diversification.score < 0.7) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        suggestion: 'Improve portfolio diversification',
        impact: 'Reduce risk and enhance long-term returns',
        actions: this.generateDiversificationActions(diversification)
      });
    }

    // Income stability recommendations
    const incomeStability = this.analyzeIncomeStability(projections);
    if (incomeStability.volatility > 0.2) {
      recommendations.push({
        type: 'income_stability',
        priority: 'medium',
        suggestion: 'Enhance income stability',
        impact: 'Reduce income volatility and improve planning certainty',
        actions: this.generateIncomeStabilityActions(incomeStability)
      });
    }

    // Retirement readiness recommendations
    const retirementMetrics = this.analyzeRetirementReadiness(projections, monteCarloResults);
    if (retirementMetrics.readinessScore < 0.8) {
      recommendations.push({
        type: 'retirement_planning',
        priority: 'high',
        suggestion: 'Strengthen retirement preparation',
        impact: 'Improve likelihood of comfortable retirement',
        actions: this.generateRetirementActions(retirementMetrics)
      });
    }

    return this.prioritizeRecommendations(recommendations);
  }

  static analyzeTaxEfficiency(projections, taxStrategies) {
    const totalTaxPaid = projections.reduce((sum, projection) => 
      sum + projection.reduce((yearSum, year) => yearSum + year.taxLiability, 0), 0);
    
    const optimalTaxPaid = this.calculateOptimalTaxScenario(projections, taxStrategies);
    const potentialSavings = totalTaxPaid - optimalTaxPaid;

    return {
      currentEfficiency: optimalTaxPaid / totalTaxPaid,
      potentialSavings,
      opportunities: this.identifyTaxOpportunities(projections, taxStrategies)
    };
  }

  static generateTaxOptimizationActions(taxEfficiency) {
    return taxEfficiency.opportunities.map(opportunity => ({
      action: opportunity.description,
      impact: opportunity.potentialSavings,
      timeline: opportunity.implementationPeriod,
      requirements: opportunity.prerequisites
    }));
  }

  static analyzeRetirementReadiness(projections, monteCarloResults) {
    const baseProjection = projections[0];
    const finalYear = baseProjection[baseProjection.length - 1];

    return {
      readinessScore: this.calculateReadinessScore(finalYear, monteCarloResults),
      incomeReplacement: this.calculateIncomeReplacement(finalYear, baseProjection[0]),
      savingsAdequacy: this.assessSavingsAdequacy(baseProjection),
      riskAlignment: this.evaluateRiskAlignment(monteCarloResults)
    };
  }

  static calculateReadinessScore(finalYear, monteCarloResults) {
    const successWeight = 0.4;
    const savingsWeight = 0.3;
    const incomeWeight = 0.3;

    return (
      (monteCarloResults.probabilityOfSuccess / 100) * successWeight +
      (finalYear.savings / finalYear.income) * savingsWeight +
      (finalYear.investmentReturns / finalYear.expenses) * incomeWeight
    );
  }

  static calculateIncomeReplacement(finalYear, initialYear) {
    const replacementRatio = finalYear.income / initialYear.income;
    return {
      ratio: replacementRatio,
      adequacy: replacementRatio >= 0.8 ? 'Adequate' : 'Insufficient',
      gap: Math.max(0, 0.8 - replacementRatio) * initialYear.income
    };
  }

  static assessSavingsAdequacy(projection) {
    const savingsRate = projection.map(year => year.savings / year.income);
    const averageSavingsRate = savingsRate.reduce((sum, rate) => sum + rate, 0) / 
                              savingsRate.length;

    return {
      averageRate: averageSavingsRate,
      trend: this.analyzeSavingsTrend(savingsRate),
      sustainability: this.assessSavingsSustainability(projection)
    };
  }

  static analyzeSavingsTrend(savingsRate) {
    const trendLine = this.calculateTrendLine(savingsRate);
    return {
      slope: trendLine.slope,
      direction: trendLine.slope > 0 ? 'Improving' : 'Declining',
      consistency: this.calculateConsistency(savingsRate)
    };
  }

  static calculateTrendLine(values) {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, y) => sum + y, 0) / n;

    const slope = values.reduce((sum, y, i) => 
      sum + (i - xMean) * (y - yMean), 0) /
      values.reduce((sum, _, i) => sum + Math.pow(i - xMean, 2), 0);

    return {
      slope,
      intercept: yMean - slope * xMean
    };
  }

  static calculateConsistency(values) {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => 
      sum + Math.pow(value - mean, 2), 0) / values.length;
    return 1 - Math.sqrt(variance) / mean;
  }

  static assessSavingsSustainability(projection) {
    const expenses = projection.map(year => year.expenses / year.income);
    const savingsCapacity = projection.map(year => 
      (year.income - year.expenses) / year.income);

    return {
      expenseRatio: expenses.reduce((sum, ratio) => sum + ratio, 0) / expenses.length,
      savingsCapacity: savingsCapacity.reduce((sum, capacity) => sum + capacity, 0) / 
                      savingsCapacity.length,
      sustainability: this.calculateSustainabilityScore(expenses, savingsCapacity)
    };
  }

  static calculateSustainabilityScore(expenses, savingsCapacity) {
    const expenseTrend = this.calculateTrendLine(expenses);
    const savingsTrend = this.calculateTrendLine(savingsCapacity);

    return (expenseTrend.slope < 0 ? 1 : 0) * 0.4 + 
           (savingsTrend.slope > 0 ? 1 : 0) * 0.6;
  }

  static evaluateRiskAlignment(monteCarloResults) {
    return {
      volatility: monteCarloResults.riskMetrics.volatility,
      drawdownRisk: monteCarloResults.riskMetrics.maxDrawdown,
      tailRisk: monteCarloResults.riskMetrics.tailRisk,
      alignment: this.assessRiskAlignment(monteCarloResults)
    };
  }

  static assessRiskAlignment(monteCarloResults) {
    const volatilityScore = 1 - Math.min(monteCarloResults.riskMetrics.volatility / 0.2, 1);
    const drawdownScore = 1 - Math.min(monteCarloResults.riskMetrics.maxDrawdown / 0.3, 1);
    const successScore = monteCarloResults.probabilityOfSuccess / 100;

    return {
      score: (volatilityScore + drawdownScore + successScore) / 3,
      category: this.getRiskCategory(volatilityScore, drawdownScore, successScore),
      recommendations: this.generateRiskAlignmentRecommendations(
        volatilityScore,
        drawdownScore,
        successScore
      )
    };
  }

  static getRiskCategory(volatility, drawdown, success) {
    const score = (volatility + drawdown + success) / 3;
    if (score > 0.8) return 'Well Aligned';
    if (score > 0.6) return 'Moderately Aligned';
    return 'Misaligned';
  }

  static generateRiskAlignmentRecommendations(volatility, drawdown, success) {
    const recommendations = [];

    if (volatility < 0.7) {
      recommendations.push('Consider reducing portfolio volatility through diversification');
    }
    if (drawdown < 0.7) {
      recommendations.push('Implement drawdown protection strategies');
    }
    if (success < 0.7) {
      recommendations.push('Review and adjust financial goals for better probability of success');
    }

    return recommendations;
  }

  static calculateRecommendationPriority(impact) {
    if (impact > 100000) return 'high';
    if (impact > 50000) return 'medium';
    return 'low';
  }

  static prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return typeof b.impact === 'string' ? 
        0 : parseFloat(b.impact.replace(/[^0-9.-]+/g, "")) - 
           parseFloat(a.impact.replace(/[^0-9.-]+/g, ""));
    });
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
