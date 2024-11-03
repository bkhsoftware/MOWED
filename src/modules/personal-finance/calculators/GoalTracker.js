// calculators/GoalTracker.js

export class GoalTracker {
  trackGoals(input, result) {
    const monthlyIncomeGrowth = (input.incomeGrowthRate / 100) * result.monthlyIncome;
    const taxAnalysis = this.analyzeTaxImplications(input, result);
    
    // Process each goal with tax considerations
    const trackedGoals = input.goals.map(goal => {
      const tracking = this.calculateGoalProgress(
        goal,
        result,
        monthlyIncomeGrowth,
        taxAnalysis
      );

      return {
        ...goal,
        ...tracking,
        status: this.determineGoalStatus(tracking.progress),
        taxEfficiency: this.calculateTaxEfficiency(goal, taxAnalysis),
        recommendations: this.generateRecommendations(goal, tracking, result, taxAnalysis)
      };
    });

    return trackedGoals;
  }

  analyzeTaxImplications(input, result) {
    const {
      marginalRate = 0.25,
      stateRate = 0,
      filingStatus = 'single',
      itemizingDeductions = false,
      retirementAccounts = {},
      taxableAccounts = {}
    } = input.taxInfo || {};

    const effectiveTaxRate = marginalRate + stateRate;

    return {
      currentTaxBracket: this.determineTaxBracket(result.monthlyIncome * 12, filingStatus),
      projectedTaxBracket: this.projectFutureTaxBracket(
        result.monthlyIncome * 12,
        input.incomeGrowthRate,
        filingStatus
      ),
      retirementAccounts: this.analyzeRetirementAccounts(retirementAccounts),
      taxableAccounts: this.analyzeTaxableAccounts(taxableAccounts),
      effectiveTaxRate,
      itemizingDeductions,
      taxAdvantages: this.identifyTaxAdvantages(input, result)
    };
  }

  calculateGoalProgress(goal, result, monthlyIncomeGrowth, taxAnalysis) {
    let progress = 0;
    let timeToGoal = 0;
    let taxAdjustedTarget = this.calculateTaxAdjustedTarget(goal, taxAnalysis);

    switch (goal.type) {
      case 'savings':
        return this.trackSavingsGoal(
          goal,
          result,
          taxAnalysis,
          taxAdjustedTarget
        );

      case 'debt_reduction':
        return this.trackDebtReductionGoal(
          goal,
          result,
          taxAnalysis,
          taxAdjustedTarget
        );

      case 'income':
        return this.trackIncomeGoal(
          goal,
          result,
          monthlyIncomeGrowth,
          taxAnalysis,
          taxAdjustedTarget
        );

      default:
        return { progress: 0, timeToGoal: Infinity };
    }
  }

  trackSavingsGoal(goal, result, taxAnalysis, taxAdjustedTarget) {
    const { effectiveTaxRate, retirementAccounts } = taxAnalysis;
    
    // Calculate tax-efficient savings capacity
    const taxEfficientSavings = this.calculateTaxEfficientSavings(
      result.availableSavings,
      retirementAccounts
    );

    // Calculate current tax-adjusted progress
    const currentSavings = result.totalAssets - result.totalLiabilities;
    const taxAdjustedSavings = this.adjustSavingsForTaxes(
      currentSavings,
      taxAnalysis
    );

    const progress = taxAdjustedSavings / taxAdjustedTarget;

    // Calculate time to goal considering tax efficiency
    const timeToGoal = this.calculateTimeToSavingsGoal(
      taxAdjustedTarget - taxAdjustedSavings,
      taxEfficientSavings,
      effectiveTaxRate
    );

    return {
      progress: Math.min(Math.max(progress, 0), 1),
      timeToGoal: Math.max(timeToGoal, 0),
      taxAdjustedTarget,
      taxEfficientSavings,
      optimalAccounts: this.recommendOptimalAccounts(goal, taxAnalysis)
    };
  }

  trackDebtReductionGoal(goal, result, taxAnalysis, taxAdjustedTarget) {
    const { effectiveTaxRate } = taxAnalysis;

    // Calculate tax-deductible debt payments
    const taxDeductiblePayments = this.calculateTaxDeductiblePayments(
      result.monthlyIncome * (result.budgetAllocation['Debt Payments'] / 100),
      result.liabilities,
      taxAnalysis
    );

    // Calculate progress considering tax deductions
    const taxAdjustedLiabilities = this.adjustDebtsForTaxes(
      result.totalLiabilities,
      taxAnalysis
    );

    const progress = 1 - (taxAdjustedLiabilities / taxAdjustedTarget);

    // Calculate time to goal with tax considerations
    const timeToGoal = this.calculateTimeToDebtFree(
      taxAdjustedLiabilities,
      taxDeductiblePayments,
      effectiveTaxRate
    );

    return {
      progress: Math.min(Math.max(progress, 0), 1),
      timeToGoal: Math.max(timeToGoal, 0),
      taxAdjustedTarget,
      taxDeductiblePayments,
      debtPrioritization: this.recommendDebtPrioritization(result.liabilities, taxAnalysis)
    };
  }

  trackIncomeGoal(goal, result, monthlyIncomeGrowth, taxAnalysis, taxAdjustedTarget) {
    const { currentTaxBracket, projectedTaxBracket } = taxAnalysis;

    // Calculate tax-adjusted current and target income
    const taxAdjustedIncome = result.monthlyIncome * (1 - currentTaxBracket.rate);
    const progress = taxAdjustedIncome / taxAdjustedTarget;

    // Calculate time to goal considering tax brackets
    const timeToGoal = this.calculateTimeToIncomeGoal(
      taxAdjustedTarget - taxAdjustedIncome,
      monthlyIncomeGrowth,
      currentTaxBracket,
      projectedTaxBracket
    );

    return {
      progress: Math.min(Math.max(progress, 0), 1),
      timeToGoal: Math.max(timeToGoal, 0),
      taxAdjustedTarget,
      projectedBracketChanges: this.projectTaxBracketChanges(
        result.monthlyIncome,
        monthlyIncomeGrowth,
        taxAnalysis
      )
    };
  }

