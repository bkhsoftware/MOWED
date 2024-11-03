// calculators/RetirementCalculator.js
import { RetirementMonteCarloSimulator } from './RetirementMonteCarloSimulator';

export class RetirementCalculator {
  static calculate(input) {
    const {
      age,
      retirementAge,
      yearsInRetirement,
      retirementSavings,
      monthlyRetirementContribution,
      desiredRetirementIncome,
      taxOptimization = {},
      investmentRate
    } = input;

    const yearsUntilRetirement = retirementAge - age;
    const monthsUntilRetirement = yearsUntilRetirement * 12;

    // Get tax-optimized contribution strategies
    const { retirementAccounts = {}, timing = {} } = taxOptimization;
    
    // Calculate tax-adjusted retirement savings and contributions
    const adjustedSavings = this.calculateTaxAdjustedSavings(
      retirementSavings,
      retirementAccounts
    );

    const adjustedContributions = this.calculateTaxAdjustedContributions(
      monthlyRetirementContribution,
      retirementAccounts
    );

    // Calculate future retirement savings with tax considerations
    const retirementSavingsAtRetirement = this.calculateFutureRetirementSavings(
      adjustedSavings,
      adjustedContributions,
      monthsUntilRetirement,
      investmentRate,
      retirementAccounts
    );

    // Calculate tax-efficient retirement income
    const monthlyRetirementIncome = this.calculateTaxEfficientRetirementIncome(
      retirementSavingsAtRetirement,
      input.investmentRate / 12,
      yearsInRetirement * 12,
      timing
    );

    // Generate base retirement recommendations
    const baseRecommendations = this.generateBaseRecommendations(
      input,
      monthlyRetirementIncome,
      retirementSavingsAtRetirement
    );

    // Add Monte Carlo simulation with tax considerations
    const monteCarloResults = RetirementMonteCarloSimulator.runSimulation(input, {
      simulationCount: 1000,
      marketConditions: this.determineMarketConditions(input),
      confidenceLevels: [0.95, 0.75, 0.50],
      taxStrategies: this.generateTaxStrategies(retirementAccounts, timing)
    });

    return {
      yearsUntilRetirement,
      yearsInRetirement,
      retirementSavingsAtRetirement,
      monthlyRetirementIncome,
      desiredMonthlyRetirementIncome: desiredRetirementIncome / 12,
      retirementIncomeGap: (desiredRetirementIncome / 12) - monthlyRetirementIncome,
      savingsRate: (adjustedContributions.total / input.monthlyIncome) * 100,
      projectedCoverageRatio: monthlyRetirementIncome / (desiredRetirementIncome / 12),
      taxEfficiency: this.calculateTaxEfficiencyMetrics(
        adjustedContributions,
        retirementAccounts,
        timing
      ),
      additionalSavingsNeeded: this.calculateAdditionalSavingsNeeded(
        input,
        monthlyRetirementIncome,
        monthsUntilRetirement,
        retirementAccounts
      ),
      monteCarloAnalysis: monteCarloResults.analysis,
      simulationResults: monteCarloResults.simulations,
      successProbability: monteCarloResults.analysis.successRate,
      recommendations: [
        ...baseRecommendations,
        ...monteCarloResults.recommendations,
        ...this.generateTaxOptimizationRecommendations(
          input,
          retirementAccounts,
          timing
        )
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

  static calculateTaxAdjustedSavings(currentSavings, retirementAccounts) {
    const accountTypes = {
      traditional: { taxableAtWithdrawal: true, taxableNow: false },
      roth: { taxableAtWithdrawal: false, taxableNow: true },
      hsa: { taxableAtWithdrawal: false, taxableNow: false }
    };

    return Object.entries(retirementAccounts).reduce((acc, [accountId, account]) => {
      const type = account.type || 'traditional';
      const accountRules = accountTypes[type];

      return {
        ...acc,
        [accountId]: {
          balance: account.balance,
          taxableAtWithdrawal: accountRules.taxableAtWithdrawal,
          taxableNow: accountRules.taxableNow,
          effectiveBalance: account.balance * (accountRules.taxableAtWithdrawal ? 0.75 : 1)
        }
      };
    }, {
      total: currentSavings,
      effectiveTotal: this.calculateEffectiveTotal(currentSavings, retirementAccounts)
    });
  }

  static calculateEffectiveTotal(currentSavings, retirementAccounts) {
    // Calculate the total effective (tax-adjusted) value of all retirement savings
    const accountBalances = Object.entries(retirementAccounts).reduce((total, [, account]) => {
      const taxAdjustment = this.getTaxAdjustmentFactor(account.type);
      return total + (account.balance * taxAdjustment);
    }, 0);

    // Add any non-retirement savings
    const nonRetirementSavings = currentSavings - 
      Object.values(retirementAccounts).reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return accountBalances + nonRetirementSavings;
  }

  static getTaxAdjustmentFactor(accountType) {
    const factors = {
      traditional: 0.75, // Assuming 25% future tax rate
      roth: 1.0,        // Tax-free withdrawals
      hsa: 1.1,         // Tax-free for medical expenses + additional benefits
      taxable: 0.85     // Assumes long-term capital gains treatment
    };
    return factors[accountType] || 0.75;
  }

  static calculateTaxAdjustedContributions(monthlyContribution, retirementAccounts) {
    let totalContribution = 0;
    let totalTaxAdvantaged = 0;
    let totalEmployerMatch = 0;

    const contributions = Object.entries(retirementAccounts).reduce((acc, [accountId, account]) => {
      const contribution = Math.min(
        account.contribution / 12,
        (account.contributionLimit || Infinity) / 12
      );

      const employerMatch = this.calculateEmployerMatch(contribution, account);
      totalContribution += contribution + employerMatch;
      totalTaxAdvantaged += this.isTaxAdvantaged(account.type) ? contribution : 0;
      totalEmployerMatch += employerMatch;

      return {
        ...acc,
        [accountId]: {
          monthly: contribution,
          employerMatch,
          total: contribution + employerMatch,
          taxAdvantaged: this.isTaxAdvantaged(account.type)
        }
      };
    }, {});

    return {
      contributions,
      total: totalContribution,
      taxAdvantaged: totalTaxAdvantaged,
      employerMatch: totalEmployerMatch
    };
  }

  static calculateFutureRetirementSavings(
    adjustedSavings,
    adjustedContributions,
    months,
    monthlyRate,
    retirementAccounts
  ) {
    // Calculate growth for each account type separately
    const accountGrowth = Object.entries(retirementAccounts).reduce((acc, [accountId, account]) => {
      const initialBalance = adjustedSavings[accountId]?.balance || 0;
      const monthlyContribution = adjustedContributions.contributions[accountId]?.total || 0;
      const taxAdjustedRate = this.getTaxAdjustedRate(monthlyRate, account.type);

      const futureValue = this.calculateFutureValue(
        initialBalance,
        monthlyContribution,
        months,
        taxAdjustedRate
      );

      return {
        ...acc,
        [accountId]: {
          futureValue,
          taxAdjustedValue: this.getTaxAdjustedValue(futureValue, account.type)
        }
      };
    }, {});

    const total = Object.values(accountGrowth)
      .reduce((sum, account) => sum + account.futureValue, 0);

    const taxAdjustedTotal = Object.values(accountGrowth)
      .reduce((sum, account) => sum + account.taxAdjustedValue, 0);

    return {
      byAccount: accountGrowth,
      total,
      taxAdjustedTotal
    };
  }

  static calculateTaxEfficientRetirementIncome(
    savings,
    monthlyRate,
    monthsInRetirement,
    timing
  ) {
    const withdrawalOrder = this.determineOptimalWithdrawalOrder(savings.byAccount, timing);
    let totalMonthlyIncome = 0;

    withdrawalOrder.forEach(({ accountId, portion }) => {
      const accountSavings = savings.byAccount[accountId];
      const taxAdjustedRate = this.getTaxAdjustedWithdrawalRate(monthlyRate, accountId, timing);

      const monthlyIncome = this.calculateSafeWithdrawal(
        accountSavings.futureValue * portion,
        taxAdjustedRate,
        monthsInRetirement
      );

      totalMonthlyIncome += monthlyIncome;
    });

    return totalMonthlyIncome;
  }

  static getTaxAdjustedWithdrawalRate(monthlyRate, accountId, timing) {
    const { withdrawalTaxRate = 0.25 } = timing;
    const baseRate = monthlyRate * (1 - withdrawalTaxRate);
    
    // Adjust based on withdrawal timing and tax brackets
    const bracketAdjustment = this.calculateBracketAdjustment(timing);
    return baseRate * bracketAdjustment;
  }

  static calculateBracketAdjustment(timing) {
    const { projectedBrackets = [], targetBracket = 0.22 } = timing;
    if (!projectedBrackets.length) return 1;

    // Calculate adjustment based on difference between current and target brackets
    const avgProjectedRate = projectedBrackets.reduce((sum, rate) => sum + rate, 0) / 
                           projectedBrackets.length;
    return 1 + (targetBracket - avgProjectedRate);
  }

  static calculateTaxEfficiencyMetrics(contributions, retirementAccounts, timing) {
    return {
      currentTaxSavings: this.calculateCurrentTaxSavings(contributions, retirementAccounts),
      projectedTaxSavings: this.calculateProjectedTaxSavings(retirementAccounts, timing),
      taxDiversification: this.calculateTaxDiversification(retirementAccounts),
      withdrawalEfficiency: this.calculateWithdrawalEfficiency(retirementAccounts, timing)
    };
  }

  static calculateWithdrawalEfficiency(retirementAccounts, timing) {
    const withdrawalPlan = this.generateWithdrawalPlan(retirementAccounts, timing);
    const taxImpact = this.calculateWithdrawalTaxImpact(withdrawalPlan, timing);

    return {
      efficiency: taxImpact.efficiency,
      potentialSavings: taxImpact.potentialSavings,
      optimalWithdrawalMix: this.calculateOptimalWithdrawalMix(withdrawalPlan, timing),
      bracketManagement: this.generateBracketManagementStrategy(withdrawalPlan, timing)
    };
  }

  static generateWithdrawalPlan(retirementAccounts, timing) {
    const withdrawalPhases = this.defineWithdrawalPhases(retirementAccounts, timing);
    const rmdRequirements = this.calculateRMDRequirements(retirementAccounts, timing);
    
    const plan = withdrawalPhases.map(phase => ({
      ...phase,
      withdrawalStrategy: this.generatePhaseStrategy(phase, rmdRequirements, timing),
      taxImplications: this.calculatePhaseImplications(phase, timing),
      flexibilityOptions: this.identifyFlexibilityOptions(phase, timing)
    }));

    return {
      phases: plan,
      totalWithdrawals: this.calculateTotalWithdrawals(plan),
      taxEfficiency: this.calculatePlanEfficiency(plan, timing),
      rmdCompliance: this.verifyRMDCompliance(plan, rmdRequirements)
    };
  }

  static defineWithdrawalPhases(retirementAccounts, timing) {
    const { retirementAge = 65, lifeExpectancy = 90 } = timing;
    
    return [
      {
        name: 'Early Retirement',
        startAge: retirementAge,
        endAge: Math.min(70.5, lifeExpectancy),
        priority: 'Tax Bracket Management',
        accounts: this.determineEarlyPhaseAccounts(retirementAccounts)
      },
      {
        name: 'RMD Phase',
        startAge: 70.5,
        endAge: Math.min(80, lifeExpectancy),
        priority: 'RMD Compliance',
        accounts: this.determineRMDPhaseAccounts(retirementAccounts)
      },
      {
        name: 'Late Retirement',
        startAge: 80,
        endAge: lifeExpectancy,
        priority: 'Longevity Protection',
        accounts: this.determineLatePhaseAccounts(retirementAccounts)
      }
    ];
  }

  static generatePhaseStrategy(phase, rmdRequirements, timing) {
    const baseWithdrawals = this.calculateBaseWithdrawals(phase, timing);
    const rmdAdjustedWithdrawals = this.adjustForRMDs(baseWithdrawals, rmdRequirements, phase);
    
    return {
      primaryAccounts: this.prioritizeAccounts(phase.accounts, timing),
      withdrawalSequence: this.optimizeWithdrawalSequence(rmdAdjustedWithdrawals, timing),
      monthlyWithdrawals: this.distributeMonthlyWithdrawals(rmdAdjustedWithdrawals),
      contingencyPlans: this.generateContingencyPlans(phase, timing)
    };
  }

  static calculateBaseWithdrawals(phase, timing) {
    const { targetIncome = 0, inflationRate = 0.02 } = timing;
    const yearlyWithdrawals = {};
    
    Object.entries(phase.accounts).forEach(([accountId, account]) => {
      const withdrawalRate = this.determineWithdrawalRate(account, phase, timing);
      const baseAmount = account.balance * withdrawalRate;
      
      yearlyWithdrawals[accountId] = {
        baseAmount,
        adjustedAmount: this.adjustForInflation(baseAmount, phase, inflationRate),
        taxableAmount: this.calculateTaxableAmount(baseAmount, account.type)
      };
    });

    return yearlyWithdrawals;
  }

  static adjustForRMDs(baseWithdrawals, rmdRequirements, phase) {
    if (phase.startAge < 70.5) return baseWithdrawals;

    const adjustedWithdrawals = { ...baseWithdrawals };
    
    Object.entries(rmdRequirements).forEach(([accountId, rmd]) => {
      if (adjustedWithdrawals[accountId]) {
        const currentWithdrawal = adjustedWithdrawals[accountId].adjustedAmount;
        adjustedWithdrawals[accountId] = {
          ...adjustedWithdrawals[accountId],
          adjustedAmount: Math.max(currentWithdrawal, rmd.amount),
          rmdRequired: rmd.amount,
          rmdExcess: Math.max(0, currentWithdrawal - rmd.amount)
        };
      }
    });

    return adjustedWithdrawals;
  }

  static calculateRMDRequirements(retirementAccounts, timing) {
    const rmdAccounts = Object.entries(retirementAccounts)
      .filter(([, account]) => this.isRMDRequired(account.type));

    return rmdAccounts.reduce((requirements, [accountId, account]) => {
      requirements[accountId] = {
        amount: this.calculateRMDAmount(account, timing),
        startAge: 70.5,
        penalties: this.calculateRMDPenalties(account, timing),
        strategies: this.generateRMDStrategies(account, timing)
      };
      return requirements;
    }, {});
  }

  static calculateRMDAmount(account, timing) {
    const { age = 70.5 } = timing;
    const distributionPeriod = this.getRMDDistributionPeriod(age);
    return account.balance / distributionPeriod;
  }

  static getRMDDistributionPeriod(age) {
    // IRS Uniform Lifetime Table (2022 and later)
    const rmdTable = {
      70: 27.4,
      71: 26.5,
      72: 25.6,
      73: 24.7,
      74: 23.8,
      75: 22.9,
      76: 22.0,
      77: 21.2,
      78: 20.3,
      79: 19.5,
      80: 18.7,
      81: 17.9,
      82: 17.1,
      83: 16.3,
      84: 15.5,
      85: 14.8,
      86: 14.1,
      87: 13.4,
      88: 12.7,
      89: 12.0,
      90: 11.4,
      91: 10.8,
      92: 10.2,
      93: 9.6,
      94: 9.1,
      95: 8.6,
      96: 8.1,
      97: 7.6,
      98: 7.1,
      99: 6.7,
      100: 6.3,
      101: 5.9,
      102: 5.5,
      103: 5.2,
      104: 4.9,
      105: 4.5,
      106: 4.2,
      107: 3.9,
      108: 3.7,
      109: 3.4,
      110: 3.1,
      111: 2.9,
      112: 2.6,
      113: 2.4,
      114: 2.1,
      115: 1.9,
      116: 1.7,
      117: 1.5,
      118: 1.4,
      119: 1.2,
      120: 1.1
    };
    
    // Handle ages outside the table
    if (age < 70) {
      return rmdTable[70]; // Use age 70 distribution period for younger ages
    } else if (age > 120) {
      return rmdTable[120]; // Use age 120 distribution period for older ages
    }

    // For ages with decimals, interpolate between the two nearest whole ages
    const lowerAge = Math.floor(age);
    const upperAge = Math.ceil(age);
    
    if (lowerAge === upperAge) {
      return rmdTable[lowerAge];
    }

    // Linear interpolation
    const fraction = age - lowerAge;
    const lowerPeriod = rmdTable[lowerAge];
    const upperPeriod = rmdTable[upperAge];
    return lowerPeriod + (upperPeriod - lowerPeriod) * fraction;
  }

  static calculateWithdrawalTaxImpact(withdrawalPlan, timing) {
    const { effectiveTaxRate = 0.25, stateTaxRate = 0 } = timing;
    let totalTaxableWithdrawals = 0;
    let totalTaxExemptWithdrawals = 0;
    let potentialTaxSavings = 0;

    withdrawalPlan.phases.forEach(phase => {
      const phaseImpact = this.calculatePhaseWithdrawalTaxImpact(phase, timing);
      totalTaxableWithdrawals += phaseImpact.taxableWithdrawals;
      totalTaxExemptWithdrawals += phaseImpact.taxExemptWithdrawals;
      potentialTaxSavings += phaseImpact.potentialSavings;
    });

    const totalWithdrawals = totalTaxableWithdrawals + totalTaxExemptWithdrawals;
    const effectiveWithdrawalRate = totalTaxableWithdrawals * (effectiveTaxRate + stateTaxRate);

    return {
      efficiency: 1 - (effectiveWithdrawalRate / totalWithdrawals),
      totalTaxableWithdrawals,
      totalTaxExemptWithdrawals,
      effectiveWithdrawalRate,
      potentialSavings,
      optimizationStrategies: this.generateTaxOptimizationStrategies(withdrawalPlan, timing)
    };
  }

  static calculatePhaseWithdrawalTaxImpact(phase, timing) {
    const { taxBrackets = [], stateTaxRate = 0 } = timing;
    let taxableWithdrawals = 0;
    let taxExemptWithdrawals = 0;
    let potentialSavings = 0;

    phase.withdrawalStrategy.withdrawalSequence.forEach(withdrawal => {
      const { amount, accountType } = withdrawal;
      if (this.isTaxableWithdrawal(accountType)) {
        taxableWithdrawals += amount;
        potentialSavings += this.calculatePotentialTaxSavings(amount, taxBrackets, stateTaxRate);
      } else {
        taxExemptWithdrawals += amount;
      }
    });

    return {
      taxableWithdrawals,
      taxExemptWithdrawals,
      potentialSavings,
      effectiveRate: this.calculateEffectiveWithdrawalRate(taxableWithdrawals, taxExemptWithdrawals, timing)
    };
  }

  static calculateOptimalWithdrawalMix(withdrawalPlan, timing) {
    const taxBracketLimits = this.getCurrentTaxBracketLimits(timing);
    const requiredWithdrawals = this.calculateRequiredWithdrawals(withdrawalPlan);
    
    return {
      traditional: this.optimizeTraditionalWithdrawals(requiredWithdrawals, taxBracketLimits),
      roth: this.optimizeRothWithdrawals(requiredWithdrawals, taxBracketLimits),
      taxable: this.optimizeTaxableWithdrawals(requiredWithdrawals, taxBracketLimits),
      sequence: this.generateOptimalSequence(requiredWithdrawals, taxBracketLimits),
      monthlyDistribution: this.generateMonthlyDistribution(requiredWithdrawals, timing)
    };
  }

  static generateBracketManagementStrategy(withdrawalPlan, timing) {
    const brackets = this.analyzeTaxBrackets(timing);
    const opportunities = this.identifyBracketOpportunities(withdrawalPlan, brackets);
    
    return {
      targetBrackets: this.determineBracketTargets(brackets),
      fillingStrategy: this.generateBracketFillingStrategy(opportunities),
      conversionOpportunities: this.identifyConversionOpportunities(opportunities),
      annualAdjustments: this.generateAnnualAdjustments(withdrawalPlan, brackets),
      contingencies: this.generateBracketContingencies(brackets)
    };
  }

  static isTaxableWithdrawal(accountType) {
    return ['traditional', 'taxable'].includes(accountType.toLowerCase());
  }

  static isRMDRequired(accountType) {
    return ['traditional', '401k', 'ira'].includes(accountType.toLowerCase());
  }

  static determineWithdrawalRate(account, phase, timing) {
    const baseRate = 0.04; // 4% rule as starting point
    const ageAdjustment = this.calculateAgeAdjustment(phase.startAge);
    const marketAdjustment = this.calculateMarketAdjustment(timing);
    const inflationAdjustment = this.calculateInflationAdjustment(timing);

    return baseRate * ageAdjustment * marketAdjustment * inflationAdjustment;
  }

  static distributeMonthlyWithdrawals(yearlyWithdrawals) {
    return Object.entries(yearlyWithdrawals).reduce((monthly, [accountId, withdrawal]) => {
      monthly[accountId] = {
        amount: withdrawal.adjustedAmount / 12,
        taxableAmount: withdrawal.taxableAmount / 12,
        rmdRequired: withdrawal.rmdRequired ? withdrawal.rmdRequired / 12 : 0
      };
      return monthly;
    }, {});
  }

  static calculateCurrentTaxSavings(contributions, retirementAccounts) {
    const { taxAdvantaged, employerMatch } = contributions;
    const avgMarginalRate = this.calculateAverageMarginalRate(retirementAccounts);

    return {
      contributionSavings: taxAdvantaged * avgMarginalRate,
      employerBenefits: employerMatch,
      totalAnnualBenefit: (taxAdvantaged * avgMarginalRate) + employerMatch,
      effectiveRate: this.calculateEffectiveSavingsRate(contributions, avgMarginalRate)
    };
  }

  static calculateEffectiveSavingsRate(contributions, marginalRate) {
    const { total, taxAdvantaged } = contributions;
    if (total === 0) return 0;
    
    const taxSavings = taxAdvantaged * marginalRate;
    return taxSavings / total;
  }

  static calculateAverageMarginalRate(retirementAccounts) {
    // Calculate weighted average marginal rate based on account balances
    const totalBalance = Object.values(retirementAccounts)
      .reduce((sum, account) => sum + (account.balance || 0), 0);

    const weightedRates = Object.values(retirementAccounts)
      .reduce((sum, account) => {
        const weight = account.balance / totalBalance;
        return sum + (weight * (account.marginalRate || 0.25));
      }, 0);

    return weightedRates || 0.25; // Default to 25% if no data
  }

  static calculateProjectedTaxSavings(retirementAccounts, timing) {
    const projectedWithdrawals = this.projectWithdrawals(retirementAccounts, timing);
    const taxSavings = this.calculateWithdrawalTaxSavings(projectedWithdrawals, timing);

    return {
      annualSavings: taxSavings.annual,
      lifetimeSavings: taxSavings.lifetime,
      optimizationPotential: taxSavings.potential,
      recommendedStrategies: this.generateTaxSavingStrategies(projectedWithdrawals, timing)
    };
  }

  static generateTaxStrategies(retirementAccounts, timing) {
    return {
      contributionStrategy: this.generateContributionStrategy(retirementAccounts),
      withdrawalStrategy: this.generateWithdrawalStrategy(retirementAccounts, timing),
      conversionStrategy: this.generateConversionStrategy(retirementAccounts, timing),
      taxBracketManagement: this.generateTaxBracketStrategy(timing)
    };
  }

  static generateTaxOptimizationRecommendations(input, retirementAccounts, timing) {
    const recommendations = [];

    // Check contribution optimization opportunities
    if (this.hasUnusedTaxAdvantagesSpace(retirementAccounts)) {
      recommendations.push({
        priority: 'high',
        category: 'tax_optimization',
        suggestion: 'Maximize tax-advantaged contributions',
        impact: this.calculateTaxAdvantageImpact(input, retirementAccounts)
      });
    }

    // Check Roth conversion opportunities
    if (this.shouldConsiderRothConversion(input, timing)) {
      recommendations.push({
        priority: 'medium',
        category: 'tax_optimization',
        suggestion: 'Consider Roth conversion strategy',
        impact: this.calculateRothConversionImpact(input, timing)
      });
    }

    // Check tax diversification
    const diversification = this.calculateTaxDiversification(retirementAccounts);
    if (diversification.score < 0.7) {
      recommendations.push({
        priority: 'medium',
        category: 'tax_diversification',
        suggestion: 'Improve tax diversification of retirement accounts',
        impact: this.calculateDiversificationImpact(diversification)
      });
    }

    return recommendations;
  }

  // Helper methods
  static shouldConsiderRothConversion(input, timing) {
    const { age, retirementAge, marginalRate = 0.25 } = input;
    const { projectedBrackets = [] } = timing;

    // Check if current tax rate is lower than projected retirement tax rate
    const avgFutureRate = projectedBrackets.reduce((sum, rate) => sum + rate, 0) / 
                         projectedBrackets.length;
    
    return age < retirementAge && marginalRate < avgFutureRate;
  }

  static hasUnusedTaxAdvantagesSpace(retirementAccounts) {
    return Object.values(retirementAccounts).some(account => {
      const { contribution = 0, contributionLimit = Infinity } = account;
      return contribution < contributionLimit;
    });
  }

  static calculateTaxDiversification(retirementAccounts) {
    const balancesByType = this.categorizeAccountBalances(retirementAccounts);
    const totalBalance = Object.values(balancesByType).reduce((sum, val) => sum + val, 0);
    
    // Calculate diversification scores
    const scores = {
      traditional: this.calculateDiversificationScore(balancesByType.traditional, totalBalance),
      roth: this.calculateDiversificationScore(balancesByType.roth, totalBalance),
      hsa: this.calculateDiversificationScore(balancesByType.hsa, totalBalance)
    };

    return {
      score: this.calculateOverallDiversificationScore(scores),
      breakdown: scores,
      recommendations: this.generateDiversificationRecommendations(scores)
    };
  }

  static isTaxAdvantaged(accountType) {
    return ['traditional', 'roth', 'hsa'].includes(accountType);
  }

  static calculateEmployerMatch(contribution, account) {
    if (!account.employerMatch) return 0;
    const { rate, limit } = account.employerMatch;
    const matchableContribution = Math.min(contribution, (limit / 100) * account.salary);
    return matchableContribution * (rate / 100);
  }

  static getTaxAdjustedRate(baseRate, accountType) {
    const taxAdjustments = {
      traditional: 1,
      roth: 0.85, // Assuming 15% tax advantage
      hsa: 1.15 // Assuming additional 15% benefit
    };
    return baseRate * (taxAdjustments[accountType] || 1);
  }

  static getTaxAdjustedValue(value, accountType) {
    const taxFactors = {
      traditional: 0.75, // Assuming 25% future tax rate
      roth: 1,
      hsa: 1
    };
    return value * (taxFactors[accountType] || 0.75);
  }

  static calculateFutureValue(principal, monthlyContribution, months, monthlyRate) {
    return principal * Math.pow(1 + monthlyRate, months) +
           monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  static determineOptimalWithdrawalOrder(accounts, timing) {
    // Implementation of optimal withdrawal sequencing algorithm
    // This would consider tax brackets, RMD requirements, etc.
    // Returns array of { accountId, portion } objects
    return [];
  }

  static calculateSafeWithdrawal(principal, monthlyRate, months) {
    // Implementation of dynamic safe withdrawal calculation
    // This would consider market conditions, tax implications, etc.
    return 0;
  }

  // Old methods, might not be needed
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

  static categorizeAccountBalances(retirementAccounts) {
    return Object.entries(retirementAccounts).reduce((acc, [, account]) => {
      const type = account.type || 'traditional';
      acc[type] = (acc[type] || 0) + (account.balance || 0);
      return acc;
    }, {
      traditional: 0,
      roth: 0,
      hsa: 0
    });
  }

  static calculateDiversificationScore(balance, totalBalance) {
    if (totalBalance === 0) return 0;
    const ratio = balance / totalBalance;
    
    // Optimal ranges for each account type
    const optimalRanges = {
      traditional: { min: 0.4, max: 0.6 },
      roth: { min: 0.2, max: 0.4 },
      hsa: { min: 0.1, max: 0.2 }
    };

    // Calculate score based on how close to optimal range
    return Math.min(1, ratio / optimalRanges[type]?.max || 0);
  }

  static calculateOverallDiversificationScore(scores) {
    const weights = {
      traditional: 0.4,
      roth: 0.4,
      hsa: 0.2
    };

    return Object.entries(scores).reduce((total, [type, score]) => 
      total + score * weights[type], 0);
  }

  static generateDiversificationRecommendations(scores) {
    const recommendations = [];
    const targetScores = {
      traditional: 0.5,
      roth: 0.3,
      hsa: 0.2
    };

    Object.entries(scores).forEach(([type, score]) => {
      const gap = targetScores[type] - score;
      if (gap > 0.1) {
        recommendations.push({
          accountType: type,
          suggestion: `Increase ${type} allocation`,
          targetAllocation: `${(targetScores[type] * 100).toFixed(1)}%`,
          priority: gap > 0.2 ? 'high' : 'medium'
        });
      }
    });

    return recommendations;
  }

  static calculateTaxAdvantageImpact(input, retirementAccounts) {
    const unusedSpace = Object.values(retirementAccounts).reduce((total, account) => {
      const remainingSpace = (account.contributionLimit || 0) - (account.contribution || 0);
      return total + Math.max(0, remainingSpace);
    }, 0);

    const marginalRate = input.marginalRate || 0.25;
    const potentialAnnualSavings = unusedSpace * marginalRate;

    return `Potential annual tax savings of $${potentialAnnualSavings.toFixed(2)}`;
  }

  static calculateRothConversionImpact(input, timing) {
    const { marginalRate = 0.25 } = input;
    const { projectedBrackets = [] } = timing;
    
    const avgFutureRate = projectedBrackets.reduce((sum, rate) => sum + rate, 0) / 
                         projectedBrackets.length;
    
    const taxSavings = Math.max(0, avgFutureRate - marginalRate);
    return `Potential lifetime tax savings of ${(taxSavings * 100).toFixed(1)}% on converted amounts`;
  }

  static calculateAgeAdjustment(startAge) {
    // Adjust withdrawal rate based on starting age
    if (startAge < 60) return 0.9;  // More conservative for early retirement
    if (startAge > 75) return 1.1;  // More aggressive for later retirement
    return 1.0;
  }

  static calculateMarketAdjustment(timing) {
    const { marketConditions = 'normal' } = timing;
    const adjustments = {
      bull: 1.1,    // More aggressive in bull markets
      normal: 1.0,  // Standard rate in normal markets
      bear: 0.9     // More conservative in bear markets
    };
    return adjustments[marketConditions] || 1.0;
  }

  static calculateInflationAdjustment(timing) {
    const { inflationRate = 0.02 } = timing;
    // Adjust withdrawal rate based on inflation expectations
    if (inflationRate > 0.04) return 0.9;  // More conservative in high inflation
    if (inflationRate < 0.02) return 1.1;  // More aggressive in low inflation
    return 1.0;
  }

  static calculateTaxableAmount(amount, accountType) {
    const taxableRatios = {
      traditional: 1.0,  // Fully taxable
      roth: 0.0,        // Tax-free
      hsa: 0.0,         // Tax-free for qualified expenses
      taxable: 0.85     // Assumes 15% qualified dividend/long-term capital gains
    };
    return amount * (taxableRatios[accountType] || 1.0);
  }

  static calculatePotentialTaxSavings(amount, taxBrackets, stateTaxRate) {
    const currentBracket = this.determineCurrentTaxBracket(amount, taxBrackets);
    const optimalBracket = this.determineOptimalTaxBracket(amount, taxBrackets);
    return amount * Math.max(0, (currentBracket + stateTaxRate) - optimalBracket);
  }

  static determineCurrentTaxBracket(amount, taxBrackets) {
    for (const bracket of taxBrackets) {
      if (amount <= bracket.limit) return bracket.rate;
    }
    return taxBrackets[taxBrackets.length - 1]?.rate || 0.25;
  }

  static determineOptimalTaxBracket(amount, taxBrackets) {
    // Find the lowest bracket that can accommodate the withdrawal
    for (const bracket of taxBrackets) {
      if (bracket.limit >= amount) return bracket.rate;
    }
    return taxBrackets[0]?.rate || 0.12;
  }

  static determineEarlyPhaseAccounts(retirementAccounts) {
    // Prioritize taxable and Roth accounts in early retirement
    return Object.entries(retirementAccounts).reduce((acc, [id, account]) => {
      if (['taxable', 'roth'].includes(account.type?.toLowerCase())) {
        acc[id] = account;
      }
      return acc;
    }, {});
  }

  static determineRMDPhaseAccounts(retirementAccounts) {
    // Focus on traditional accounts subject to RMDs
    return Object.entries(retirementAccounts).reduce((acc, [id, account]) => {
      if (this.isRMDRequired(account.type)) {
        acc[id] = account;
      }
      return acc;
    }, {});
  }

  static determineLatePhaseAccounts(retirementAccounts) {
    // Prioritize accounts with the most favorable tax treatment
    return Object.entries(retirementAccounts).reduce((acc, [id, account]) => {
      const taxEfficiency = this.getTaxAdjustmentFactor(account.type);
      if (taxEfficiency >= 0.9) {
        acc[id] = account;
      }
      return acc;
    }, {});
  }

  static adjustForInflation(amount, phase, inflationRate) {
    const years = phase.endAge - phase.startAge;
    return amount * Math.pow(1 + inflationRate, years);
  }

  static projectWithdrawals(retirementAccounts, timing) {
    const { retirementAge = 65, lifeExpectancy = 90 } = timing;
    const projectionYears = lifeExpectancy - retirementAge;
    
    const yearlyProjections = Array.from({ length: projectionYears }, (_, year) => {
      const age = retirementAge + year;
      const withdrawals = this.projectYearWithdrawals(retirementAccounts, age, timing);
      return {
        age,
        withdrawals,
        rmdImpact: this.calculateRMDImpact(withdrawals, age),
        taxableAmount: this.calculateYearlyTaxableAmount(withdrawals),
        taxBracket: this.projectTaxBracket(withdrawals, timing)
      };
    });

    return {
      yearlyProjections,
      summary: this.summarizeWithdrawalProjections(yearlyProjections),
      recommendations: this.generateWithdrawalRecommendations(yearlyProjections, timing)
    };
  }

  static projectYearWithdrawals(accounts, age, timing) {
    return Object.entries(accounts).reduce((withdrawals, [accountId, account]) => {
      const baseAmount = this.calculateBaseWithdrawalAmount(account, age, timing);
      const rmdAmount = age >= 70.5 ? this.calculateRMDAmount({ ...account, age }, timing) : 0;
      
      withdrawals[accountId] = {
        baseAmount,
        rmdAmount,
        totalAmount: Math.max(baseAmount, rmdAmount),
        taxableAmount: this.calculateTaxableAmount(
          Math.max(baseAmount, rmdAmount),
          account.type
        )
      };
      
      return withdrawals;
    }, {});
  }

  static calculateBaseWithdrawalAmount(account, age, timing) {
    const { balance = 0 } = account;
    const withdrawalRate = this.determineWithdrawalRate(
      account,
      { startAge: age },
      timing
    );
    return balance * withdrawalRate;
  }

  static calculateWithdrawalTaxSavings(projectedWithdrawals, timing) {
    let annualSavings = 0;
    let lifetimeSavings = 0;
    let potential = 0;

    projectedWithdrawals.yearlyProjections.forEach(year => {
      const optimalTax = this.calculateOptimalTaxForYear(year.withdrawals, timing);
      const projectedTax = this.calculateProjectedTaxForYear(year.withdrawals, timing);
      const yearSavings = Math.max(0, projectedTax - optimalTax);
      
      annualSavings = Math.max(annualSavings, yearSavings);
      lifetimeSavings += yearSavings;
      potential += this.calculatePotentialAdditionalSavings(year.withdrawals, timing);
    });

    return {
      annual: annualSavings,
      lifetime: lifetimeSavings,
      potential
    };
  }

  static calculateOptimalTaxForYear(withdrawals, timing) {
    const { taxBrackets = [], standardDeduction = 12950 } = timing;
    const totalTaxable = Object.values(withdrawals)
      .reduce((sum, w) => sum + w.taxableAmount, 0);
    
    return this.calculateTaxFromBrackets(
      Math.max(0, totalTaxable - standardDeduction),
      taxBrackets
    );
  }

  static calculateProjectedTaxForYear(withdrawals, timing) {
    const { taxBrackets = [], standardDeduction = 12950, stateTaxRate = 0 } = timing;
    const totalTaxable = Object.values(withdrawals)
      .reduce((sum, w) => sum + w.taxableAmount, 0);
    
    const federalTax = this.calculateTaxFromBrackets(
      Math.max(0, totalTaxable - standardDeduction),
      taxBrackets
    );
    const stateTax = totalTaxable * stateTaxRate;
    
    return federalTax + stateTax;
  }

  static calculateTaxFromBrackets(taxableIncome, brackets) {
    let tax = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;

    for (const bracket of brackets) {
      const bracketIncome = Math.min(
        remainingIncome,
        bracket.limit - previousLimit
      );
      if (bracketIncome <= 0) break;

      tax += bracketIncome * bracket.rate;
      remainingIncome -= bracketIncome;
      previousLimit = bracket.limit;
    }

    // Handle income above highest bracket
    if (remainingIncome > 0 && brackets.length > 0) {
      tax += remainingIncome * brackets[brackets.length - 1].rate;
    }

    return tax;
  }

  static calculatePotentialAdditionalSavings(withdrawals, timing) {
    const currentTax = this.calculateProjectedTaxForYear(withdrawals, timing);
    const optimizedWithdrawals = this.optimizeWithdrawalTiming(withdrawals, timing);
    const optimizedTax = this.calculateProjectedTaxForYear(optimizedWithdrawals, timing);
    
    return Math.max(0, currentTax - optimizedTax);
  }

  static optimizeWithdrawalTiming(withdrawals, timing) {
    // Clone withdrawals for optimization
    const optimized = JSON.parse(JSON.stringify(withdrawals));
    const { taxBrackets = [] } = timing;
    
    if (!taxBrackets.length) return optimized;

    // Try to optimize withdrawals to stay within lower tax brackets
    const targetBracket = taxBrackets[Math.floor(taxBrackets.length / 2)];
    const targetAnnualWithdrawal = targetBracket.limit * 0.9; // 90% of bracket limit
    
    let totalWithdrawals = Object.values(optimized)
      .reduce((sum, w) => sum + w.totalAmount, 0);
    
    // Adjust withdrawals to target amount
    if (totalWithdrawals > targetAnnualWithdrawal) {
      const adjustmentFactor = targetAnnualWithdrawal / totalWithdrawals;
      Object.values(optimized).forEach(w => {
        w.totalAmount *= adjustmentFactor;
        w.taxableAmount = this.calculateTaxableAmount(w.totalAmount, w.type);
      });
    }

    return optimized;
  }

  static calculateRMDPenalties(account, timing) {
    const requiredRMD = this.calculateRMDAmount(account, timing);
    const projectedWithdrawal = this.projectYearWithdrawals(
      { [account.id]: account },
      timing.age,
      timing
    )[account.id].totalAmount;

    if (projectedWithdrawal < requiredRMD) {
      const shortfall = requiredRMD - projectedWithdrawal;
      return {
        shortfall,
        penalty: shortfall * 0.5, // 50% penalty on RMD shortfall
        explanations: [
          `Required RMD: $${requiredRMD.toFixed(2)}`,
          `Projected withdrawal: $${projectedWithdrawal.toFixed(2)}`,
          `Shortfall: $${shortfall.toFixed(2)}`,
          'IRS penalty rate: 50%'
        ]
      };
    }

    return {
      shortfall: 0,
      penalty: 0,
      explanations: ['RMD requirement met']
    };
  }

  static generateRMDStrategies(account, timing) {
    return {
      requiredAmount: this.calculateRMDAmount(account, timing),
      withdrawalTiming: this.recommendRMDTiming(account, timing),
      taxEfficiency: this.analyzeRMDTaxEfficiency(account, timing),
      reinvestmentOptions: this.generateReinvestmentRecommendations(account, timing)
    };
  }

  static recommendRMDTiming(account, timing) {
    const { taxBrackets = [] } = timing;
    const rmdAmount = this.calculateRMDAmount(account, timing);
    
    // Analyze tax implications of different withdrawal timings
    const timingOptions = [
      { month: 'January', benefit: 'Maximizes reinvestment time' },
      { month: 'December', benefit: 'Maximizes tax-deferred growth' },
      { month: 'Quarterly', benefit: 'Balances tax impact and cash flow' }
    ];

    // Recommend based on amount and tax brackets
    const recommendedTiming = rmdAmount > taxBrackets[1]?.limit ? 
      'Quarterly' : 'December';

    return {
      recommendedTiming,
      options: timingOptions,
      rationale: `Based on RMD amount of $${rmdAmount.toFixed(2)} and tax bracket analysis`
    };
  }

  static generateReinvestmentRecommendations(account, timing) {
    const rmdAmount = this.calculateRMDAmount(account, timing);
    
    return [
      {
        strategy: 'Tax-Efficient Accounts',
        description: 'Reinvest in Roth or taxable accounts for tax diversity',
        suitability: 'High'
      },
      {
        strategy: 'Income Focus',
        description: 'Direct to high-quality dividend stocks or bonds',
        suitability: rmdAmount > 50000 ? 'High' : 'Medium'
      },
      {
        strategy: 'Charitable Giving',
        description: 'Consider Qualified Charitable Distributions',
        suitability: account.type === 'traditional' ? 'High' : 'Low'
      }
    ];
  }

  static generateContingencyPlans(phase, timing) {
    return {
      marketDownturn: this.generateMarketDownturnPlan(phase, timing),
      highInflation: this.generateInflationProtectionPlan(phase, timing),
      healthCare: this.generateHealthCarePlan(phase, timing),
      taxChanges: this.generateTaxChangePlan(phase, timing)
    };
  }

  static generateMarketDownturnPlan(phase, timing) {
    return {
      triggerConditions: 'Market decline > 20%',
      actions: [
        'Reduce withdrawal rate by 10%',
        'Prioritize withdrawals from stable assets',
        'Review asset allocation'
      ],
      recovery: 'Resume normal withdrawals when market recovers to previous peak'
    };
  }

  static generateInflationProtectionPlan(phase, timing) {
    return {
      triggerConditions: 'Inflation > 5% annually',
      actions: [
        'Increase allocation to inflation-protected securities',
        'Review withdrawal rate sustainability',
        'Prioritize essential expenses'
      ],
      review: 'Quarterly inflation impact assessment'
    };
  }

  static calculateEffectiveWithdrawalRate(taxableWithdrawals, taxExemptWithdrawals, timing) {
    const totalWithdrawals = taxableWithdrawals + taxExemptWithdrawals;
    if (totalWithdrawals === 0) return 0;

    const { effectiveTaxRate = 0.25, stateTaxRate = 0 } = timing;
    const totalTaxRate = effectiveTaxRate + stateTaxRate;

    return (taxableWithdrawals * totalTaxRate) / totalWithdrawals;
  }

  // Add other helper methods as needed...
}

