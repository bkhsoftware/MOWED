// calculators/GoalTracker.js

export class GoalTracker {
  trackGoals(input, result) {
    const monthlyIncomeGrowth = (input.incomeGrowthRate / 100) * result.monthlyIncome;
    
    return input.goals.map(goal => {
      const tracking = this.calculateGoalProgress(
        goal,
        result,
        monthlyIncomeGrowth
      );

      return {
        ...goal,
        ...tracking,
        status: this.determineGoalStatus(tracking.progress),
        recommendations: this.generateRecommendations(goal, tracking, result)
      };
    });
  }

  calculateGoalProgress(goal, result, monthlyIncomeGrowth) {
    let progress = 0;
    let timeToGoal = 0;

    switch (goal.type) {
      case 'savings':
        progress = (result.totalAssets - result.totalLiabilities) / goal.target;
        timeToGoal = (goal.target - (result.totalAssets - result.totalLiabilities)) / 
          result.availableSavings;
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
      progress: Math.min(Math.max(progress, 0), 1),
      timeToGoal: Math.max(timeToGoal, 0)
    };
  }

  determineGoalStatus(progress) {
    if (progress >= 1) return 'achieved';
    if (progress >= 0.75) return 'near_completion';
    if (progress >= 0.5) return 'on_track';
    if (progress >= 0.25) return 'in_progress';
    return 'getting_started';
  }

  generateRecommendations(goal, tracking, result) {
    const recommendations = [];

    // General progress-based recommendations
    if (tracking.progress < 0.25) {
      recommendations.push('Consider increasing focus on this goal');
    }

    // Goal-specific recommendations
    switch (goal.type) {
      case 'savings':
        this.addSavingsRecommendations(recommendations, goal, tracking, result);
        break;

      case 'debt_reduction':
        this.addDebtRecommendations(recommendations, goal, tracking, result);
        break;

      case 'income':
        this.addIncomeRecommendations(recommendations, goal, tracking, result);
        break;
    }

    return recommendations;
  }

  addSavingsRecommendations(recommendations, goal, tracking, result) {
    const monthlyRequired = (goal.target * (1 - tracking.progress)) / tracking.timeToGoal;
    
    if (monthlyRequired > result.availableSavings) {
      recommendations.push(
        `Increase monthly savings by $${(monthlyRequired - result.availableSavings).toFixed(2)} to reach goal`
      );
    }

    if (result.budgetAllocation.Savings < 20) {
      recommendations.push('Consider increasing your savings rate to accelerate progress');
    }
  }

  addDebtRecommendations(recommendations, goal, tracking, result) {
    const currentDebtPayment = result.monthlyIncome * 
      (result.budgetAllocation['Debt Payments'] / 100);
    
    if (tracking.timeToGoal > 36) {
      recommendations.push('Consider debt consolidation or refinancing to reduce interest costs');
    }

    if (currentDebtPayment < result.totalLiabilities * 0.03) {
      recommendations.push('Increase debt payments to avoid extended repayment periods');
    }
  }

  addIncomeRecommendations(recommendations, goal, tracking, result) {
    const monthlyGap = goal.target - result.monthlyIncome;
    
    if (monthlyGap > result.monthlyIncome * 0.5) {
      recommendations.push('Consider skill development or education to increase earning potential');
      recommendations.push('Explore additional income streams or side opportunities');
    }

    if (tracking.timeToGoal === Infinity) {
      recommendations.push('Current income growth rate is insufficient - consider career advancement strategies');
    }
  }
}
