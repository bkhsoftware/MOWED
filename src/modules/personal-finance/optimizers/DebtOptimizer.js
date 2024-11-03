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
      cashflowStability = 3,  // 1-5 scale
      taxInfo = {} // New parameter
    } = input;

    const {
      marginalRate = 0.25,
      stateRate = 0,
      filingStatus = 'single',
      itemizingDeductions = false,
      standardDeduction = 12950, // 2024 standard deduction for single filer
      otherDeductions = 0
    } = taxInfo;

    // Calculate effective tax rates
    const effectiveTaxRate = marginalRate + stateRate;

    // Analyze tax deductibility of debts
    const debtAnalysis = this.analyzeDebtDeductibility(
      debts,
      {
        effectiveTaxRate,
        itemizingDeductions,
        standardDeduction,
        otherDeductions
      }
    );

    // Calculate total minimum payments
    const totalMinimumPayment = this.calculateTotalMinimumPayment(debts, minimumPayments);
    
    if (monthlyPaymentCapacity < totalMinimumPayment) {
      throw new Error('Monthly payment capacity is less than minimum payments required');
    }

    // Available for debt repayment beyond minimums
    const availableForExtra = monthlyPaymentCapacity - totalMinimumPayment + extraFunds;

    // Generate repayment strategies
    const strategies = {
      avalanche: this.generateAvalancheStrategy(
        debts, 
        minimumPayments, 
        availableForExtra,
        debtAnalysis
      ),
      snowball: this.generateSnowballStrategy(
        debts,
        minimumPayments,
        availableForExtra,
        debtAnalysis
      ),
      hybrid: this.generateHybridStrategy(
        debts,
        minimumPayments,
        availableForExtra,
        riskTolerance,
        debtAnalysis
      ),
      optimal: this.generateOptimalStrategy(
        debts,
        minimumPayments,
        availableForExtra,
        {
          riskTolerance,
          cashflowStability,
          debtAnalysis,
          taxInfo
        }
      )
    };

    // Select the best strategy based on input parameters
    const selectedStrategy = strategies[strategy];

    // Generate comprehensive repayment plan
    const repaymentPlan = this.generateRepaymentPlan(selectedStrategy, debts, debtAnalysis);

    return {
      selectedStrategy,
      repaymentPlan,
      metrics: this.calculateRepaymentMetrics(repaymentPlan, taxInfo),
      alternativeStrategies: this.compareStrategies(strategies, taxInfo),
      taxBenefits: this.calculateTaxBenefits(repaymentPlan, taxInfo),
      recommendations: this.generateRecommendations(
        selectedStrategy,
        repaymentPlan,
        input,
        debtAnalysis
      )
    };
  }

  static analyzeDebtDeductibility(debts, taxInfo) {
    const { effectiveTaxRate, itemizingDeductions, standardDeduction, otherDeductions } = taxInfo;
    const analysis = {};
    
    // Calculate total potential deductions to determine if itemizing is beneficial
    const totalInterest = Object.entries(debts).reduce((sum, [debtId, debt]) => {
      const isDeductible = this.isInterestDeductible(debtId, debt);
      const annualInterest = debt.balance * debt.interestRate;
      return sum + (isDeductible ? annualInterest : 0);
    }, 0);

    const shouldItemize = (totalInterest + otherDeductions) > standardDeduction;
    
    Object.entries(debts).forEach(([debtId, debt]) => {
      const deductibility = this.calculateDeductibility(
        debtId,
        debt,
        effectiveTaxRate,
        shouldItemize
      );

      analysis[debtId] = {
        ...deductibility,
        effectiveInterestRate: this.calculateEffectiveRate(debt.interestRate, deductibility)
      };
    });

    return {
      debtAnalysis: analysis,
      totalDeductions: totalInterest + otherDeductions,
      shouldItemize,
      taxSavings: shouldItemize ? 
        (totalInterest + otherDeductions - standardDeduction) * effectiveTaxRate : 0
    };
  }

  static isInterestDeductible(debtId, debt) {
    const deductibleTypes = {
      'Secured Debts-Mortgage': {
        limit: 750000,  // TCJA limit for new mortgages
        type: 'mortgage'
      },
      'Student Loans-Federal Student Loans': {
        limit: 2500,
        type: 'student'
      },
      'Student Loans-Private Student Loans': {
        limit: 2500,
        type: 'student'
      },
      'Secured Debts-Home Equity Loans': {
        limit: 100000,
        type: 'homeEquity',
        requiresHomeImprovement: true
      }
    };

    return deductibleTypes[debtId] !== undefined;
  }

  static calculateDeductibility(debtId, debt, effectiveTaxRate, shouldItemize) {
    if (!this.isInterestDeductible(debtId, debt) || !shouldItemize) {
      return {
        isDeductible: false,
        deductibleAmount: 0,
        taxBenefit: 0
      };
    }

    const annualInterest = debt.balance * debt.interestRate;
    const limits = this.getDeductibilityLimits(debtId);
    const deductibleAmount = Math.min(annualInterest, limits.amount);
    
    return {
      isDeductible: true,
      deductibleAmount,
      taxBenefit: deductibleAmount * effectiveTaxRate,
      limits
    };
  }

  static getDeductibilityLimits(debtId) {
    const limits = {
      'Secured Debts-Mortgage': {
        amount: 750000,
        type: 'principal'
      },
      'Student Loans-Federal Student Loans': {
        amount: 2500,
        type: 'interest'
      },
      'Student Loans-Private Student Loans': {
        amount: 2500,
        type: 'interest'
      }
    };

    return limits[debtId] || { amount: 0, type: 'none' };
  }

  static calculateEffectiveRate(nominalRate, deductibility) {
    if (!deductibility.isDeductible) return nominalRate;
    
    const taxBenefitRate = deductibility.taxBenefit / 
      (deductibility.deductibleAmount / nominalRate);
    
    return nominalRate * (1 - taxBenefitRate);
  }

  static generateOptimalStrategy(debts, minimumPayments, availableForExtra, params) {
    const { riskTolerance, cashflowStability, debtAnalysis, taxInfo } = params;
    
    // Score each debt based on multiple factors
    const debtScores = Object.entries(debts).reduce((scores, [debtId, debt]) => {
      scores[debtId] = this.calculateDebtPriorityScore({
        debt,
        debtAnalysis: debtAnalysis.debtAnalysis[debtId],
        riskTolerance,
        cashflowStability,
        taxInfo
      });
      return scores;
    }, {});

    // Allocate payments based on scores
    return this.allocatePaymentsOptimally(
      debtScores,
      debts,
      minimumPayments,
      availableForExtra
    );
  }

  static calculateDebtPriorityScore(params) {
    const {
      debt,
      debtAnalysis,
      riskTolerance,
      cashflowStability,
      taxInfo
    } = params;

    // Base score from effective interest rate
    let score = debtAnalysis.effectiveInterestRate * 100;

    // Adjust for risk factors
    if (debt.isVariableRate) {
      score += (5 - riskTolerance) * 10;
    }

    if (debt.isSecured) {
      score += (5 - riskTolerance) * 15;
    }

    // Adjust for tax benefits
    if (debtAnalysis.isDeductible) {
      score -= (debtAnalysis.taxBenefit / debt.balance) * 100;
    }

    // Adjust for cashflow stability
    if (cashflowStability < 3) {
      score += debt.minimumPayment / (debt.balance * debt.interestRate) * 10;
    }

    return score;
  }

  static allocatePaymentsOptimally(scores, debts, minimumPayments, availableExtra) {
    const allocation = {};
    
    // First allocate minimum payments
    Object.keys(debts).forEach(debtId => {
      allocation[debtId] = minimumPayments[debtId] || 
        this.calculateMinimumPayment(debts[debtId]);
    });

    // Allocate extra payments based on scores
    const sortedDebts = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
    
    if (availableExtra > 0 && sortedDebts.length > 0) {
      const [topDebtId] = sortedDebts[0];
      allocation[topDebtId] += availableExtra;
    }

    return allocation;
  }

  static generateRepaymentPlan(strategy, debts, debtAnalysis) {
    const plan = [];
    const remainingDebts = { ...debts };
    let month = 0;
    let totalPaid = 0;
    let totalTaxBenefit = 0;

    while (Object.values(remainingDebts).some(debt => debt.balance > 0) && month < 360) {
      const monthlyPayments = {};
      let monthlyInterest = 0;
      let monthlyTaxBenefit = 0;

      // Calculate interest and apply payments
      Object.entries(remainingDebts).forEach(([debtId, debt]) => {
        const payment = strategy[debtId] || 0;
        const interest = debt.balance * (debt.interestRate / 12);
        monthlyInterest += interest;

        // Calculate tax benefit
        const debtTaxAnalysis = debtAnalysis.debtAnalysis[debtId];
        if (debtTaxAnalysis.isDeductible) {
          monthlyTaxBenefit += (interest * debtTaxAnalysis.taxBenefit) / 12;
        }

        const principalPayment = Math.min(payment, debt.balance + interest);
        monthlyPayments[debtId] = principalPayment;
        totalPaid += principalPayment;
        totalTaxBenefit += monthlyTaxBenefit;

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
        taxBenefit: monthlyTaxBenefit,
        totalPaid,
        totalTaxBenefit
      });

      month++;
    }

    return plan;
  }

  static calculateRepaymentMetrics(repaymentPlan, taxInfo) {
    const lastMonth = repaymentPlan[repaymentPlan.length - 1];
    const totalInterestPaid = repaymentPlan.reduce((sum, month) => sum + month.interest, 0);
    
    return {
      totalMonths: repaymentPlan.length,
      totalInterestPaid,
      totalTaxBenefit: lastMonth.totalTaxBenefit,
      netInterestCost: totalInterestPaid - lastMonth.totalTaxBenefit,
      totalPaid: lastMonth.totalPaid,
      averageMonthlyPayment: lastMonth.totalPaid / repaymentPlan.length,
      effectiveInterestRate: this.calculateEffectiveInterestRate(
        totalInterestPaid,
        lastMonth.totalTaxBenefit,
        lastMonth.totalPaid
      ),
      taxDeductionValue: this.calculateTaxDeductionValue(
        repaymentPlan,
        taxInfo
      )
    };
  }

  static calculateTaxDeductionValue(repaymentPlan, taxInfo) {
    const { marginalRate, stateRate } = taxInfo;
    const effectiveRate = marginalRate + stateRate;
    
    return repaymentPlan.reduce((value, month) => 
      value + month.taxBenefit * effectiveRate, 0);
  }

  static generateRecommendations(strategy, repaymentPlan, input, debtAnalysis) {
    const recommendations = [];

    // Check if itemizing would be beneficial
    if (!input.taxInfo.itemizingDeductions && debtAnalysis.shouldItemize) {
      recommendations.push({
        type: 'tax',
        priority: 'high',
        suggestion: 'Consider itemizing deductions',
        impact: `Could save $${debtAnalysis.taxSavings.toFixed(2)} in taxes annually`,
        actions: [
          'Track all deductible interest payments',
          'Consult with tax professional',
          'Gather documentation for other potential deductions'
        ]
      });
    }

    // Consolidation recommendations
    const consolidationOpportunities = this.identifyConsolidationOpportunities(input.debts, debtAnalysis);
    if (consolidationOpportunities.length > 0) {
      recommendations.push({
        type: 'consolidation',
        priority: 'medium',
        suggestion: 'Consider debt consolidation',
        impact: `Potential interest savings of $${this.calculateConsolidationSavings(consolidationOpportunities).toFixed(2)}`,
        opportunities: consolidationOpportunities,
        actions: [
          'Research consolidation loan options',
          'Compare interest rates and terms',
          'Calculate total cost including fees'
        ]
      });
    }

    // Refinancing recommendations
    const refinancingOpportunities = this.identifyRefinancingOpportunities(input.debts, debtAnalysis);
    if (refinancingOpportunities.length > 0) {
      recommendations.push({
        type: 'refinancing',
        priority: 'high',
        suggestion: 'Consider refinancing high-interest debts',
        impact: `Potential interest savings of $${this.calculateRefinancingSavings(refinancingOpportunities).toFixed(2)}`,
        opportunities: refinancingOpportunities,
        actions: [
          'Shop for better interest rates',
          'Check credit score and history',
          'Compare loan terms and conditions'
        ]
      });
    }

    // Payment timing recommendations
    const timingOptimizations = this.analyzePaymentTiming(strategy, input.debts);
    if (timingOptimizations.potentialSavings > 0) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        suggestion: 'Optimize payment timing',
        impact: `Potential interest savings of $${timingOptimizations.potentialSavings.toFixed(2)}`,
        actions: timingOptimizations.recommendations
      });
    }

    // Tax strategy recommendations
    const taxStrategyOpportunities = this.identifyTaxStrategyOpportunities(input.debts, debtAnalysis);
    if (taxStrategyOpportunities.length > 0) {
      recommendations.push({
        type: 'tax_strategy',
        priority: 'medium',
        suggestion: 'Optimize tax strategy',
        impact: `Potential tax savings of $${this.calculateTaxStrategySavings(taxStrategyOpportunities).toFixed(2)}`,
        opportunities: taxStrategyOpportunities,
        actions: [
          'Prioritize payments on tax-advantaged debts',
          'Time major payments for maximum tax benefit',
          'Document all deductible interest payments'
        ]
      });
    }

    return recommendations;
  }

  static identifyConsolidationOpportunities(debts, debtAnalysis) {
    const opportunities = [];
    const highInterestDebts = Object.entries(debts)
      .filter(([id, debt]) => {
        const effectiveRate = debtAnalysis.debtAnalysis[id].effectiveInterestRate;
        return effectiveRate > 0.08 && debt.balance < 50000; // 8% threshold
      });

    if (highInterestDebts.length >= 2) {
      const totalBalance = highInterestDebts.reduce((sum, [, debt]) => sum + debt.balance, 0);
      const avgRate = highInterestDebts.reduce((sum, [, debt]) => 
        sum + debt.interestRate * (debt.balance / totalBalance), 0);

      opportunities.push({
        debts: highInterestDebts.map(([id]) => id),
        totalBalance,
        averageRate: avgRate,
        estimatedNewRate: Math.min(avgRate - 0.03, 0.15), // Assume 3% reduction
        potentialSavings: this.calculatePotentialConsolidationSavings(totalBalance, avgRate, Math.min(avgRate - 0.03, 0.15))
      });
    }

    return opportunities;
  }

  static calculateConsolidationSavings(opportunities) {
    return opportunities.reduce((total, opportunity) => 
      total + opportunity.potentialSavings, 0);
  }

  static calculatePotentialConsolidationSavings(balance, currentRate, newRate) {
    const currentMonthlyPayment = this.calculateMonthlyPayment(balance, currentRate, 60);
    const newMonthlyPayment = this.calculateMonthlyPayment(balance, newRate, 60);
    return (currentMonthlyPayment - newMonthlyPayment) * 60;
  }

  static identifyRefinancingOpportunities(debts, debtAnalysis) {
    return Object.entries(debts)
      .filter(([id, debt]) => {
        const effectiveRate = debtAnalysis.debtAnalysis[id].effectiveInterestRate;
        const currentMarketRate = this.getMarketRate(debt.type);
        return effectiveRate > currentMarketRate + 0.02; // 2% threshold
      })
      .map(([id, debt]) => ({
        debtId: id,
        currentRate: debt.interestRate,
        marketRate: this.getMarketRate(debt.type),
        balance: debt.balance,
        potentialSavings: this.calculateRefinancingSavings([{
          balance: debt.balance,
          currentRate: debt.interestRate,
          marketRate: this.getMarketRate(debt.type)
        }])
      }));
  }

  static getMarketRate(debtType) {
    // Approximate current market rates
    const marketRates = {
      mortgage: 0.065,
      'auto-loan': 0.055,
      'student-loan': 0.045,
      'personal-loan': 0.10,
      'credit-card': 0.165
    };
    return marketRates[debtType] || 0.10;
  }

  static analyzePaymentTiming(strategy, debts) {
    const baseInterest = this.calculateAnnualInterest(debts);
    const optimizedStrategy = this.optimizePaymentTiming(strategy, debts);
    const optimizedInterest = this.calculateAnnualInterest(debts, optimizedStrategy);

    return {
      potentialSavings: baseInterest - optimizedInterest,
      recommendations: [
        'Make payments early in billing cycle',
        'Split monthly payments into bi-weekly payments',
        'Align payment dates with income dates'
      ]
    };
  }

  static calculateAnnualInterest(debts, strategy = null) {
    return Object.entries(debts).reduce((total, [id, debt]) => {
      const payment = strategy ? strategy[id] : debt.minimumPayment;
      const monthlyRate = debt.interestRate / 12;
      return total + (debt.balance * monthlyRate - payment) * 12;
    }, 0);
  }

  static optimizePaymentTiming(strategy, debts) {
    // Create optimized payment schedule
    const optimized = { ...strategy };
    
    Object.entries(debts).forEach(([id, debt]) => {
      const currentPayment = strategy[id];
      if (currentPayment > debt.minimumPayment) {
        // Split payment into bi-weekly for extra payments
        optimized[id] = {
          amount: currentPayment,
          frequency: 'bi-weekly',
          dayOfMonth: this.calculateOptimalPaymentDay(debt)
        };
      }
    });

    return optimized;
  }

  static calculateOptimalPaymentDay(debt) {
    // Aim for just after typical income dates
    return debt.dueDate > 15 ? 16 : 1;
  }

  static identifyTaxStrategyOpportunities(debts, debtAnalysis) {
    return Object.entries(debts)
      .filter(([id]) => debtAnalysis.debtAnalysis[id].isDeductible)
      .map(([id, debt]) => ({
        debtId: id,
        deductibleAmount: debtAnalysis.debtAnalysis[id].deductibleAmount,
        currentBenefit: debtAnalysis.debtAnalysis[id].taxBenefit,
        potentialBenefit: this.calculatePotentialTaxBenefit(debt, debtAnalysis.debtAnalysis[id]),
        strategies: this.generateTaxStrategies(debt, debtAnalysis.debtAnalysis[id])
      }));
  }

  static calculatePotentialTaxBenefit(debt, analysis) {
    if (!analysis.isDeductible) return 0;
    const maxDeduction = analysis.limits.amount;
    const currentDeduction = analysis.deductibleAmount;
    return (maxDeduction - currentDeduction) * analysis.taxBenefitRate;
  }

  static generateTaxStrategies(debt, analysis) {
    const strategies = [];

    if (analysis.deductibleAmount < analysis.limits.amount) {
      strategies.push({
        type: 'increase_deduction',
        description: 'Increase deductible interest payments',
        potentialBenefit: this.calculatePotentialTaxBenefit(debt, analysis)
      });
    }

    if (debt.type === 'mortgage' && analysis.limits.type === 'principal') {
      strategies.push({
        type: 'points_deduction',
        description: 'Consider paying points for additional deduction',
        potentialBenefit: this.calculatePointsDeductionBenefit(debt, analysis)
      });
    }

    return strategies;
  }

  static calculatePointsDeductionBenefit(debt, analysis) {
    const pointCost = debt.balance * 0.01; // 1 point = 1% of loan
    return (pointCost * analysis.taxBenefitRate) / debt.term;
  }

  static calculateMonthlyPayment(principal, annualRate, months) {
    const monthlyRate = annualRate / 12;
    return principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  static calculateEffectiveInterestRate(totalInterest, taxBenefit, totalPaid) {
    const netInterest = totalInterest - taxBenefit;
    return (netInterest / totalPaid) * 12; // Annualized rate
  }

  static calculateTaxStrategySavings(opportunities) {
    return opportunities.reduce((total, opp) => 
      total + (opp.potentialBenefit - opp.currentBenefit), 0);
  }

  static generateAvalancheStrategy(debts, minimumPayments, availableExtra, debtAnalysis) {
    const sortedDebts = Object.entries(debts)
      .sort(([idA, a], [idB, b]) => {
        const effectiveRateA = debtAnalysis.debtAnalysis[idA].effectiveInterestRate;
        const effectiveRateB = debtAnalysis.debtAnalysis[idB].effectiveInterestRate;
        return effectiveRateB - effectiveRateA;
      });

    return this.allocatePayments(sortedDebts, minimumPayments, availableExtra);
  }

  static generateSnowballStrategy(debts, minimumPayments, availableExtra, debtAnalysis) {
    const sortedDebts = Object.entries(debts)
      .sort(([, a], [, b]) => a.balance - b.balance);

    return this.allocatePayments(sortedDebts, minimumPayments, availableExtra);
  }

  static generateHybridStrategy(debts, minimumPayments, availableExtra, riskTolerance, debtAnalysis) {
    const scoredDebts = Object.entries(debts).map(([id, debt]) => {
      const balanceScore = 1 - (debt.balance / Math.max(...Object.values(debts).map(d => d.balance)));
      const rateScore = debtAnalysis.debtAnalysis[id].effectiveInterestRate / 
                       Math.max(...Object.values(debtAnalysis.debtAnalysis)
                         .map(d => d.effectiveInterestRate));
      
      const rateWeight = riskTolerance / 5;
      const score = (rateScore * rateWeight) + (balanceScore * (1 - rateWeight));

      return [id, { ...debt, score }];
    }).sort(([, a], [, b]) => b.score - a.score);

    return this.allocatePayments(scoredDebts, minimumPayments, availableExtra);
  }

  static allocatePayments(sortedDebts, minimumPayments, availableExtra) {
    const allocation = {};
    
    // Allocate minimum payments
    sortedDebts.forEach(([debtId]) => {
      allocation[debtId] = minimumPayments[debtId] || 0;
    });

    // Allocate extra to highest priority debt
    if (availableExtra > 0 && sortedDebts.length > 0) {
      allocation[sortedDebts[0][0]] += availableExtra;
    }

    return allocation;
  }

  static compareStrategies(strategies, taxInfo) {
    return Object.entries(strategies).reduce((comparison, [name, strategy]) => {
      comparison[name] = {
        totalInterestPaid: this.calculateTotalInterest(strategy),
        payoffTime: this.calculatePayoffTime(strategy),
        taxSavings: this.calculateStrategyTaxSavings(strategy, taxInfo),
        netCost: this.calculateNetCost(strategy, taxInfo)
      };
      return comparison;
    }, {});
  }

  static calculateTotalInterest(strategy) {
    return Object.values(strategy).reduce((total, payment) => total + payment, 0);
  }

  static calculatePayoffTime(strategy) {
    return Object.keys(strategy).length;
  }

  static calculateStrategyTaxSavings(strategy, taxInfo) {
    const { marginalRate = 0.25, stateRate = 0 } = taxInfo;
    const effectiveRate = marginalRate + stateRate;
    return this.calculateTotalInterest(strategy) * effectiveRate;
  }

  static calculateNetCost(strategy, taxInfo) {
    return this.calculateTotalInterest(strategy) - 
           this.calculateStrategyTaxSavings(strategy, taxInfo);
  }

static calculateTaxBenefits(repaymentPlan, taxInfo) {
    const { marginalRate = 0.25, stateRate = 0 } = taxInfo;
    const effectiveRate = marginalRate + stateRate;
    
    const annualDeduction = repaymentPlan.reduce((sum, month) => 
      sum + month.interest, 0);
    
    const taxSavings = repaymentPlan.reduce((sum, month) => 
      sum + month.taxBenefit, 0);

    const interestPaid = repaymentPlan.reduce((sum, month) => 
      sum + month.interest, 0);

    return {
      annualDeduction,
      taxSavings,
      effectiveSavingsRate: effectiveRate,
      netBenefit: taxSavings - (annualDeduction * effectiveRate),
      yearByYear: this.calculateYearlyTaxBenefits(repaymentPlan, taxInfo),
      recommendations: this.generateTaxBenefitRecommendations(
        annualDeduction,
        taxSavings,
        interestPaid,
        taxInfo
      )
    };
  }

  static calculateYearlyTaxBenefits(repaymentPlan, taxInfo) {
    const yearlyBenefits = {};
    const { marginalRate, stateRate } = taxInfo;
    const effectiveRate = marginalRate + stateRate;

    repaymentPlan.forEach(month => {
      const year = Math.floor((month.month - 1) / 12);
      if (!yearlyBenefits[year]) {
        yearlyBenefits[year] = {
          interest: 0,
          taxBenefit: 0,
          effectiveRate
        };
      }
      yearlyBenefits[year].interest += month.interest;
      yearlyBenefits[year].taxBenefit += month.taxBenefit;
    });

    return Object.entries(yearlyBenefits).map(([year, benefits]) => ({
      year: Number(year),
      ...benefits,
      netBenefit: benefits.taxBenefit - (benefits.interest * effectiveRate)
    }));
  }

  static generateTaxBenefitRecommendations(annualDeduction, taxSavings, interestPaid, taxInfo) {
    const recommendations = [];
    const { itemizingDeductions, standardDeduction } = taxInfo;

    // Check if itemizing would be more beneficial
    if (!itemizingDeductions && annualDeduction > standardDeduction) {
      recommendations.push({
        type: 'itemize',
        priority: 'high',
        suggestion: 'Switch to itemized deductions',
        impact: `Additional tax savings of $${(
          (annualDeduction - standardDeduction) * 
          (taxInfo.marginalRate + taxInfo.stateRate)
        ).toFixed(2)}`
      });
    }

    // Analyze timing of payments
    if (annualDeduction > 0) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        suggestion: 'Optimize payment timing for tax benefits',
        actions: [
          'Consider making January payments in December',
          'Track payment dates for maximum annual deduction',
          'Keep detailed records of interest payments'
        ]
      });
    }

    // Evaluate debt consolidation for tax purposes
    if (this.shouldConsiderConsolidation(interestPaid, taxSavings, taxInfo)) {
      recommendations.push({
        type: 'consolidation',
        priority: 'medium',
        suggestion: 'Consider tax-advantaged debt consolidation',
        impact: 'Potential for increased tax-deductible interest',
        actions: [
          'Research home equity loan options',
          'Compare tax benefits of different loan types',
          'Consult tax professional for guidance'
        ]
      });
    }

    return recommendations;
  }

  static shouldConsiderConsolidation(interestPaid, taxSavings, taxInfo) {
    const effectiveRate = taxInfo.marginalRate + taxInfo.stateRate;
    const currentBenefitRate = taxSavings / interestPaid;
    return currentBenefitRate < effectiveRate * 0.7; // Less than 70% of potential benefit
  }

  static calculateMinimumPayment(debt) {
    // Calculate minimum payment based on debt type and terms
    const monthlyRate = debt.interestRate / 12;
    
    switch(debt.type) {
      case 'credit-card':
        return Math.max(
          debt.balance * 0.02, // 2% of balance minimum
          debt.balance * monthlyRate * 1.1 // 110% of monthly interest
        );
        
      case 'mortgage':
        return this.calculateAmortizingPayment(
          debt.balance,
          monthlyRate,
          debt.term || 360 // 30 years default
        );
        
      case 'auto-loan':
        return this.calculateAmortizingPayment(
          debt.balance,
          monthlyRate,
          debt.term || 60 // 5 years default
        );
        
      case 'personal-loan':
        return this.calculateAmortizingPayment(
          debt.balance,
          monthlyRate,
          debt.term || 36 // 3 years default
        );
        
      default:
        // Default to interest plus 1% of principal
        return debt.balance * (monthlyRate + 0.01);
    }
  }

  static calculateAmortizingPayment(principal, monthlyRate, months) {
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
           (Math.pow(1 + monthlyRate, months) - 1);
  }

  static calculateTotalMinimumPayment(debts, minimumPayments) {
    return Object.entries(debts).reduce((total, [debtId, debt]) => {
      return total + (minimumPayments[debtId] || this.calculateMinimumPayment(debt));
    }, 0);
  }

  static generateMonthlyReport(month, payments, balances, taxBenefits) {
    return {
      month,
      payments: this.summarizePayments(payments),
      balances: this.summarizeBalances(balances),
      taxBenefits: this.summarizeTaxBenefits(taxBenefits),
      progress: this.calculateProgress(balances, payments),
      projections: this.generateProjections(balances, payments, taxBenefits)
    };
  }

  static summarizePayments(payments) {
    return {
      total: Object.values(payments).reduce((sum, p) => sum + p, 0),
      byDebt: payments,
      distribution: this.calculatePaymentDistribution(payments)
    };
  }

  static summarizeBalances(balances) {
    return {
      total: Object.values(balances).reduce((sum, b) => sum + b.balance, 0),
      byDebt: balances,
      trends: this.calculateBalanceTrends(balances)
    };
  }

  static summarizeTaxBenefits(taxBenefits) {
    return {
      monthly: taxBenefits.monthly,
      ytd: taxBenefits.ytd,
      projected: taxBenefits.projected,
      optimization: this.calculateTaxOptimization(taxBenefits)
    };
  }

  static calculateProgress(balances, initialBalances) {
    const totalInitial = Object.values(initialBalances)
      .reduce((sum, balance) => sum + balance, 0);
    const totalCurrent = Object.values(balances)
      .reduce((sum, balance) => sum + balance.balance, 0);
    
    return {
      percentagePaid: ((totalInitial - totalCurrent) / totalInitial) * 100,
      remainingBalance: totalCurrent,
      paidToDate: totalInitial - totalCurrent
    };
  }

  static calculatePaymentDistribution(payments) {
    const total = Object.values(payments).reduce((sum, p) => sum + p, 0);
    return Object.entries(payments).reduce((dist, [debtId, payment]) => {
      dist[debtId] = (payment / total) * 100;
      return dist;
    }, {});
  }

  static calculateBalanceTrends(balances) {
    return Object.entries(balances).map(([debtId, balance]) => ({
      debtId,
      currentBalance: balance.balance,
      monthlyChange: balance.monthlyChange,
      projectedPayoff: balance.projectedPayoff
    }));
  }

  static calculateTaxOptimization(taxBenefits) {
    return {
      currentEfficiency: taxBenefits.efficiency,
      potentialImprovement: taxBenefits.potentialImprovement,
      recommendedActions: taxBenefits.recommendations
    };
  }
}
