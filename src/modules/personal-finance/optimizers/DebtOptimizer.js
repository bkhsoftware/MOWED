// optimizers/DebtOptimizer.js

export class DebtOptimizer {
  static optimize(input) {
    const {
      debts,
      monthlyPaymentCapacity,
      strategy = 'optimal',  // 'optimal', 'avalanche', 'snowball', or 'hybrid'
      minimumPayments = {},
      extraFunds = 0,
      riskTolerance = 3,  // 1-5 scale
      cashflowStability = 3  // 1-5 scale
    } = input;

    // Calculate total minimum payments
    const totalMinimumPayment = this.calculateTotalMinimumPayment(debts, minimumPayments);
    
    if (monthlyPaymentCapacity < totalMinimumPayment) {
      throw new Error('Monthly payment capacity is less than minimum payments required');
    }

    // Available for debt repayment beyond minimums
    const availableForExtra = monthlyPaymentCapacity - totalMinimumPayment + extraFunds;

    // Generate repayment strategies
    const strategies = {
      avalanche: this.generateAvalancheStrategy(debts, minimumPayments, availableForExtra),
      snowball: this.generateSnowballStrategy(debts, minimumPayments, availableForExtra),
      hybrid: this.generateHybridStrategy(debts, minimumPayments, availableForExtra, riskTolerance),
      optimal: this.generateOptimalStrategy(debts, minimumPayments, availableForExtra, {
        riskTolerance,
        cashflowStability
      })
    };

    // Select the best strategy based on input parameters
    const selectedStrategy = strategies[strategy];

    // Generate comprehensive repayment plan
    const repaymentPlan = this.generateRepaymentPlan(selectedStrategy, debts);

    return {
      selectedStrategy,
      repaymentPlan,
      metrics: this.calculateRepaymentMetrics(repaymentPlan),
      alternativeStrategies: this.compareStrategies(strategies),
      recommendations: this.generateRecommendations(
        selectedStrategy,
        repaymentPlan,
        input
      )
    };
  }

  static calculateTotalMinimumPayment(debts, minimumPayments) {
    return Object.entries(debts).reduce((total, [debtId, debt]) => {
      return total + (minimumPayments[debtId] || this.calculateMinimumPayment(debt));
    }, 0);
  }

  static calculateMinimumPayment(debt) {
    // Estimate minimum payment if not provided
    const { balance, interestRate } = debt;
    return Math.max(
      balance * 0.01, // 1% of balance
      balance * (interestRate / 12) * 1.1 // 110% of monthly interest
    );
  }

  static generateAvalancheStrategy(debts, minimumPayments, availableForExtra) {
    // Sort debts by interest rate (highest to lowest)
    const sortedDebts = Object.entries(debts)
      .sort(([, a], [, b]) => b.interestRate - a.interestRate);

    return this.allocateExtraPayments(sortedDebts, minimumPayments, availableForExtra);
  }

  static generateSnowballStrategy(debts, minimumPayments, availableForExtra) {
    // Sort debts by balance (lowest to highest)
    const sortedDebts = Object.entries(debts)
      .sort(([, a], [, b]) => a.balance - b.balance);

    return this.allocateExtraPayments(sortedDebts, minimumPayments, availableForExtra);
  }

  static generateHybridStrategy(debts, minimumPayments, availableForExtra, riskTolerance) {
    // Calculate a score for each debt based on both balance and interest rate
    const scoredDebts = Object.entries(debts).map(([id, debt]) => {
      const balanceScore = 1 - (debt.balance / Math.max(...Object.values(debts).map(d => d.balance)));
      const rateScore = debt.interestRate / Math.max(...Object.values(debts).map(d => d.interestRate));
      
      // Adjust weight based on risk tolerance
      const rateWeight = riskTolerance / 5;
      const score = (rateScore * rateWeight) + (balanceScore * (1 - rateWeight));

      return [id, { ...debt, score }];
    }).sort(([, a], [, b]) => b.score - a.score);

    return this.allocateExtraPayments(scoredDebts, minimumPayments, availableForExtra);
  }

