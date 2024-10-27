export class PortfolioOptimizer {
  // Historical annual returns and volatility data for different asset classes
  static ASSET_DATA = {
    'US Large Cap Stocks': { return: 0.10, risk: 0.15, yield: 0.02 },
    'US Mid Cap Stocks': { return: 0.11, risk: 0.17, yield: 0.02 },
    'US Small Cap Stocks': { return: 0.12, risk: 0.20, yield: 0.015 },
    'International Developed Stocks': { return: 0.09, risk: 0.16, yield: 0.03 },
    'Emerging Market Stocks': { return: 0.11, risk: 0.22, yield: 0.025 },
    'US Government Bonds': { return: 0.04, risk: 0.05, yield: 0.02 },
    'Corporate Bonds': { return: 0.05, risk: 0.07, yield: 0.03 },
    'High-Yield Bonds': { return: 0.06, risk: 0.10, yield: 0.05 },
    'REITs': { return: 0.09, risk: 0.16, yield: 0.04 },
    'Cash': { return: 0.02, risk: 0.01, yield: 0.02 }
  };

  // Correlation matrix between asset classes (simplified version)
  static CORRELATION_MATRIX = {
    'US Large Cap Stocks': {
      'US Large Cap Stocks': 1.0,
      'US Mid Cap Stocks': 0.9,
      'US Small Cap Stocks': 0.85,
      'International Developed Stocks': 0.8,
      'Emerging Market Stocks': 0.7,
      'US Government Bonds': -0.1,
      'Corporate Bonds': 0.1,
      'High-Yield Bonds': 0.4,
      'REITs': 0.6,
      'Cash': 0
    },
    // ... Additional correlations would be defined here
  };

  static optimize(params) {
    const {
      investmentAmount,
      riskTolerance, // 1-5, where 1 is most conservative and 5 is most aggressive
      timeHorizon, // in years
      incomeNeeds, // annual income needed from portfolio
      existingPositions = {}, // current portfolio allocation
      constraints = {} // any specific constraints
    } = params;

    // Calculate target return and risk based on parameters
    const targetReturn = this.calculateTargetReturn(riskTolerance, timeHorizon);
    const maxRisk = this.calculateMaxRisk(riskTolerance);

    // Generate efficient frontier portfolios
    const portfolios = this.generateEfficientFrontier(
      targetReturn,
      maxRisk,
      incomeNeeds,
      investmentAmount,
      constraints
    );

    // Select optimal portfolio based on parameters
    const optimalPortfolio = this.selectOptimalPortfolio(
      portfolios,
      targetReturn,
      maxRisk,
      existingPositions
    );

    // Generate rebalancing recommendations
    const rebalancing = this.generateRebalancingPlan(
      existingPositions,
      optimalPortfolio.allocation,
      investmentAmount
    );

    return {
      recommendedAllocation: optimalPortfolio.allocation,
      expectedReturn: optimalPortfolio.expectedReturn,
      expectedRisk: optimalPortfolio.risk,
      expectedIncome: optimalPortfolio.income,
      rebalancingPlan: rebalancing,
      diversificationScore: optimalPortfolio.diversificationScore,
      rationale: this.generateInvestmentRationale(optimalPortfolio, params)
    };
  }

  static calculateTargetReturn(riskTolerance, timeHorizon) {
    // Base return expectations on risk tolerance and time horizon
    const baseReturn = 0.02; // Risk-free rate
    const riskPremium = (riskTolerance - 1) * 0.02;
    const timeAdjustment = Math.min(timeHorizon / 20, 1) * 0.02;
    
    return baseReturn + riskPremium + timeAdjustment;
  }

  static calculateMaxRisk(riskTolerance) {
    // Convert risk tolerance to maximum acceptable volatility
    const baseRisk = 0.05;
    return baseRisk + (riskTolerance - 1) * 0.05;
  }

  static generateEfficientFrontier(targetReturn, maxRisk, incomeNeeds, amount, constraints) {
    const portfolios = [];
    const steps = 50; // Number of portfolios to generate

    for (let i = 0; i < steps; i++) {
      const riskLevel = (maxRisk * i) / steps;
      const portfolio = this.optimizeForRiskLevel(
        riskLevel,
        targetReturn,
        incomeNeeds,
        amount,
        constraints
      );
      portfolios.push(portfolio);
    }

    return portfolios;
  }

  static optimizeForRiskLevel(riskLevel, targetReturn, incomeNeeds, amount, constraints) {
    // Initialize with equal weights
    let allocation = {};
    const assets = Object.keys(this.ASSET_DATA);
    const equalWeight = 1 / assets.length;
    
    assets.forEach(asset => {
      allocation[asset] = equalWeight;
    });

    // Apply optimization algorithm (simplified version)
    allocation = this.optimizeWeights(
      allocation,
      riskLevel,
      targetReturn,
      incomeNeeds,
      amount,
      constraints
    );

    return {
      allocation,
      risk: this.calculatePortfolioRisk(allocation),
      expectedReturn: this.calculatePortfolioReturn(allocation),
      income: this.calculatePortfolioIncome(allocation, amount),
      diversificationScore: this.calculateDiversificationScore(allocation)
    };
  }

  static optimizeWeights(initialAllocation, targetRisk, targetReturn, incomeNeeds, amount, constraints) {
    let allocation = { ...initialAllocation };
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      // Randomly adjust weights
      allocation = this.adjustWeights(allocation, constraints);
      
      // Check if new allocation meets targets
      const risk = this.calculatePortfolioRisk(allocation);
      const returns = this.calculatePortfolioReturn(allocation);
      const income = this.calculatePortfolioIncome(allocation, amount);
      
      // Reject if constraints are violated
      if (risk > targetRisk || 
          returns < targetReturn || 
          income < incomeNeeds ||
          !this.meetsConstraints(allocation, constraints)) {
        allocation = { ...initialAllocation };
      }
    }

    return allocation;
  }

  static adjustWeights(allocation, constraints) {
    const newAllocation = { ...allocation };
    const assets = Object.keys(newAllocation);
    
    // Randomly select two assets and adjust their weights
    const i = Math.floor(Math.random() * assets.length);
    const j = Math.floor(Math.random() * assets.length);
    
    if (i !== j) {
      const adjustment = Math.random() * 0.05; // Max 5% adjustment
      newAllocation[assets[i]] += adjustment;
      newAllocation[assets[j]] -= adjustment;
    }

    // Normalize weights to sum to 1
    const total = Object.values(newAllocation).reduce((sum, weight) => sum + weight, 0);
    Object.keys(newAllocation).forEach(asset => {
      newAllocation[asset] /= total;
    });

    return newAllocation;
  }

  static calculatePortfolioRisk(allocation) {
    let totalRisk = 0;
    const assets = Object.keys(allocation);

    assets.forEach(asset1 => {
      assets.forEach(asset2 => {
        const weight1 = allocation[asset1];
        const weight2 = allocation[asset2];
        const correlation = this.CORRELATION_MATRIX[asset1]?.[asset2] || 0;
        const risk1 = this.ASSET_DATA[asset1].risk;
        const risk2 = this.ASSET_DATA[asset2].risk;

        totalRisk += weight1 * weight2 * correlation * risk1 * risk2;
      });
    });

    return Math.sqrt(totalRisk);
  }

  static calculatePortfolioReturn(allocation) {
    return Object.entries(allocation).reduce((total, [asset, weight]) => {
      return total + (weight * this.ASSET_DATA[asset].return);
    }, 0);
  }

  static calculatePortfolioIncome(allocation, amount) {
    return Object.entries(allocation).reduce((total, [asset, weight]) => {
      return total + (weight * amount * this.ASSET_DATA[asset].yield);
    }, 0);
  }

  static calculateDiversificationScore(allocation) {
    const weights = Object.values(allocation);
    const herfindahlIndex = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
    return (1 - herfindahlIndex) * 100; // Convert to percentage
  }

  static generateRebalancingPlan(current, target, amount) {
    const plan = [];
    
    Object.entries(target).forEach(([asset, targetWeight]) => {
      const currentWeight = current[asset] || 0;
      const difference = targetWeight - currentWeight;
      const dollarAmount = difference * amount;

      if (Math.abs(difference) >= 0.02) { // Only rebalance if difference is ≥ 2%
        plan.push({
          asset,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(dollarAmount),
          percentageChange: difference * 100
        });
      }
    });

    return plan;
  }

  static generateInvestmentRationale(portfolio, params) {
    const { riskTolerance, timeHorizon, incomeNeeds } = params;

    return {
      overview: `This portfolio is designed for a ${this.getRiskProfile(riskTolerance)} risk tolerance with a ${timeHorizon}-year investment horizon.`,
      expectedOutcomes: {
        return: `Expected annual return of ${(portfolio.expectedReturn * 100).toFixed(1)}%`,
        risk: `Expected volatility of ${(portfolio.expectedRisk * 100).toFixed(1)}%`,
        income: `Projected annual income of $${portfolio.expectedIncome.toFixed(2)}`,
      },
      diversification: `Portfolio achieves a diversification score of ${portfolio.diversificationScore.toFixed(1)}%`,
      keyConsiderations: this.generateKeyConsiderations(portfolio, params)
    };
  }

  static getRiskProfile(riskTolerance) {
    const profiles = {
      1: 'conservative',
      2: 'moderately conservative',
      3: 'moderate',
      4: 'moderately aggressive',
      5: 'aggressive'
    };
    return profiles[riskTolerance] || 'moderate';
  }

  static generateKeyConsiderations(portfolio, params) {
    const considerations = [];
    
    if (params.incomeNeeds > 0) {
      considerations.push(`Portfolio is designed to generate ${(portfolio.expectedIncome / params.investmentAmount * 100).toFixed(1)}% annual income`);
    }

    if (params.timeHorizon < 5) {
      considerations.push('Short investment horizon suggests conservative allocation');
    } else if (params.timeHorizon > 15) {
      considerations.push('Long investment horizon allows for more growth-oriented allocation');
    }

    if (portfolio.diversificationScore < 70) {
      considerations.push('Consider increasing diversification across asset classes');
    }

    return considerations;
  }

  static meetsConstraints(allocation, constraints) {
    if (!constraints) return true;

    // Check minimum allocations
    if (constraints.minimum) {
      for (const [asset, min] of Object.entries(constraints.minimum)) {
        if ((allocation[asset] || 0) < min) return false;
      }
    }

    // Check maximum allocations
    if (constraints.maximum) {
      for (const [asset, max] of Object.entries(constraints.maximum)) {
        if ((allocation[asset] || 0) > max) return false;
      }
    }

    return true;
  }
}
