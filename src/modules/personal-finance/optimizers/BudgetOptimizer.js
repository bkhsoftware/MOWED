export class BudgetOptimizer {
  static optimize(params) {
    const {
      monthlyIncome,
      currentBudget,
      savingsGoal,
      debtInfo,
      preferences = {},
      constraints = {},
      taxConsiderations = {} // New parameter
    } = params;

    // Default weights with tax considerations
    const weights = {
      savingsWeight: preferences.savingsWeight || 0.4,
      debtWeight: preferences.debtWeight || 0.3,
      lifestyleWeight: preferences.lifestyleWeight || 0.3,
      taxEfficiencyWeight: preferences.taxEfficiencyWeight || 0.2 // New weight
    };

    // Calculate tax-adjusted saving potential
    const taxAdjustedSavings = this.calculateTaxAdjustedSavings(
      monthlyIncome, 
      taxConsiderations
    );

    // Calculate tax-efficient debt payments
    const taxEfficientDebtPayments = this.calculateTaxEfficientDebtPayments(
      debtInfo,
      taxConsiderations
    );

    // Minimum percentages for essential categories
    const minPercentages = {
      Housing: 25,
      Food: 10,
      Utilities: 5,
      Healthcare: 5,
      ...constraints.minimums
    };

    // Maximum percentages for discretionary categories
    const maxPercentages = {
      Entertainment: 10,
      Personal: 10,
      ...constraints.maximums
    };

    // Calculate saving priority based on tax advantages
    const savingsPriority = this.calculateSavingsPriority(
      savingsGoal,
      currentBudget.Savings,
      taxConsiderations
    );

    // Adjust weights based on tax efficiency
    const adjustedWeights = this.adjustWeightsForTaxEfficiency(
      weights,
      taxConsiderations,
      savingsPriority
    );

    // Initialize optimized budget with current allocations
    let optimizedBudget = { ...currentBudget };

    // Ensure minimum requirements are met first
    optimizedBudget = this.enforceMinimumRequirements(optimizedBudget, minPercentages);

    // Optimize tax-advantaged categories first
    optimizedBudget = this.optimizeTaxAdvantaged(
      optimizedBudget,
      taxConsiderations,
      monthlyIncome
    );

    // Optimize remaining discretionary spending
    optimizedBudget = this.optimizeDiscretionarySpending(
      optimizedBudget,
      maxPercentages,
      adjustedWeights,
      monthlyIncome
    );

    // Allocate remaining to savings and debt with tax considerations
    optimizedBudget = this.allocateRemaining(
      optimizedBudget,
      adjustedWeights,
      taxConsiderations
    );

    // Final validation to ensure total is 100%
    optimizedBudget = this.normalizePercentages(optimizedBudget);

    return {
      optimizedBudget,
      metrics: this.calculateOptimizationMetrics(
        optimizedBudget,
        monthlyIncome,
        params
      ),
      taxEfficiencyMetrics: this.calculateTaxEfficiencyMetrics(
        optimizedBudget,
        taxConsiderations,
        monthlyIncome
      )
    };
  }

  static calculateTaxAdjustedSavings(monthlyIncome, taxConsiderations) {
    const annualIncome = monthlyIncome * 12;
    const { 
      marginalRate = 0.25,
      retirementAccounts = {},
      deductionLimit = Infinity
    } = taxConsiderations;

    // Calculate maximum tax-advantaged savings
    const maxTaxAdvantaged = Object.values(retirementAccounts)
      .reduce((sum, account) => sum + (account.contributionLimit || 0), 0);

    // Calculate tax savings from maximum contributions
    const potentialTaxSavings = Math.min(
      maxTaxAdvantaged * marginalRate,
      deductionLimit * marginalRate
    );

    return {
      maxTaxAdvantaged,
      potentialTaxSavings,
      effectiveRate: 1 - (potentialTaxSavings / maxTaxAdvantaged)
    };
  }

  static calculateTaxEfficientDebtPayments(debtInfo, taxConsiderations) {
    const { marginalRate = 0.25 } = taxConsiderations;
    const deductibleCategories = ['Mortgage', 'Student Loans'];

    return Object.entries(debtInfo).reduce((acc, [debtType, debt]) => {
      const isDeductible = deductibleCategories.some(category => 
        debtType.includes(category)
      );

      const effectiveRate = isDeductible
        ? debt.interestRate * (1 - marginalRate)
        : debt.interestRate;

      return {
        ...acc,
        [debtType]: {
          ...debt,
          effectiveRate,
          priorityScore: this.calculateDebtPriorityScore(debt, effectiveRate)
        }
      };
    }, {});
  }

  static calculateSavingsPriority(savingsGoal, currentSavingsRate, taxConsiderations) {
    const {
      retirementAccounts = {},
      emergencyFundNeeded = false,
      hsa = { eligible: false }
    } = taxConsiderations;

    // Calculate priority scores for different savings types
    const priorities = {
      employerMatch: this.calculateEmployerMatchPriority(retirementAccounts),
      hsaPriority: this.calculateHSAPriority(hsa),
      emergencyFund: emergencyFundNeeded ? 1 : 0,
      generalSavings: this.calculateGeneralSavingsPriority(
        savingsGoal,
        currentSavingsRate
      )
    };

    return this.normalizePriorities(priorities);
  }

  static calculateEmployerMatchPriority(retirementAccounts) {
    return Object.values(retirementAccounts).reduce((maxPriority, account) => {
      const matchRate = account.employerMatch?.rate || 0;
      const matchLimit = account.employerMatch?.limit || 0;
      const priority = matchRate * Math.min(1, matchLimit / 100);
      return Math.max(maxPriority, priority);
    }, 0);
  }

  static calculateHSAPriority(hsa) {
    if (!hsa.eligible) return 0;
    return hsa.employerContribution ? 0.8 : 0.6;
  }

  static calculateGeneralSavingsPriority(savingsGoal, currentRate) {
    if (!savingsGoal) return 0.3;
    const progressToGoal = currentRate / (savingsGoal / 100);
    return Math.max(0.3, 1 - progressToGoal);
  }

  static normalizePriorities(priorities) {
    const total = Object.values(priorities).reduce((sum, p) => sum + p, 0);
    return Object.entries(priorities).reduce((norm, [key, value]) => ({
      ...norm,
      [key]: value / total
    }), {});
  }

  static adjustWeightsForTaxEfficiency(weights, taxConsiderations, savingsPriority) {
    const { marginalRate = 0.25 } = taxConsiderations;
    
    // Adjust weights based on tax marginal rate and savings priorities
    const taxEfficiencyBoost = marginalRate * weights.taxEfficiencyWeight;
    
    return {
      savingsWeight: weights.savingsWeight * (1 + taxEfficiencyBoost * savingsPriority.employerMatch),
      debtWeight: weights.debtWeight * (1 - taxEfficiencyBoost * 0.5),
      lifestyleWeight: weights.lifestyleWeight * (1 - taxEfficiencyBoost)
    };
  }

  static optimizeTaxAdvantaged(budget, taxConsiderations, monthlyIncome) {
    const adjusted = { ...budget };
    const { retirementAccounts = {}, hsa = { eligible: false } } = taxConsiderations;

    // Optimize retirement account contributions
    Object.values(retirementAccounts).forEach(account => {
      if (account.employerMatch) {
        const minContribution = (account.employerMatch.minimum || 0) / 100;
        adjusted.Savings = Math.max(adjusted.Savings, minContribution * 100);
      }
    });

    // Optimize HSA if eligible
    if (hsa.eligible) {
      const hsaContribution = Math.min(
        (hsa.contributionLimit || 0) / (12 * monthlyIncome) * 100,
        adjusted.Healthcare
      );
      adjusted.Healthcare = Math.max(adjusted.Healthcare, hsaContribution);
    }

    return adjusted;
  }

  static calculateTaxEfficiencyMetrics(budget, taxConsiderations, monthlyIncome) {
    const annualIncome = monthlyIncome * 12;
    
    return {
      potentialTaxSavings: this.calculatePotentialTaxSavings(
        budget,
        taxConsiderations,
        annualIncome
      ),
      taxAdvantageUtilization: this.calculateTaxAdvantageUtilization(
        budget,
        taxConsiderations,
        annualIncome
      ),
      effectiveTaxRate: this.calculateEffectiveTaxRate(
        budget,
        taxConsiderations,
        annualIncome
      )
    };
  }

  static calculatePotentialTaxSavings(budget, taxConsiderations, annualIncome) {
    const { marginalRate = 0.25 } = taxConsiderations;
    const savingsAmount = (budget.Savings / 100) * annualIncome;
    return savingsAmount * marginalRate;
  }

  static calculateTaxAdvantageUtilization(budget, taxConsiderations, annualIncome) {
    const { retirementAccounts = {} } = taxConsiderations;
    const totalLimit = Object.values(retirementAccounts)
      .reduce((sum, account) => sum + (account.contributionLimit || 0), 0);
    
    const projectedContribution = (budget.Savings / 100) * annualIncome;
    return totalLimit > 0 ? Math.min(1, projectedContribution / totalLimit) : 0;
  }

  static calculateEffectiveTaxRate(budget, taxConsiderations, annualIncome) {
    const { marginalRate = 0.25 } = taxConsiderations;
    const taxableIncome = annualIncome * (1 - (budget.Savings / 100));
    return marginalRate * (taxableIncome / annualIncome);
  }
}