  static generateOptimalStrategy(debts, minimumPayments, availableForExtra, params) {
    const { riskTolerance, cashflowStability } = params;

    // Calculate optimal allocation considering multiple factors
    const scoredDebts = Object.entries(debts).map(([id, debt]) => {
      const scores = {
        interest: debt.interestRate / Math.max(...Object.values(debts).map(d => d.interestRate)),
        balance: 1 - (debt.balance / Math.max(...Object.values(debts).map(d => d.balance))),
        risk: this.calculateDebtRisk(debt),
        urgency: this.calculateDebtUrgency(debt),
        impact: this.calculatePayoffImpact(debt, availableForExtra)
      };

      // Weight the scores based on parameters
      const weightedScore = this.calculateWeightedScore(scores, riskTolerance, cashflowStability);

      return [id, { ...debt, score: weightedScore }];
    }).sort(([, a], [, b]) => b.score - a.score);

    return this.allocateExtraPayments(scoredDebts, minimumPayments, availableForExtra);
  }

  static calculateDebtRisk(debt) {
    const riskFactors = {
      variableRate: debt.isVariableRate ? 0.2 : 0,
      secured: debt.isSecured ? -0.1 : 0,
      highInterest: debt.interestRate > 0.15 ? 0.3 : 0,
      balanceToLimit: (debt.balance / (debt.creditLimit || debt.balance)) * 0.2
    };

    return Object.values(riskFactors).reduce((sum, factor) => sum + factor, 0);
  }

  static calculateDebtUrgency(debt) {
    return {
      'credit-card': 0.9,
      'personal-loan': 0.7,
      'student-loan': 0.5,
      'auto-loan': 0.6,
      'mortgage': 0.4
    }[debt.type] || 0.5;
  }

  static calculatePayoffImpact(debt, availableForExtra) {
    // Calculate how quickly the debt can be paid off with available funds
    const monthsToPayoff = this.calculateMonthsToPayoff(debt.balance, debt.interestRate, availableForExtra);
    return 1 / monthsToPayoff;
  }

  static calculateWeightedScore(scores, riskTolerance, cashflowStability) {
    const weights = {
      interest: 0.3 * (riskTolerance / 5),
      balance: 0.2 * (cashflowStability / 5),
      risk: 0.2 * (1 - riskTolerance / 5),
      urgency: 0.15,
      impact: 0.15 * (cashflowStability / 5)
    };

    return Object.entries(scores).reduce((total, [factor, score]) => {
      return total + (score * weights[factor]);
    }, 0);
  }

  static allocateExtraPayments(sortedDebts, minimumPayments, availableForExtra) {
    const allocation = {};
    let remainingExtra = availableForExtra;

    // First, allocate minimum payments
    sortedDebts.forEach(([debtId, debt]) => {
      allocation[debtId] = minimumPayments[debtId] || this.calculateMinimumPayment(debt);
    });

    // Then, allocate extra payments to highest priority debt
    if (remainingExtra > 0 && sortedDebts.length > 0) {
      const [topDebtId] = sortedDebts[0];
      allocation[topDebtId] += remainingExtra;
    }

    return allocation;
  }

  static generateRepaymentPlan(strategy, debts) {
    const plan = [];
    const remainingDebts = { ...debts };
    let month = 0;
    let totalPaid = 0;

    while (Object.values(remainingDebts).some(debt => debt.balance > 0) && month < 360) {
      const monthlyPayments = {};
      let monthlyInterest = 0;

      // Calculate interest and apply payments
      Object.entries(remainingDebts).forEach(([debtId, debt]) => {
        const payment = strategy[debtId] || 0;
        const interest = debt.balance * (debt.interestRate / 12);
        monthlyInterest += interest;

        const principalPayment = Math.min(payment, debt.balance + interest);
        monthlyPayments[debtId] = principalPayment;
        totalPaid += principalPayment;

        // Update remaining balance
        remainingDebts[debtId] = {
          ...debt,
          balance: Math.max(0, debt.balance + interest - principalPayment)
        };
      });

      plan.push({
        month: month + 1,
        payments: monthlyPayments,
        remainingBalances: { ...remainingDebts },
        interest: monthlyInterest,
        totalPaid
      });

      month++;
    }

    return plan;
  }