  calculateTaxEfficiency(goal, taxAnalysis) {
    const {
      effectiveTaxRate,
      retirementAccounts,
      taxableAccounts,
      taxAdvantages
    } = taxAnalysis;

    switch (goal.type) {
      case 'savings':
        return this.calculateSavingsTaxEfficiency(goal, taxAnalysis);
      case 'debt_reduction':
        return this.calculateDebtReductionTaxEfficiency(goal, taxAnalysis);
      case 'income':
        return this.calculateIncomeTaxEfficiency(goal, taxAnalysis);
      default:
        return 0;
    }
  }

  calculateSavingsTaxEfficiency(goal, taxAnalysis) {
    const { retirementAccounts, taxableAccounts } = taxAnalysis;
    
    // Calculate potential tax savings from optimal account usage
    const maxTaxAdvantage = this.calculateMaxTaxAdvantage(
      goal.target,
      retirementAccounts
    );

    // Calculate current tax advantage utilization
    const currentUtilization = this.calculateCurrentTaxAdvantageUtilization(
      taxableAccounts,
      retirementAccounts
    );

    return {
      score: currentUtilization / maxTaxAdvantage,
      maxAnnualSavings: maxTaxAdvantage * taxAnalysis.effectiveTaxRate,
      currentAnnualSavings: currentUtilization * taxAnalysis.effectiveTaxRate,
      improvementPotential: (maxTaxAdvantage - currentUtilization) * taxAnalysis.effectiveTaxRate
    };
  }

  calculateDebtReductionTaxEfficiency(goal, taxAnalysis) {
    // Calculate efficiency of current debt reduction strategy considering tax deductions
    const deductibleDebtRatio = this.calculateDeductibleDebtRatio(goal, taxAnalysis);
    const optimalDeductibleRatio = this.calculateOptimalDeductibleRatio(goal, taxAnalysis);

    return {
      score: deductibleDebtRatio / optimalDeductibleRatio,
      currentTaxBenefit: deductibleDebtRatio * taxAnalysis.effectiveTaxRate,
      potentialTaxBenefit: optimalDeductibleRatio * taxAnalysis.effectiveTaxRate,
      improvementPotential: (optimalDeductibleRatio - deductibleDebtRatio) * taxAnalysis.effectiveTaxRate
    };
  }

  calculateIncomeTaxEfficiency(goal, taxAnalysis) {
    const { currentTaxBracket, projectedTaxBracket } = taxAnalysis;
    
    // Calculate tax efficiency of income growth strategy
    const bracketProgression = this.analyzeTaxBracketProgression(
      goal.target,
      currentTaxBracket,
      projectedTaxBracket
    );

    return {
      score: this.calculateIncomeTaxEfficiencyScore(bracketProgression),
      projectedBracketImpact: bracketProgression.netImpact,
      optimizationPotential: bracketProgression.optimizationPotential,
      recommendedStrategies: this.recommendIncomeTaxStrategies(bracketProgression)
    };
  }

  generateRecommendations(goal, tracking, result, taxAnalysis) {
    const recommendations = [];

    // Add tax-specific recommendations
    const taxRecommendations = this.generateTaxRecommendations(
      goal,
      tracking,
      taxAnalysis
    );
    recommendations.push(...taxRecommendations);

    // Add general progress-based recommendations
    if (tracking.progress < 0.25) {
      recommendations.push('Consider increasing focus on this goal');
    }

    // Add goal-specific recommendations
    switch (goal.type) {
      case 'savings':
        this.addSavingsRecommendations(recommendations, goal, tracking, result, taxAnalysis);
        break;

      case 'debt_reduction':
        this.addDebtRecommendations(recommendations, goal, tracking, result, taxAnalysis);
        break;

      case 'income':
        this.addIncomeRecommendations(recommendations, goal, tracking, result, taxAnalysis);
        break;
    }

    return this.prioritizeRecommendations(recommendations);
  }

  generateTaxRecommendations(goal, tracking, taxAnalysis) {
    const recommendations = [];
    const efficiency = tracking.taxEfficiency;

    if (efficiency.improvementPotential > 0) {
      recommendations.push({
        type: 'tax_optimization',
        priority: this.calculateRecommendationPriority(efficiency.improvementPotential),
        suggestion: this.generateTaxOptimizationSuggestion(goal, efficiency),
        impact: `Potential annual tax savings of $${efficiency.improvementPotential.toFixed(2)}`,
        actions: this.generateTaxOptimizationActions(goal, tracking, taxAnalysis)
      });
    }

    return recommendations;
  }

  calculateTaxAdjustedTarget(goal, taxAnalysis) {
    const { effectiveTaxRate } = taxAnalysis;

    switch (goal.type) {
      case 'savings':
        return goal.target / (1 - effectiveTaxRate);
      case 'debt_reduction':
        return this.adjustDebtTargetForTaxes(goal.target, taxAnalysis);
      case 'income':
        return goal.target / (1 - this.estimateMarginalRate(goal.target));
      default:
        return goal.target;
    }
  }

  // Helper methods...
  calculateRecommendationPriority(improvementPotential) {
    if (improvementPotential > 5000) return 'high';
    if (improvementPotential > 1000) return 'medium';
    return 'low';
  }

  prioritizeRecommendations(recommendations) {
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.impact.localeCompare(a.impact);
    });
  }
}