// Helper functions
function calculateDebtUrgencyFactor(debtInfo) {
  if (!debtInfo || Object.keys(debtInfo).length === 0) return 0;

  // Calculate weighted average interest rate
  const totalDebt = Object.values(debtInfo).reduce((sum, debt) => sum + debt.amount, 0);
  const weightedInterestRate = Object.values(debtInfo).reduce((sum, debt) => {
    return sum + (debt.amount / totalDebt) * debt.interestRate;
  }, 0);

  // Normalize to a 0-1 scale (assuming max interest rate of 30%)
  return Math.min(weightedInterestRate / 30, 1);
}

function calculateSavingsUrgencyFactor(savingsGoal, currentSavingsRate) {
  if (!savingsGoal || !currentSavingsRate) return 0.5;
  
  // Calculate how far we are from the ideal savings rate
  const idealSavingsRate = 20; // 20% is often recommended as a good savings rate
  const normalizedCurrentRate = currentSavingsRate / idealSavingsRate;
  
  // Higher urgency if we're saving less than ideal
  return Math.max(0, Math.min(1, 1 - normalizedCurrentRate));
}

function adjustWeights(weights, debtUrgency, savingsUrgency) {
  const totalUrgency = debtUrgency + savingsUrgency;
  if (totalUrgency === 0) return weights;

  return {
    savingsWeight: weights.savingsWeight * (1 + savingsUrgency),
    debtWeight: weights.debtWeight * (1 + debtUrgency),
    lifestyleWeight: Math.max(
      0.1, // Minimum 10% for lifestyle
      weights.lifestyleWeight * (1 - (totalUrgency / 2))
    )
  };
}