  static calculateRepaymentMetrics(repaymentPlan) {
    const lastMonth = repaymentPlan[repaymentPlan.length - 1];
    
    return {
      totalMonths: repaymentPlan.length,
      totalInterestPaid: repaymentPlan.reduce((sum, month) => sum + month.interest, 0),
      totalPaid: lastMonth.totalPaid,
      averageMonthlyPayment: lastMonth.totalPaid / repaymentPlan.length,
      monthlyInterestSaved: this.calculateInterestSavings(repaymentPlan)
    };
  }

  static calculateInterestSavings(repaymentPlan) {
    // Calculate interest savings compared to minimum payments
    const withStrategy = repaymentPlan[repaymentPlan.length - 1].interest;
    const withMinimum = repaymentPlan[0].interest;
    return withMinimum - withStrategy;
  }

  static compareStrategies(strategies) {
    const comparisons = {};

    Object.entries(strategies).forEach(([name, strategy]) => {
      comparisons[name] = {
        totalInterest: this.calculateTotalInterest(strategy),
        payoffTime: this.calculatePayoffTime(strategy),
        monthlyImpact: this.calculateMonthlyImpact(strategy),
        riskProfile: this.assessRiskProfile(strategy)
      };
    });

    return comparisons;
  }

  static generateRecommendations(strategy, repaymentPlan, input) {
    const recommendations = [];

    // Analyze repayment trajectory
    const metrics = this.calculateRepaymentMetrics(repaymentPlan);

    // Payment increase recommendations
    if (input.extraFunds === 0) {
      recommendations.push({
        type: 'payment',
        priority: 'high',
        suggestion: 'Look for ways to increase debt payments',
        impact: `Could reduce payoff time by ${this.calculateTimeReduction(metrics.totalMonths, 0.1)} months with 10% more payment`
      });
    }

    // High interest debt recommendations
    const highInterestDebts = Object.entries(input.debts)
      .filter(([, debt]) => debt.interestRate > 0.15);
    
    if (highInterestDebts.length > 0) {
      recommendations.push({
        type: 'refinance',
        priority: 'high',
        suggestion: 'Consider refinancing high-interest debts',
        impact: `Could save ${this.calculateRefinanceSavings(highInterestDebts)} in interest`
      });
    }

    // Cash flow management
    if (metrics.averageMonthlyPayment > input.monthlyPaymentCapacity * 0.5) {
      recommendations.push({
        type: 'cashflow',
        priority: 'medium',
        suggestion: 'Review budget for additional debt payment capacity',
        impact: 'Reduce financial stress and create buffer for emergencies'
      });
    }

    return recommendations;
  }

  static calculateMonthsToPayoff(balance, rate, payment) {
    if (payment <= balance * (rate / 12)) {
      return Infinity;
    }
    
    return Math.ceil(
      Math.log(payment / (payment - balance * (rate / 12))) /
      Math.log(1 + rate / 12)
    );
  }

  static calculateTimeReduction(currentMonths, paymentIncrease) {
    // Estimate time reduction with increased payments
    return Math.floor(currentMonths * paymentIncrease);
  }

  static calculateRefinanceSavings(highInterestDebts) {
    // Estimate savings with a conservative refinance rate of 10%
    const refinanceRate = 0.10;
    return highInterestDebts.reduce((savings, [, debt]) => {
      const currentMonthlyInterest = debt.balance * (debt.interestRate / 12);
      const refinancedMonthlyInterest = debt.balance * (refinanceRate / 12);
      return savings + (currentMonthlyInterest - refinancedMonthlyInterest) * 12;
    }, 0);
  }
}
