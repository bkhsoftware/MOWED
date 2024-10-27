// optimizers/TaxOptimizer.js

export class TaxOptimizer {
  static TAX_BRACKETS_2024 = {
    single: [
      { rate: 0.10, limit: 11600 },
      { rate: 0.12, limit: 47150 },
      { rate: 0.22, limit: 100525 },
      { rate: 0.24, limit: 191950 },
      { rate: 0.32, limit: 243725 },
      { rate: 0.35, limit: 609350 },
      { rate: 0.37, limit: Infinity }
    ],
    married: [
      { rate: 0.10, limit: 23200 },
      { rate: 0.12, limit: 94300 },
      { rate: 0.22, limit: 201050 },
      { rate: 0.24, limit: 383900 },
      { rate: 0.32, limit: 487450 },
      { rate: 0.35, limit: 731200 },
      { rate: 0.37, limit: Infinity }
    ]
  };

  static STANDARD_DEDUCTION_2024 = {
    single: 14600,
    married: 29200
  };

  static optimize(input) {
    const {
      income,
      filingStatus = 'single',
      deductions = [],
      retirementAccounts = {},
      investmentAccounts = {},
      capitalGains = [],
      age,
      stateOfResidence,
      selfEmployed = false
    } = input;

    // Calculate optimal tax strategies
    const strategies = {
      deductions: this.optimizeDeductions(income, deductions, filingStatus),
      retirement: this.optimizeRetirementContributions(income, retirementAccounts, age),
      investments: this.optimizeInvestmentAccounts(investmentAccounts, income, filingStatus),
      capitalGains: this.optimizeCapitalGains(capitalGains, income, filingStatus),
      timing: this.optimizeIncomeTiming(income, filingStatus)
    };

    // Generate comprehensive tax plan
    const taxPlan = this.generateTaxPlan(strategies, input);

    // Calculate tax savings
    const savings = this.calculateTaxSavings(taxPlan, input);

    return {
      strategies,
      taxPlan,
      savings,
      recommendations: this.generateRecommendations(taxPlan, input),
      projections: this.generateTaxProjections(taxPlan, input)
    };
  }

  static optimizeDeductions(income, deductions, filingStatus) {
    const standardDeduction = this.STANDARD_DEDUCTION_2024[filingStatus];
    const itemizedTotal = this.calculateItemizedDeductions(deductions);
    
    const useItemized = itemizedTotal > standardDeduction;
    const selectedDeductions = useItemized ? this.prioritizeDeductions(deductions) : [];
    
    const bunching = this.analyzeBunchingStrategy(deductions, standardDeduction);

    return {
      optimal: useItemized ? 'itemized' : 'standard',
      standardDeduction,
      itemizedTotal,
      selectedDeductions,
      bunching,
      potentialAdditional: this.findAdditionalDeductions(income, deductions)
    };
  }

  static optimizeRetirementContributions(income, accounts, age) {
    const limits = this.getContributionLimits(age);
    const prioritizedAccounts = this.prioritizeRetirementAccounts(accounts, income);
    const optimalContributions = {};

    let remainingIncome = income;
    prioritizedAccounts.forEach(account => {
      const contribution = this.calculateOptimalContribution(
        account,
        remainingIncome,
        limits[account.type]
      );
      optimalContributions[account.type] = contribution;
      remainingIncome -= contribution;
    });

    return {
      contributions: optimalContributions,
      taxSavings: this.calculateRetirementTaxSavings(optimalContributions, income),
      recommendations: this.generateRetirementRecommendations(accounts, income, age)
    };
  }

  static optimizeInvestmentAccounts(accounts, income, filingStatus) {
    const taxBracket = this.calculateMarginalRate(income, filingStatus);
    const assetLocations = this.optimizeAssetLocation(accounts, taxBracket);
    const harvestingOpportunities = this.identifyTaxLossHarvesting(accounts);

    return {
      assetLocations,
      harvestingOpportunities,
      rebalancingStrategy: this.generateRebalancingStrategy(accounts, taxBracket)
    };
  }

  static optimizeCapitalGains(gains, income, filingStatus) {
    const brackets = this.getCapitalGainsBrackets(income, filingStatus);
    const harvestingPlan = this.planGainsHarvesting(gains, brackets);
    const timingStrategy = this.optimizeGainsTiming(gains, income, filingStatus);

    return {
      harvestingPlan,
      timingStrategy,
      estimatedSavings: this.calculateGainsSavings(harvestingPlan, brackets)
    };
  }

  static optimizeIncomeTiming(income, filingStatus) {
    const brackets = this.TAX_BRACKETS_2024[filingStatus];
    const currentBracket = this.calculateMarginalRate(income, filingStatus);
    const nextBracket = this.findNextBracket(income, brackets);

    return {
      deferralThreshold: nextBracket ? nextBracket.limit : null,
      accelerationThreshold: this.findAccelerationThreshold(income, brackets),
      recommendations: this.generateTimingRecommendations(income, brackets)
    };
  }

