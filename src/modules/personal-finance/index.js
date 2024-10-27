import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
    this.budgetCategories = [
      'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 
      'Healthcare', 'Debt Payments', 'Personal', 'Entertainment', 'Savings'
    ];
    this.assetCategories = {
      'Liquid Assets': ['Cash', 'Checking Accounts', 'Savings Accounts'],
      'Investments': ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Retirement Accounts'],
      'Real Estate': ['Primary Residence', 'Investment Properties'],
      'Personal Property': ['Vehicles', 'Jewelry', 'Collectibles'],
      'Other Assets': ['Business Ownership', 'Intellectual Property']
    };
    this.liabilityCategories = {
      'Secured Debts': ['Mortgage', 'Auto Loans', 'Home Equity Loans'],
      'Unsecured Debts': ['Credit Card Debt', 'Personal Loans'],
      'Student Loans': ['Federal Student Loans', 'Private Student Loans'],
      'Other Debts': ['Medical Debt', 'Tax Debt']
    };
    this.goals = [];
  }

  _solve(input) {
    const { 
      monthlyIncome, 
      budgetAllocation,
      savingsGoal, 
      investmentRate,
      assets,
      liabilities
    } = input;
    
    const totalAllocated = Object.values(budgetAllocation).reduce((sum, value) => sum + value, 0);
    if (Math.abs(totalAllocated - 100) > 0.01) {
      throw new Error('Budget allocation must sum to 100%');
    }

    const expenses = this.budgetCategories.reduce((sum, category) => {
      if (category !== 'Savings') {
        return sum + (monthlyIncome * budgetAllocation[category] / 100);
      }
      return sum;
    }, 0);

    const availableSavings = monthlyIncome * budgetAllocation['Savings'] / 100;
    
    if (availableSavings <= 0) {
      throw new Error('Savings allocation must be greater than 0');
    }

    const monthsToGoal = Math.ceil(savingsGoal / availableSavings);
    const monthsToGoalWithInvestment = Math.ceil(
      Math.log(savingsGoal / availableSavings * (investmentRate / 12) + 1) / 
      Math.log(1 + investmentRate / 12) / 12
    );

    // Calculate net worth
    const totalAssets = Object.values(assets).reduce((sum, value) => sum + value, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, value) => sum + value, 0);
    const netWorth = totalAssets - totalLiabilities;

    const debtAmount = totalLiabilities;
    const monthsToPayDebt = debtAmount > 0 ? 
      Math.ceil(Math.log(1 - debtAmount * (investmentRate / 12) / availableSavings) / 
      Math.log(1 + investmentRate / 12)) : 0;

    // Prepare debt information for the optimizer
    const debtInfo = {};
    Object.entries(input.liabilities).forEach(([category, debts]) => {
      Object.entries(debts).forEach(([name, amount]) => {
        if (amount > 0) {
          debtInfo[`${category}-${name}`] = {
            amount,
            // Estimated interest rates based on debt type
            interestRate: this.getEstimatedInterestRate(category, name)
          };
        }
      });
    });

    // Optimize budget allocation
    const optimizationResult = BudgetOptimizer.optimize({
      monthlyIncome: input.monthlyIncome,
      currentBudget: input.budgetAllocation,
      savingsGoal: input.savingsGoal,
      debtInfo,
      preferences: {
        savingsWeight: 0.4,
        debtWeight: 0.3,
        lifestyleWeight: 0.3
      },
      constraints: {
        minimums: {
          Housing: 25,
          Food: 10,
          Utilities: 5,
          Healthcare: 5
        },
        maximums: {
          Entertainment: 10,
          Personal: 10
        }
      }
    });

    const result = {
      monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      availableSavings: parseFloat(availableSavings.toFixed(2)),
      budgetAllocation,
      monthsToGoal,
      monthsToGoalWithInvestment,
      monthsToPayDebt,
      totalAssets: parseFloat(totalAssets.toFixed(2)),
      totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
      netWorth: parseFloat(netWorth.toFixed(2)),
      assets,
      liabilities,
      date: new Date().toISOString().split('T')[0],
      message: `Your current net worth is $${netWorth.toFixed(2)}. With your current budget allocation, you can save $${availableSavings.toFixed(2)} per month. It will take approximately ${monthsToGoal} months to reach your savings goal without investment, or ${monthsToGoalWithInvestment} months with investment. If you have debt, it will take about ${monthsToPayDebt} months to pay it off.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result },

      optimizedBudget: optimizationResult.optimizedBudget,
      optimizationMetrics: optimizationResult.metrics,
      budgetRecommendations: this.generateBudgetRecommendations(
        input.budgetAllocation,
        optimizationResult.optimizedBudget
      )

    });

    const goalProgress = this.trackGoals(input, result);

    // Retirement calculations
    const yearsUntilRetirement = input.retirementAge - input.age;
    const monthsUntilRetirement = yearsUntilRetirement * 12;
    const retirementSavingsAtRetirement = this.calculateRetirementSavings(
      input.retirementSavings,
      input.monthlyRetirementContribution,
      monthsUntilRetirement,
      input.investmentRate / 12
    );
    const monthlyRetirementIncome = this.calculateRetirementIncome(
      retirementSavingsAtRetirement,
      input.investmentRate / 12,
      input.yearsInRetirement * 12 // Use user-provided years in retirement
    );

    // Calculate total investment assets
    const investmentAssets = input.assets.Investments || {};
    const totalInvestments = Object.values(investmentAssets)
      .reduce((sum, value) => sum + value, 0);

    // Determine risk tolerance based on various factors
    const riskTolerance = this.calculateRiskTolerance(input);

    // Calculate monthly income needs from investments
    const monthlyIncomeNeeds = Math.max(0, 
      input.desiredRetirementIncome / 12 - input.monthlyRetirementContribution
    );

    // Get portfolio optimization
    const portfolioOptimization = PortfolioOptimizer.optimize({
      investmentAmount: totalInvestments,
      riskTolerance,
      timeHorizon: input.retirementAge - input.age,
      incomeNeeds: monthlyIncomeNeeds * 12, // Convert to annual
      existingPositions: this.normalizeInvestmentPositions(investmentAssets),
      constraints: this.getInvestmentConstraints(input)
    });

    return {
      ...result,
      goalProgress,
      retirementProjection: {
        yearsUntilRetirement,
        yearsInRetirement: input.yearsInRetirement,
        retirementSavingsAtRetirement,
        monthlyRetirementIncome,
        desiredMonthlyRetirementIncome: input.desiredRetirementIncome / 12,
        retirementIncomeGap: (input.desiredRetirementIncome / 12) - monthlyRetirementIncome
      },
      portfolioOptimization,
      investmentRecommendations: this.generateInvestmentRecommendations(
        portfolioOptimization,
        investmentAssets,
        input
      )
    };
  }

  calculateRiskTolerance(input) {
    let score = 3; // Start with moderate risk tolerance

    // Age-based adjustment (younger = higher risk tolerance)
    const yearsToRetirement = input.retirementAge - input.age;
    if (yearsToRetirement > 30) score += 1;
    else if (yearsToRetirement < 10) score -= 1;

    // Income stability adjustment
    if (input.incomeGrowthRate > 5) score += 0.5;
    else if (input.incomeGrowthRate < 2) score -= 0.5;

    // Emergency fund adjustment
    const monthlyExpenses = input.monthlyIncome * (1 - input.budgetAllocation.Savings / 100);
    const liquidAssets = Object.values(input.assets['Liquid Assets'] || {})
      .reduce((sum, value) => sum + value, 0);
    const monthsOfExpenses = liquidAssets / monthlyExpenses;
    
    if (monthsOfExpenses < 3) score -= 1;
    else if (monthsOfExpenses > 6) score += 0.5;

    // Debt load adjustment
    const totalDebt = Object.values(input.liabilities)
      .reduce((sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0), 0);
    const debtToIncome = totalDebt / (input.monthlyIncome * 12);
    
    if (debtToIncome > 3) score -= 1;
    else if (debtToIncome < 1) score += 0.5;

    // Clamp final score between 1 and 5
    return Math.max(1, Math.min(5, Math.round(score)));
  }

  normalizeInvestmentPositions(investmentAssets) {
    const total = Object.values(investmentAssets).reduce((sum, value) => sum + value, 0);
    if (total === 0) return {};

    // Map investment categories to standard asset classes
    const assetMapping = {
      'Stocks': 'US Large Cap Stocks',
      'Bonds': 'US Government Bonds',
      'Mutual Funds': 'US Large Cap Stocks', // Simplified mapping
      'ETFs': 'US Large Cap Stocks',
      'Retirement Accounts': 'US Large Cap Stocks' // Default to stocks for retirement
    };

    const normalizedPositions = {};
    
    Object.entries(investmentAssets).forEach(([category, value]) => {
      const mappedAsset = assetMapping[category] || 'US Large Cap Stocks';
      normalizedPositions[mappedAsset] = (normalizedPositions[mappedAsset] || 0) + value / total;
    });

    return normalizedPositions;
  }

  getInvestmentConstraints(input) {
    const constraints = {
      minimum: {},
      maximum: {}
    };

    // Age-based constraints
    const yearsToRetirement = input.retirementAge - input.age;
    
    if (yearsToRetirement < 5) {
      // Conservative allocation for near retirement
      constraints.minimum['US Government Bonds'] = 0.4;
      constraints.minimum['Cash'] = 0.1;
      constraints.maximum['US Large Cap Stocks'] = 0.3;
      constraints.maximum['Emerging Market Stocks'] = 0.05;
    } else if (yearsToRetirement < 15) {
      // Moderate allocation
      constraints.minimum['US Government Bonds'] = 0.25;
      constraints.minimum['Cash'] = 0.05;
      constraints.maximum['Emerging Market Stocks'] = 0.1;
    } else {
      // Growth allocation for long-term
      constraints.minimum['US Government Bonds'] = 0.1;
      constraints.maximum['Emerging Market Stocks'] = 0.15;
    }

    // Income needs based constraints
    if (input.desiredRetirementIncome > input.monthlyIncome * 0.7 * 12) {
      constraints.minimum['Corporate Bonds'] = 0.15;
      constraints.minimum['REITs'] = 0.1;
    }

    // Risk tolerance based constraints
    const riskTolerance = this.calculateRiskTolerance(input);
    if (riskTolerance <= 2) {
      constraints.minimum['US Government Bonds'] = Math.max(
        constraints.minimum['US Government Bonds'] || 0,
        0.35
      );
      constraints.maximum['US Large Cap Stocks'] = 0.4;
    } else if (riskTolerance >= 4) {
      constraints.minimum['US Large Cap Stocks'] = 0.3;
      constraints.maximum['US Government Bonds'] = 0.3;
    }

    return constraints;
  }

  generateInvestmentRecommendations(optimization, currentInvestments, input) {
    const recommendations = [];
    const totalCurrent = Object.values(currentInvestments).reduce((sum, value) => sum + value, 0);

    // Generate specific recommendations based on the optimization results
    recommendations.push({
      type: 'allocation',
      title: 'Asset Allocation',
      description: `Based on your ${optimization.rationale.overview.toLowerCase()}, we recommend the following allocation:`,
      details: Object.entries(optimization.recommendedAllocation)
        .map(([asset, weight]) => `${asset}: ${(weight * 100).toFixed(1)}%`)
    });

    // Add rebalancing recommendations
    if (optimization.rebalancingPlan.length > 0) {
      recommendations.push({
        type: 'rebalancing',
        title: 'Rebalancing Actions',
        description: 'To achieve the optimal allocation, consider these trades:',
        actions: optimization.rebalancingPlan.map(plan => ({
          action: plan.action,
          asset: plan.asset,
          amount: plan.amount,
          reason: `Adjust ${plan.asset} position by ${Math.abs(plan.percentageChange).toFixed(1)}% to optimize risk-adjusted returns`
        }))
      });
    }

    // Add diversification recommendations
    if (optimization.diversificationScore < 70) {
      recommendations.push({
        type: 'diversification',
        title: 'Improve Diversification',
        description: 'Your portfolio could benefit from increased diversification:',
        suggestions: [
          'Consider adding exposure to different asset classes',
          'Reduce concentration in single assets or sectors',
          'Include international investments for global diversification'
        ]
      });
    }

    // Add income-focused recommendations if needed
    if (input.desiredRetirementIncome > 0) {
      const incomeGap = input.desiredRetirementIncome - optimization.expectedIncome;
      if (incomeGap > 0) {
        recommendations.push({
          type: 'income',
          title: 'Income Generation',
          description: 'To meet your income needs:',
          suggestions: [
            'Consider increasing allocation to dividend-paying stocks',
            'Add high-quality corporate bonds for stable income',
            'Consider REITs for additional income generation'
          ]
        });
      }
    }

    // Add risk management recommendations
    recommendations.push({
      type: 'risk',
      title: 'Risk Management',
      description: `Your portfolio has an expected volatility of ${(optimization.expectedRisk * 100).toFixed(1)}%:`,
      details: optimization.rationale.keyConsiderations
    });

    return recommendations;
  }

  getEstimatedInterestRate(category, name) {
    const rateEstimates = {
      'Secured Debts': {
        'Mortgage': 0.04,
        'Auto Loans': 0.06,
        'Home Equity Loans': 0.05
      },
      'Unsecured Debts': {
        'Credit Card Debt': 0.18,
        'Personal Loans': 0.10
      },
      'Student Loans': {
        'Federal Student Loans': 0.05,
        'Private Student Loans': 0.08
      },
      'Other Debts': {
        'Medical Debt': 0.07,
        'Tax Debt': 0.06
      }
    };

    return rateEstimates[category]?.[name] || 0.10; // Default to 10% if unknown
  }

  generateBudgetRecommendations(currentBudget, optimizedBudget) {
    const recommendations = [];
    const significantChange = 3; // Percentage points threshold for recommendations

    Object.entries(optimizedBudget).forEach(([category, recommendedPercent]) => {
      const currentPercent = currentBudget[category] || 0;
      const difference = recommendedPercent - currentPercent;

      if (Math.abs(difference) >= significantChange) {
        recommendations.push({
          category,
          currentPercent,
          recommendedPercent,
          difference,
          action: difference > 0 ? 'increase' : 'decrease',
          reason: this.getRecommendationReason(category, difference)
        });
      }
    });

    return recommendations;
  }

  getRecommendationReason(category, difference) {
  const reasons = {
    Savings: {
      increase: 'Increasing savings will help you reach your financial goals faster and build a stronger emergency fund',
      decrease: 'Consider temporarily reducing savings to address more urgent financial needs, but aim to increase this again when possible'
    },
    'Debt Payments': {
      increase: 'Increasing debt payments will reduce interest costs and help you become debt-free sooner',
      decrease: 'A smaller debt payment allocation might be more sustainable for your current situation, but try to avoid taking on new debt'
    },
    Housing: {
      increase: 'Your housing allocation might need to increase to ensure stable accommodation, but try to keep it below 30% of income',
      decrease: 'Your housing costs might be higher than recommended. Consider options like refinancing or finding more affordable housing'
    },
    Transportation: {
      increase: 'Consider increasing transportation budget to ensure reliable access to work and essential services',
      decrease: 'You might save money by optimizing transportation costs through public transit, carpooling, or fuel-efficient options'
    },
    Food: {
      increase: 'Consider increasing food budget to ensure adequate nutrition while maintaining a balanced diet',
      decrease: 'You might reduce food expenses through meal planning, bulk buying, and reducing dining out'
    },
    Utilities: {
      increase: 'A higher utilities budget might be needed to ensure basic comfort and account for seasonal changes',
      decrease: 'Consider energy-efficient improvements or usage modifications to reduce utility costs'
    },
    Insurance: {
      increase: 'Adequate insurance coverage is crucial for financial security - consider reviewing and upgrading your policies',
      decrease: 'You might save on insurance by comparing providers or adjusting coverage, but maintain essential protection'
    },
    Healthcare: {
      increase: 'Healthcare is essential - consider increasing this allocation to ensure proper medical care and preventive services',
      decrease: 'You might optimize healthcare costs through preventive care and using in-network providers, but don\'t compromise on health'
    },
    Personal: {
      increase: 'A modest increase in personal spending can improve quality of life while maintaining financial goals',
      decrease: 'Reducing personal expenses can free up money for savings and debt reduction'
    },
    Entertainment: {
      increase: 'A balanced life includes entertainment, but keep this category reasonable relative to essential needs',
      decrease: 'Consider free or low-cost entertainment options to reduce expenses while maintaining social connections'
    },
    Education: {
      increase: 'Investing in education and skill development can lead to better career opportunities',
      decrease: 'Look for more cost-effective learning options like online courses or employer-sponsored training'
    },
    Clothing: {
      increase: 'Ensure adequate professional and personal wardrobe while focusing on quality, lasting items',
      decrease: 'Consider a capsule wardrobe approach and focus on essential, versatile items'
    },
    'Home Maintenance': {
      increase: 'Regular home maintenance prevents costly repairs and maintains property value',
      decrease: 'Focus on essential maintenance while postponing cosmetic improvements'
    },
    'Professional Services': {
      increase: 'Professional services (legal, tax, financial advice) can save money long-term through expert guidance',
      decrease: 'Research self-service options while maintaining professional help for complex matters'
    },
    'Emergency Fund': {
      increase: 'Building a stronger emergency fund provides better protection against unexpected expenses',
      decrease: 'Your emergency fund might be adequate - consider redirecting extra funds to other financial goals'
    },
    Investments: {
      increase: 'Increasing investments can help build long-term wealth and passive income',
      decrease: 'Temporary reduction in investments might help address immediate financial priorities'
    },
    'Charitable Giving': {
      increase: 'If financially comfortable, consider increasing charitable contributions for tax benefits and social impact',
      decrease: 'Consider non-monetary ways to contribute while focusing on improving your financial situation'
    }
  };

    return reasons[category]?.[difference > 0 ? 'increase' : 'decrease'] ||
      `Consider ${difference > 0 ? 'increasing' : 'decreasing'} your ${category.toLowerCase()} allocation for better financial balance`;
  }

  calculateRetirementSavings(currentSavings, monthlyContribution, months, monthlyRate) {
    return currentSavings * Math.pow(1 + monthlyRate, months) + 
           monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  calculateRetirementIncome(savingsAtRetirement, monthlyRate, monthsInRetirement) {
    return savingsAtRetirement * (monthlyRate * Math.pow(1 + monthlyRate, monthsInRetirement)) / 
           (Math.pow(1 + monthlyRate, monthsInRetirement) - 1);
  }

  getInputFields() {
    return [
      { name: 'monthlyIncome', type: 'number', label: 'Monthly Income', min: 0, step: 0.01 },
      { 
        name: 'budgetAllocation', 
        type: 'budgetAllocation', 
        label: 'Budget Allocation', 
        categories: this.budgetCategories 
      },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal', min: 0, step: 0.01 },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate', min: 0, max: 1, step: 0.01 },
      { 
        name: 'assets', 
        type: 'nestedCategoryValues', 
        label: 'Assets', 
        categories: this.assetCategories 
      },
      { 
        name: 'liabilities', 
        type: 'nestedCategoryValues', 
        label: 'Liabilities', 
        categories: this.liabilityCategories 
      },
      {
        name: 'incomeGrowthRate',
        type: 'number',
        label: 'Monthly Income Growth Rate (%)',
        min: 0,
        max: 100,
        step: 0.1
      },
      {
        name: 'goals',
        type: 'goals',
        label: 'Financial Goals'
      },
      { name: 'age', type: 'number', label: 'Current Age', min: 18, max: 100, step: 1 },
      { name: 'retirementAge', type: 'number', label: 'Desired Retirement Age', min: 18, max: 100, step: 1 },
      { name: 'yearsInRetirement', type: 'number', label: 'Expected Years in Retirement', min: 1, max: 50, step: 1 },
      { name: 'retirementSavings', type: 'number', label: 'Current Retirement Savings', min: 0, step: 100 },
      { name: 'monthlyRetirementContribution', type: 'number', label: 'Monthly Retirement Contribution', min: 0, step: 10 },
      { name: 'desiredRetirementIncome', type: 'number', label: 'Desired Annual Retirement Income', min: 0, step: 1000 }
    ];
  }

  trackGoals(input, result) {
    const monthlyIncomeGrowth = (input.incomeGrowthRate / 100) * result.monthlyIncome;
    
    return input.goals.map(goal => {
      let progress = 0;
      let timeToGoal = 0;

      switch (goal.type) {
        case 'savings':
          progress = (result.totalAssets - result.totalLiabilities) / goal.target;
          timeToGoal = (goal.target - (result.totalAssets - result.totalLiabilities)) / result.availableSavings;
          break;
        case 'debt_reduction':
          progress = 1 - (result.totalLiabilities / goal.target);
          timeToGoal = result.totalLiabilities / result.availableSavings;
          break;
        case 'income':
          progress = result.monthlyIncome / goal.target;
          timeToGoal = monthlyIncomeGrowth > 0 ? 
            (goal.target - result.monthlyIncome) / monthlyIncomeGrowth : 
            Infinity;
          break;
      }

      return {
        ...goal,
        progress: Math.min(Math.max(progress, 0), 1),
        timeToGoal: Math.max(timeToGoal, 0)
      };
    });
  }

  validateField(field, value) {
    super.validateField(field, value);
    if (field.name === 'investmentRate' && (value < 0 || value > 1)) {
      throw new Error('Investment rate must be between 0 and 1');
    }
    if (field.name === 'budgetAllocation') {
      const total = Object.values(value).reduce((sum, allocation) => sum + allocation, 0);
      if (Math.abs(total - 100) > 0.01) {
        throw new Error('Budget allocation must sum to 100%');
      }
    }
    if (field.name === 'assets' || field.name === 'liabilities') {
      Object.values(value).forEach(amount => {
        if (amount < 0) {
          throw new Error(`${field.label} values must be non-negative`);
        }
      });
    }
  }
}
