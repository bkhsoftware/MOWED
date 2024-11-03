export class PortfolioOptimizer {
  // Enhanced asset data with tax characteristics
  static ASSET_DATA = {
    'US Large Cap Stocks': {
      return: 0.10,
      risk: 0.15,
      yield: 0.02,
      taxEfficiency: 0.85, // Higher is better
      qualifiedDividends: true,
      turnover: 0.05 // Annual turnover rate
    },
    'US Mid Cap Stocks': {
      return: 0.11,
      risk: 0.17,
      yield: 0.02,
      taxEfficiency: 0.80,
      qualifiedDividends: true,
      turnover: 0.15
    },
    'US Small Cap Stocks': {
      return: 0.12,
      risk: 0.20,
      yield: 0.015,
      taxEfficiency: 0.75,
      qualifiedDividends: true,
      turnover: 0.25
    },
    'International Developed Stocks': {
      return: 0.09,
      risk: 0.16,
      yield: 0.03,
      taxEfficiency: 0.70,
      qualifiedDividends: true,
      turnover: 0.10
    },
    'Emerging Market Stocks': {
      return: 0.11,
      risk: 0.22,
      yield: 0.025,
      taxEfficiency: 0.65,
      qualifiedDividends: false,
      turnover: 0.30
    },
    'US Government Bonds': {
      return: 0.04,
      risk: 0.05,
      yield: 0.02,
      taxEfficiency: 0.40,
      qualifiedDividends: false,
      turnover: 0.20
    },
    'Municipal Bonds': {
      return: 0.03,
      risk: 0.04,
      yield: 0.02,
      taxEfficiency: 1.0, // Tax-free
      qualifiedDividends: false,
      turnover: 0.15
    },
    'Corporate Bonds': {
      return: 0.05,
      risk: 0.07,
      yield: 0.03,
      taxEfficiency: 0.35,
      qualifiedDividends: false,
      turnover: 0.25
    },
    'High-Yield Bonds': {
      return: 0.06,
      risk: 0.10,
      yield: 0.05,
      taxEfficiency: 0.30,
      qualifiedDividends: false,
      turnover: 0.35
    },
    'REITs': {
      return: 0.09,
      risk: 0.16,
      yield: 0.04,
      taxEfficiency: 0.50,
      qualifiedDividends: false,
      turnover: 0.20
    },
    'Cash': {
      return: 0.02,
      risk: 0.01,
      yield: 0.02,
      taxEfficiency: 0.25,
      qualifiedDividends: false,
      turnover: 0
    }
  };

  static optimize(params) {
    const {
      investmentAmount,
      riskTolerance,
      timeHorizon,
      incomeNeeds,
      existingPositions = {},
      constraints = {},
      taxInfo = {} // New parameter
    } = params;

    const {
      marginalRate = 0.25,
      stateRate = 0,
      filingStatus = 'single',
      taxableAccounts = {},
      taxDeferredAccounts = {},
      taxFreeAccounts = {}
    } = taxInfo;

    // Calculate effective tax rates for different types of income
    const taxRates = this.calculateEffectiveTaxRates(marginalRate, stateRate, filingStatus);

    // Calculate target return and risk based on parameters
    const targetReturn = this.calculateTaxAdjustedReturn(
      this.calculateTargetReturn(riskTolerance, timeHorizon),
      taxRates
    );
    
    const maxRisk = this.calculateMaxRisk(riskTolerance);

    // Generate efficient frontier with tax considerations
    const portfolios = this.generateTaxEfficientFrontier(
      targetReturn,
      maxRisk,
      incomeNeeds,
      investmentAmount,
      constraints,
      taxRates,
      {
        taxableAccounts,
        taxDeferredAccounts,
        taxFreeAccounts
      }
    );

    // Select optimal portfolio considering tax efficiency
    const optimalPortfolio = this.selectOptimalPortfolio(
      portfolios,
      targetReturn,
      maxRisk,
      existingPositions,
      taxRates
    );

    // Generate tax-aware rebalancing recommendations
    const rebalancing = this.generateTaxAwareRebalancing(
      existingPositions,
      optimalPortfolio.allocation,
      investmentAmount,
      taxRates
    );

    return {
      recommendedAllocation: optimalPortfolio.allocation,
      accountSpecificAllocations: this.generateAccountSpecificAllocations(
        optimalPortfolio.allocation,
        {
          taxableAccounts,
          taxDeferredAccounts,
          taxFreeAccounts
        }
      ),
      expectedReturn: optimalPortfolio.expectedReturn,
      expectedRisk: optimalPortfolio.risk,
      expectedIncome: optimalPortfolio.income,
      taxEfficiency: optimalPortfolio.taxEfficiency,
      taxDragReduction: optimalPortfolio.taxDragReduction,
      rebalancingPlan: rebalancing,
      harvestingOpportunities: this.identifyTaxHarvestingOpportunities(
        existingPositions,
        taxRates
      ),
      diversificationScore: optimalPortfolio.diversificationScore,
      rationale: this.generateInvestmentRationale(optimalPortfolio, params)
    };
  }

  static calculateEffectiveTaxRates(marginalRate, stateRate, filingStatus) {
    const combinedRate = marginalRate + stateRate;
    return {
      ordinaryIncome: combinedRate,
      qualifiedDividends: Math.min(0.20, marginalRate) + stateRate,
      longTermGains: Math.min(0.20, marginalRate) + stateRate,
      shortTermGains: combinedRate,
      municipalBonds: stateRate
    };
  }

  static calculateTaxAdjustedReturn(baseReturn, taxRates) {
    return baseReturn * (1 - this.calculateAverageTaxDrag(taxRates));
  }

  static calculateAverageTaxDrag(taxRates) {
    // Estimate average tax impact on returns based on typical portfolio composition
    const weights = {
      qualifiedDividends: 0.4,
      ordinaryIncome: 0.3,
      longTermGains: 0.3
    };

    return Object.entries(weights).reduce((drag, [type, weight]) => 
      drag + (taxRates[type] * weight), 0);
  }

  static generateTaxEfficientFrontier(
    targetReturn,
    maxRisk,
    incomeNeeds,
    amount,
    constraints,
    taxRates,
    accounts
  ) {
    const portfolios = [];
    const steps = 50;

    for (let i = 0; i < steps; i++) {
      const riskLevel = (maxRisk * i) / steps;
      const portfolio = this.optimizeForRiskLevelWithTax(
        riskLevel,
        targetReturn,
        incomeNeeds,
        amount,
        constraints,
        taxRates,
        accounts
      );
      portfolios.push(portfolio);
    }

    return portfolios;
  }

  static optimizeForRiskLevelWithTax(
    riskLevel,
    targetReturn,
    incomeNeeds,
    amount,
    constraints,
    taxRates,
    accounts
  ) {
    // Initialize with tax-efficient weights
    let allocation = this.initializeTaxEfficientAllocation(taxRates, accounts);

    // Apply optimization algorithm
    allocation = this.optimizeWeightsWithTax(
      allocation,
      riskLevel,
      targetReturn,
      incomeNeeds,
      amount,
      constraints,
      taxRates,
      accounts
    );

    return {
      allocation,
      risk: this.calculatePortfolioRisk(allocation),
      expectedReturn: this.calculateTaxAdjustedPortfolioReturn(allocation, taxRates),
      income: this.calculateTaxAdjustedPortfolioIncome(allocation, amount, taxRates),
      taxEfficiency: this.calculatePortfolioTaxEfficiency(allocation, taxRates),
      taxDragReduction: this.calculateTaxDragReduction(allocation, taxRates),
      diversificationScore: this.calculateDiversificationScore(allocation)
    };
  }

  static initializeTaxEfficientAllocation(taxRates, accounts) {
    const allocation = {};
    const assets = Object.keys(this.ASSET_DATA);

    // Prioritize tax-efficient assets in taxable accounts
    const taxEfficiencyScores = assets.map(asset => ({
      asset,
      score: this.calculateAssetTaxEfficiencyScore(asset, taxRates)
    }));

    // Sort by tax efficiency
    taxEfficiencyScores.sort((a, b) => b.score - a.score);

    // Initialize weights with bias towards tax-efficient assets
    const totalAssets = taxEfficiencyScores.length;
    taxEfficiencyScores.forEach(({asset}, index) => {
      allocation[asset] = (totalAssets - index) / ((totalAssets * (totalAssets + 1)) / 2);
    });

    return this.normalizeAllocation(allocation);
  }

  static calculateAssetTaxEfficiencyScore(asset, taxRates) {
    const assetData = this.ASSET_DATA[asset];
    
    // Consider dividends, turnover, and qualified status
    const dividendTax = assetData.qualifiedDividends ? 
      taxRates.qualifiedDividends : taxRates.ordinaryIncome;
    
    const turnoverTax = assetData.turnover * taxRates.shortTermGains;
    
    return assetData.taxEfficiency * (1 - (dividendTax * assetData.yield + turnoverTax));
  }

  static calculateTaxAdjustedPortfolioReturn(allocation, taxRates) {
    return Object.entries(allocation).reduce((total, [asset, weight]) => {
      const assetData = this.ASSET_DATA[asset];
      const taxDrag = this.calculateAssetTaxDrag(asset, taxRates);
      return total + (weight * assetData.return * (1 - taxDrag));
    }, 0);
  }

  static calculateAssetTaxDrag(asset, taxRates) {
    const assetData = this.ASSET_DATA[asset];
    
    if (asset === 'Municipal Bonds') return 0;

    const dividendDrag = assetData.yield * (
      assetData.qualifiedDividends ? 
        taxRates.qualifiedDividends : 
        taxRates.ordinaryIncome
    );

    const turnoverDrag = assetData.turnover * taxRates.shortTermGains;

    return dividendDrag + turnoverDrag;
  }

  static generateAccountSpecificAllocations(
    overallAllocation,
    { taxableAccounts, taxDeferredAccounts, taxFreeAccounts }
  ) {
    // Implement asset location strategy
    const taxableAllocation = this.generateTaxableAccountAllocation(
      overallAllocation,
      taxableAccounts
    );

    const taxDeferredAllocation = this.generateTaxDeferredAccountAllocation(
      overallAllocation,
      taxDeferredAccounts
    );

    const taxFreeAllocation = this.generateTaxFreeAccountAllocation(
      overallAllocation,
      taxFreeAccounts
    );

    return {
      taxableAccounts: taxableAllocation,
      taxDeferredAccounts: taxDeferredAllocation,
      taxFreeAccounts: taxFreeAllocation
    };
  }

  static generateTaxableAccountAllocation(overallAllocation, accounts) {
    // Prioritize tax-efficient assets for taxable accounts
    const sortedAssets = Object.entries(overallAllocation)
      .sort(([assetA], [assetB]) => 
        this.ASSET_DATA[assetB].taxEfficiency - this.ASSET_DATA[assetA].taxEfficiency
      );

    // Implement allocation strategy...
    return {};
  }

  static generateTaxDeferredAccountAllocation(overallAllocation, accounts) {
    // Prioritize high-yield and high-turnover assets for tax-deferred accounts
    return {};
  }

  static generateTaxFreeAccountAllocation(overallAllocation, accounts) {
    // Prioritize highest expected return assets for tax-free accounts
    return {};
  }

  static generateTaxAwareRebalancing(current, target, amount, taxRates) {
    const plan = [];
    const taxLotAnalysis = this.analyzeTaxLots(current);

    Object.entries(target).forEach(([asset, targetWeight]) => {
      const currentWeight = current[asset] || 0;
      const difference = targetWeight - currentWeight;
      const dollarAmount = difference * amount;

      if (Math.abs(difference) >= 0.02) {
        const rebalancingAction = this.generateTaxEfficientAction(
          asset,
          dollarAmount,
          taxLotAnalysis[asset],
          taxRates
        );

        plan.push(rebalancingAction);
      }
    });

    return this.optimizeRebalancingSequence(plan, taxRates);
  }

  static generateTaxEfficientAction(asset, amount, taxLots, taxRates) {
    if (amount > 0) {
      return {
        asset,
        action: 'buy',
        amount: Math.abs(amount),
        taxImplications: null
      };
    }

    // For sells, analyze tax lots to minimize tax impact
    const optimizedSale = this.optimizeSale(asset, Math.abs(amount), taxLots, taxRates);
    return {
      asset,
      action: 'sell',
      amount: Math.abs(amount),
      taxImplications: optimizedSale.taxImpact,
      lots: optimizedSale.lots
    };
  }

  static optimizeSale(asset, amount, taxLots, taxRates) {
    // Implement specific lot selection algorithm
    // Prioritize tax losses and long-term gains with minimal tax impact
    return {
      lots: [],
      taxImpact: 0
    };
  }

  static identifyTaxHarvestingOpportunities(positions, taxRates) {
    const opportunities = [];
    const taxLotAnalysis = this.analyzeTaxLots(positions);

    Object.entries(taxLotAnalysis).forEach(([asset, lots]) => {
      const harvestingOpp = this.analyzeHarvestingOpportunity(
        asset,
        lots,
        taxRates
      );

      if (harvestingOpp.potentialSavings > 0) {
        opportunities.push(harvestingOpp);
      }
    });

    return this.prioritizeHarvestingOpportunities(opportunities);
  }

  static calculatePortfolioTaxEfficiency(allocation, taxRates) {
    const weightedTaxDrag = Object.entries(allocation).reduce((total, [asset, weight]) => {
      const taxDrag = this.calculateAssetTaxDrag(asset, taxRates);
      return total + (weight * taxDrag);
    }, 0);

    // Return efficiency score (1 - tax drag)
    return 1 - weightedTaxDrag;
  }

  static calculateTaxDragReduction(allocation, taxRates) {
    // Calculate tax drag of a naive portfolio (evenly distributed)
    const naiveAllocation = Object.keys(allocation).reduce((acc, asset) => {
      acc[asset] = 1 / Object.keys(allocation).length;
      return acc;
    }, {});

    const naiveTaxDrag = this.calculatePortfolioTaxEfficiency(naiveAllocation, taxRates);
    const optimizedTaxDrag = this.calculatePortfolioTaxEfficiency(allocation, taxRates);

    return (optimizedTaxDrag - naiveTaxDrag) / naiveTaxDrag;
  }

  static analyzeTaxLots(positions) {
    const analysis = {};
    
    Object.entries(positions).forEach(([asset, position]) => {
      if (position.lots) {
        analysis[asset] = this.analyzeLots(position.lots);
      } else {
        // If no lot information, treat as a single lot
        analysis[asset] = this.analyzeLots([{
          purchaseDate: position.purchaseDate || new Date(),
          cost: position.cost || 0,
          shares: position.shares || 0
        }]);
      }
    });

    return analysis;
  }

  static analyzeLots(lots) {
    const now = new Date();
    return lots.map(lot => {
      const holdingPeriod = this.calculateHoldingPeriod(lot.purchaseDate, now);
      const unrealizedGain = this.calculateUnrealizedGain(lot);
      
      return {
        ...lot,
        holdingPeriod,
        unrealizedGain,
        isLongTerm: holdingPeriod >= 365,
        taxEfficiency: this.calculateLotTaxEfficiency(holdingPeriod, unrealizedGain)
      };
    });
  }

  static analyzeHarvestingOpportunity(asset, lots, taxRates) {
    const harvestableLosses = lots
      .filter(lot => lot.unrealizedGain < 0)
      .reduce((total, lot) => total + Math.abs(lot.unrealizedGain), 0);

    const potentialTaxSavings = harvestableLosses * 
      (lots[0].isLongTerm ? taxRates.longTermGains : taxRates.shortTermGains);

    const replacementOptions = this.findReplacementSecurities(asset);

    return {
      asset,
      harvestableLosses,
      potentialTaxSavings,
      lots: lots.filter(lot => lot.unrealizedGain < 0),
      replacementOptions,
      washSaleWindow: this.calculateWashSaleWindow(lots),
      priority: this.calculateHarvestingPriority(potentialTaxSavings, lots)
    };
  }

  static findReplacementSecurities(asset) {
    // Define similar but not substantially identical investments
    const replacements = {
      'US Large Cap Stocks': ['US Large Cap Value ETF', 'US Large Cap Growth ETF'],
      'US Mid Cap Stocks': ['US Mid Cap Value ETF', 'US Mid Cap Growth ETF'],
      'International Developed Stocks': ['EAFE ETF', 'Developed Markets ETF'],
      'Emerging Market Stocks': ['Emerging Markets Value ETF', 'Emerging Markets Small Cap ETF'],
      'US Government Bonds': ['Treasury ETF', 'Government Bond ETF'],
      'Corporate Bonds': ['Corporate Bond ETF', 'Investment Grade Bond ETF']
    };

    return replacements[asset] || [];
  }

  static calculateWashSaleWindow(lots) {
    const recentSales = lots.filter(lot => lot.saleDate)
      .filter(lot => this.calculateHoldingPeriod(lot.saleDate, new Date()) < 30);

    return recentSales.map(sale => ({
      asset: sale.asset,
      saleDate: sale.saleDate,
      daysUntilClear: 30 - this.calculateHoldingPeriod(sale.saleDate, new Date())
    }));
  }

  static calculateHarvestingPriority(savings, lots) {
    if (savings > 10000) return 'high';
    if (savings > 5000) return 'medium';
    return 'low';
  }

  static calculateHoldingPeriod(startDate, endDate) {
    return Math.floor((endDate - new Date(startDate)) / (1000 * 60 * 60 * 24));
  }

  static calculateUnrealizedGain(lot) {
    const currentValue = lot.shares * lot.currentPrice;
    return currentValue - lot.cost;
  }

  static calculateLotTaxEfficiency(holdingPeriod, unrealizedGain) {
    const baseEfficiency = holdingPeriod >= 365 ? 0.8 : 0.4;
    const gainAdjustment = unrealizedGain > 0 ? -0.1 : 0.1;
    return Math.max(0, Math.min(1, baseEfficiency + gainAdjustment));
  }

  static prioritizeHarvestingOpportunities(opportunities) {
    return opportunities.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : a.priority === 'medium' ? 0 : 1;
      }
      return b.potentialTaxSavings - a.potentialTaxSavings;
    });
  }

  static generateInvestmentRationale(portfolio, params) {
    return {
      overview: this.generateOverview(portfolio, params),
      taxEfficiencyAnalysis: this.generateTaxEfficiencyAnalysis(portfolio),
      locationStrategy: this.generateLocationStrategyRationale(portfolio),
      harvestingStrategy: this.generateHarvestingStrategyRationale(portfolio),
      recommendations: this.generateTaxAwareRecommendations(portfolio, params)
    };
  }

  static generateTaxEfficiencyAnalysis(portfolio) {
    return {
      overallEfficiency: portfolio.taxEfficiency,
      dragReduction: portfolio.taxDragReduction,
      annualTaxSavings: this.estimateAnnualTaxSavings(portfolio),
      key_factors: this.identifyKeyTaxFactors(portfolio)
    };
  }

  static estimateAnnualTaxSavings(portfolio) {
    // Implementation of annual tax savings estimation
    return 0;
  }

  static identifyKeyTaxFactors(portfolio) {
    // Implementation of key tax factors identification
    return [];
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

  static optimizeWeightsWithTax(
    initialAllocation, 
    riskLevel, 
    targetReturn, 
    incomeNeeds,
    amount,
    constraints,
    taxRates,
    accounts
  ) {
    let allocation = { ...initialAllocation };
    const iterations = 1000;
    const stepSize = 0.01;
    
    for (let i = 0; i < iterations; i++) {
      // Randomly adjust weights
      allocation = this.adjustWeights(allocation, stepSize);
      
      // Calculate metrics for new allocation
      const risk = this.calculatePortfolioRisk(allocation);
      const returns = this.calculateTaxAdjustedPortfolioReturn(allocation, taxRates);
      const income = this.calculateTaxAdjustedPortfolioIncome(allocation, amount, taxRates);
      
      // Check if new allocation meets constraints
      if (risk > riskLevel || 
          returns < targetReturn || 
          income < incomeNeeds ||
          !this.meetsConstraints(allocation, constraints)) {
        // Revert to previous allocation
        allocation = { ...initialAllocation };
      }
    }

    return allocation;
  }

  static adjustWeights(allocation, stepSize) {
    const newAllocation = { ...allocation };
    const assets = Object.keys(newAllocation);
    
    // Randomly select two assets to adjust
    const i = Math.floor(Math.random() * assets.length);
    const j = Math.floor(Math.random() * assets.length);
    
    if (i !== j) {
      const adjustment = (Math.random() - 0.5) * stepSize;
      newAllocation[assets[i]] += adjustment;
      newAllocation[assets[j]] -= adjustment;
    }

    return this.normalizeAllocation(newAllocation);
  }

  static normalizeAllocation(allocation) {
    const total = Object.values(allocation).reduce((sum, weight) => sum + weight, 0);
    
    return Object.entries(allocation).reduce((normalized, [asset, weight]) => {
      normalized[asset] = weight / total;
      return normalized;
    }, {});
  }

  static calculatePortfolioRisk(allocation) {
    let totalRisk = 0;
    const assets = Object.keys(allocation);

    // Calculate portfolio variance using correlation matrix
    assets.forEach(asset1 => {
      assets.forEach(asset2 => {
        const weight1 = allocation[asset1];
        const weight2 = allocation[asset2];
        const correlation = this.getCorrelation(asset1, asset2);
        const risk1 = this.ASSET_DATA[asset1].risk;
        const risk2 = this.ASSET_DATA[asset2].risk;

        totalRisk += weight1 * weight2 * correlation * risk1 * risk2;
      });
    });

    return Math.sqrt(totalRisk);
  }

  static getCorrelation(asset1, asset2) {
    if (asset1 === asset2) return 1;
    
    // Simplified correlation matrix
    const correlations = {
      stocks: ['US Large Cap Stocks', 'US Mid Cap Stocks', 'US Small Cap Stocks'],
      international: ['International Developed Stocks', 'Emerging Market Stocks'],
      bonds: ['US Government Bonds', 'Municipal Bonds', 'Corporate Bonds', 'High-Yield Bonds'],
      alternative: ['REITs']
    };

    // Determine asset categories
    const getCategory = (asset) => {
      for (const [category, assets] of Object.entries(correlations)) {
        if (assets.includes(asset)) return category;
      }
      return 'other';
    };

    const cat1 = getCategory(asset1);
    const cat2 = getCategory(asset2);

    // Correlation coefficients
    if (cat1 === cat2) return 0.9;
    if (cat1 === 'stocks' && cat2 === 'international') return 0.7;
    if (cat1 === 'bonds' && (cat2 === 'stocks' || cat2 === 'international')) return -0.1;
    if (cat1 === 'alternative') return 0.5;

    return 0.3; // Default correlation for other combinations
  }

  static calculateTaxAdjustedPortfolioIncome(allocation, amount, taxRates) {
    return Object.entries(allocation).reduce((total, [asset, weight]) => {
      const assetData = this.ASSET_DATA[asset];
      const taxAdjustedYield = assetData.yield * (1 - this.calculateYieldTaxRate(asset, taxRates));
      return total + (weight * amount * taxAdjustedYield);
    }, 0);
  }

  static calculateYieldTaxRate(asset, taxRates) {
    const assetData = this.ASSET_DATA[asset];
    
    if (asset === 'Municipal Bonds') return taxRates.municipalBonds;
    return assetData.qualifiedDividends ? taxRates.qualifiedDividends : taxRates.ordinaryIncome;
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

    // Check asset class constraints
    if (constraints.assetClass) {
      const assetClassAllocations = this.calculateAssetClassAllocations(allocation);
      for (const [className, limits] of Object.entries(constraints.assetClass)) {
        const classAllocation = assetClassAllocations[className] || 0;
        if (classAllocation < limits.min || classAllocation > limits.max) return false;
      }
    }

    return true;
  }

  static calculateAssetClassAllocations(allocation) {
    const assetClasses = {
      stocks: ['US Large Cap Stocks', 'US Mid Cap Stocks', 'US Small Cap Stocks'],
      international: ['International Developed Stocks', 'Emerging Market Stocks'],
      bonds: ['US Government Bonds', 'Municipal Bonds', 'Corporate Bonds', 'High-Yield Bonds'],
      alternative: ['REITs'],
      cash: ['Cash']
    };

    return Object.entries(assetClasses).reduce((result, [className, assets]) => {
      result[className] = assets.reduce((sum, asset) => sum + (allocation[asset] || 0), 0);
      return result;
    }, {});
  }

  static generateOverview(portfolio, params) {
    const { riskTolerance, timeHorizon } = params;
    return `This portfolio is designed for a ${this.getRiskProfile(riskTolerance)} risk tolerance with a ${timeHorizon}-year investment horizon.`;
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

  static generateLocationStrategyRationale(portfolio) {
    return {
      taxableAccounts: {
        strategy: 'Tax-efficient assets prioritized',
        reasoning: 'Minimize taxable distributions and turnover'
      },
      taxDeferredAccounts: {
        strategy: 'High-yield assets prioritized',
        reasoning: 'Defer taxation on income-producing assets'
      },
      taxFreeAccounts: {
        strategy: 'Growth assets prioritized',
        reasoning: 'Maximize tax-free growth potential'
      }
    };
  }

  static generateHarvestingStrategyRationale(portfolio) {
    return {
      strategy: 'Systematic tax-loss harvesting',
      opportunities: portfolio.harvestingOpportunities.length,
      potentialSavings: portfolio.harvestingOpportunities.reduce(
        (total, opp) => total + opp.potentialTaxSavings, 
        0
      ),
      implementation: 'Regular monitoring with wash sale prevention'
    };
  }

  static generateTaxAwareRecommendations(portfolio, params) {
    const recommendations = [];

    // Asset location recommendations
    if (portfolio.taxEfficiency < 0.8) {
      recommendations.push({
        priority: 'high',
        category: 'asset_location',
        suggestion: 'Optimize asset location across account types',
        impact: `Potential tax drag reduction of ${(portfolio.taxDragReduction * 100).toFixed(1)}%`
      });
    }

    // Tax-loss harvesting recommendations
    if (portfolio.harvestingOpportunities.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'tax_loss_harvesting',
        suggestion: 'Implement systematic tax-loss harvesting',
        impact: `Potential tax savings of $${this.calculateHarvestingImpact(portfolio)}`
      });
    }

    return this.prioritizeRecommendations(recommendations);
  }

  static calculateHarvestingImpact(portfolio) {
    return portfolio.harvestingOpportunities
      .reduce((total, opp) => total + opp.potentialTaxSavings, 0)
      .toFixed(2);
  }

  static prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  static calculateDiversificationScore(allocation) {
    const assetClassAllocations = this.calculateAssetClassAllocations(allocation);
    
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = Object.values(assetClassAllocations)
      .reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
    
    // Convert HHI to a 0-100 scale where 100 is perfectly diversified
    return ((1 - hhi) * 100).toFixed(1);
  }

  static optimizeRebalancingSequence(plan, taxRates) {
    // Sort actions by tax efficiency
    return plan.sort((a, b) => {
      // Prioritize tax-free transactions
      if (!a.taxImplications && b.taxImplications) return -1;
      if (a.taxImplications && !b.taxImplications) return 1;

      // Then consider tax impact
      const impactA = a.taxImplications?.taxImpact || 0;
      const impactB = b.taxImplications?.taxImpact || 0;
      return impactA - impactB;
    });
  }
}