  static calculateMarginalRate(income, filingStatus) {
    const brackets = this.TAX_BRACKETS_2024[filingStatus];
    const taxableIncome = income - this.STANDARD_DEDUCTION_2024[filingStatus];

    for (const bracket of brackets) {
      if (taxableIncome <= bracket.limit) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  }

  static calculateItemizedDeductions(deductions) {
    return deductions.reduce((total, deduction) => {
      return total + (deduction.eligible ? deduction.amount : 0);
    }, 0);
  }

  static prioritizeDeductions(deductions) {
    return deductions
      .filter(d => d.eligible)
      .sort((a, b) => {
        // Sort by eligibility certainty and amount
        if (a.certainty !== b.certainty) {
          return b.certainty - a.certainty;
        }
        return b.amount - a.amount;
      });
  }

  static analyzeBunchingStrategy(deductions, standardDeduction) {
    const bunchableDeductions = deductions.filter(d => d.bunchable);
    const totalBunchable = bunchableDeductions.reduce((sum, d) => sum + d.amount, 0);
    
    if (totalBunchable * 2 > standardDeduction) {
      return {
        recommended: true,
        potentialSavings: this.calculateBunchingSavings(deductions, standardDeduction),
        timeline: this.createBunchingTimeline(deductions)
      };
    }

    return { recommended: false };
  }

  static findAdditionalDeductions(income, currentDeductions) {
    const potentialDeductions = [];
    
    // Check for commonly overlooked deductions
    if (!currentDeductions.some(d => d.type === 'hsa')) {
      potentialDeductions.push({
        type: 'hsa',
        description: 'Health Savings Account contributions',
        maxBenefit: this.calculateHSABenefit(income)
      });
    }

    // Add other potential deductions...
    return potentialDeductions;
  }

  static getContributionLimits(age) {
    const year = 2024;
    return {
      '401k': age >= 50 ? 30500 : 23000,
      'IRA': age >= 50 ? 8000 : 7000,
      'HSA': age >= 55 ? 4850 : 3850
    };
  }

  static prioritizeRetirementAccounts(accounts, income) {
    return Object.entries(accounts)
      .map(([type, account]) => ({
        type,
        ...account,
        priority: this.calculateAccountPriority(type, account, income)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  static calculateAccountPriority(type, account, income) {
    let priority = 0;
    
    // Employer match consideration
    if (account.employerMatch) {
      priority += 5 * account.employerMatch.rate;
    }

    // Tax benefit consideration
    const marginalRate = this.calculateMarginalRate(income, 'single');
    priority += marginalRate * 10;

    // Flexibility consideration
    if (account.hasRoth) priority += 1;
    if (account.hasLoan) priority += 0.5;

    return priority;
  }

  static optimizeAssetLocation(accounts, taxBracket) {
    const assetLocations = {};
    const assetClasses = this.categorizeAssets(accounts);

    // Allocate assets based on tax efficiency
    Object.entries(assetClasses).forEach(([assetClass, assets]) => {
      assetLocations[assetClass] = this.determineOptimalLocation(
        assetClass,
        assets,
        taxBracket,
        accounts
      );
    });

    return assetLocations;
  }

  static identifyTaxLossHarvesting(accounts) {
    const opportunities = [];
    
    Object.entries(accounts).forEach(([accountType, holdings]) => {
      if (accountType === 'taxable') {
        holdings.forEach(holding => {
          if (holding.unrealizedLoss > 0) {
            opportunities.push({
              security: holding.security,
              loss: holding.unrealizedLoss,
              replacementOptions: this.findReplacementSecurities(holding)
            });
          }
        });
      }
    });

    return opportunities;
  }

  static generateTaxProjections(taxPlan, input) {
    const projections = [];
    const years = 5;

    for (let year = 0; year < years; year++) {
      projections.push({
        year: new Date().getFullYear() + year,
        ...this.projectTaxSituation(taxPlan, input, year)
      });
    }

    return projections;
  }

  static generateRecommendations(taxPlan, input) {
    const recommendations = [];

    // Check retirement contribution opportunities
    if (input.income > 0) {
      const unusedRetirementSpace = this.calculateUnusedRetirementSpace(input);
      if (unusedRetirementSpace > 0) {
        recommendations.push({
          priority: 'high',
          category: 'retirement',
          suggestion: 'Increase retirement contributions',
          potentialSavings: this.calculateRetirementSavings(unusedRetirementSpace, input)
        });
      }
    }

    // Check tax loss harvesting opportunities
    if (taxPlan.investments.harvestingOpportunities.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'harvesting',
        suggestion: 'Consider tax loss harvesting opportunities',
        potentialSavings: this.calculateHarvestingSavings(
          taxPlan.investments.harvestingOpportunities,
          input
        )
      });
    }

    // Add other recommendations based on the tax plan...
    return this.prioritizeRecommendations(recommendations);
  }

  static prioritizeRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.potentialSavings - a.potentialSavings;
    });
  }
}