function enforceMinimumRequirements(budget, minimums) {
  const adjustedBudget = { ...budget };
  
  // First pass: ensure minimums are met
  Object.entries(minimums).forEach(([category, minPercent]) => {
    if (adjustedBudget[category] < minPercent) {
      adjustedBudget[category] = minPercent;
    }
  });

  return adjustedBudget;
}

function optimizeDiscretionarySpending(budget, maximums, weights, monthlyIncome) {
  const adjustedBudget = { ...budget };
  
  // Adjust discretionary categories based on weights and constraints
  Object.entries(maximums).forEach(([category, maxPercent]) => {
    const currentPercent = adjustedBudget[category];
    if (currentPercent > maxPercent) {
      adjustedBudget[category] = maxPercent;
    }
  });

  return adjustedBudget;
}

function allocateRemaining(budget, weights) {
  const adjustedBudget = { ...budget };
  
  // Calculate total allocated so far
  const totalAllocated = Object.values(adjustedBudget).reduce((sum, value) => sum + value, 0);
  const remaining = 100 - totalAllocated;

  if (remaining > 0) {
    // Normalize weights for remaining allocation
    const totalWeight = weights.savingsWeight + weights.debtWeight;
    
    // Split remaining between savings and debt payments based on weights
    const additionalSavings = (remaining * weights.savingsWeight) / totalWeight;
    const additionalDebt = (remaining * weights.debtWeight) / totalWeight;

    adjustedBudget.Savings = (adjustedBudget.Savings || 0) + additionalSavings;
    adjustedBudget['Debt Payments'] = (adjustedBudget['Debt Payments'] || 0) + additionalDebt;
  }

  return adjustedBudget;
}

