// calculators/RetirementCalculator.js

export class RetirementCalculator {
  static calculate(input) {
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
      input.yearsInRetirement * 12
    );

    return {
      yearsUntilRetirement,
      yearsInRetirement: input.yearsInRetirement,
      retirementSavingsAtRetirement,
      monthlyRetirementIncome,
      desiredMonthlyRetirementIncome: input.desiredRetirementIncome / 12,
      retirementIncomeGap: (input.desiredRetirementIncome / 12) - monthlyRetirementIncome,
      savingsRate: (input.monthlyRetirementContribution / input.monthlyIncome) * 100,
      projectedCoverageRatio: monthlyRetirementIncome / (input.desiredRetirementIncome / 12),
      additionalSavingsNeeded: this.calculateAdditionalSavingsNeeded(
        input,
        monthlyRetirementIncome,
        monthsUntilRetirement
      )
    };
  }

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
}
