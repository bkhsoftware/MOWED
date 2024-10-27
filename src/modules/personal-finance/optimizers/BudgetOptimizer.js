export class BudgetOptimizer {
  static optimize(params) {
    const {
      monthlyIncome,
      currentBudget,
      savingsGoal,
      debtInfo,
      preferences = {},
      constraints = {}
    } = params;

    // Default weights for different objectives
    const weights = {
      savingsWeight: preferences.savingsWeight || 0.4,
      debtWeight: preferences.debtWeight || 0.3,
      lifestyleWeight: preferences.lifestyleWeight || 0.3
    };

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

    // Calculate debt urgency factor (higher interest rates increase urgency)
    const debtUrgencyFactor = calculateDebtUrgencyFactor(debtInfo);

    // Calculate savings urgency factor based on progress towards savings goal
    const savingsUrgencyFactor = calculateSavingsUrgencyFactor(savingsGoal, currentBudget.Savings);

    // Adjust weights based on urgency factors
    const adjustedWeights = adjustWeights(weights, debtUrgencyFactor, savingsUrgencyFactor);

    // Initialize optimized budget with current allocations
    let optimizedBudget = { ...currentBudget };

    // Ensure minimum requirements are met first
    optimizedBudget = enforceMinimumRequirements(optimizedBudget, minPercentages);

    // Optimize discretionary spending within constraints
    optimizedBudget = optimizeDiscretionarySpending(
      optimizedBudget,
      maxPercentages,
      adjustedWeights,
      monthlyIncome
    );

    // Calculate and allocate remaining percentage to savings and debt payment
    optimizedBudget = allocateRemaining(optimizedBudget, adjustedWeights);

    // Final validation to ensure total is 100%
    optimizedBudget = normalizePercentages(optimizedBudget);

    return {
      optimizedBudget,
      metrics: calculateOptimizationMetrics(optimizedBudget, monthlyIncome, params)
    };
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