function normalizePercentages(budget) {
  const total = Object.values(budget).reduce((sum, value) => sum + value, 0);
  
  if (Math.abs(total - 100) < 0.01) return budget;

  const normalizedBudget = {};
  const scaleFactor = 100 / total;
  
  Object.entries(budget).forEach(([category, value]) => {
    normalizedBudget[category] = Number((value * scaleFactor).toFixed(1));
  });

  return normalizedBudget;
}

function calculateOptimizationMetrics(budget, monthlyIncome, params) {
  const monthlySavings = (budget.Savings / 100) * monthlyIncome;
  const monthlyDebtPayment = (budget['Debt Payments'] / 100) * monthlyIncome;
  
  return {
    monthlySavings,
    monthlyDebtPayment,
    monthsToSavingsGoal: params.savingsGoal ? Math.ceil(params.savingsGoal / monthlySavings) : null,
    debtFreeDate: calculateDebtFreeDate(params.debtInfo, monthlyDebtPayment),
    emergencyFundCoverage: monthlySavings > 0 ? 
      calculateEmergencyFundCoverage(monthlySavings, monthlyIncome) : 0,
    savingsRate: budget.Savings,
    debtPaymentRate: budget['Debt Payments'],
    discretionarySpending: calculateDiscretionarySpending(budget)
  };
}

function calculateDebtFreeDate(debtInfo, monthlyPayment) {
  if (!debtInfo || !monthlyPayment) return null;
  
  // Simple calculation for now - can be enhanced with more sophisticated debt payoff strategies
  const totalDebt = Object.values(debtInfo).reduce((sum, debt) => sum + debt.amount, 0);
  const avgInterestRate = Object.values(debtInfo).reduce((sum, debt) => {
    return sum + (debt.amount * debt.interestRate);
  }, 0) / totalDebt;

  // Using simplified formula for months to debt free
  const monthsToDebtFree = Math.ceil(
    -Math.log(1 - (totalDebt * (avgInterestRate / 12)) / monthlyPayment) /
    Math.log(1 + avgInterestRate / 12)
  );

  return new Date(Date.now() + monthsToDebtFree * 30 * 24 * 60 * 60 * 1000);
}

function calculateEmergencyFundCoverage(monthlySavings, monthlyIncome) {
  // Recommended emergency fund is 3-6 months of expenses
  const monthlyExpenses = monthlyIncome * 0.9; // Assuming 90% of income goes to expenses
  return Math.round((monthlySavings * 6) / monthlyExpenses * 100) / 100;
}

function calculateDiscretionarySpending(budget) {
  const discretionaryCategories = ['Entertainment', 'Personal'];
  return discretionaryCategories.reduce((sum, category) => sum + (budget[category] || 0), 0);
}
