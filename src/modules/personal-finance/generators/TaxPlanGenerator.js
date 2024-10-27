// generators/TaxPlanGenerator.js

export class TaxPlanGenerator {
  static generateTaxPlan(strategies, input) {
    return {
      currentYear: this.generateCurrentYearPlan(strategies, input),
      shortTerm: this.generateShortTermPlan(strategies, input),
      longTerm: this.generateLongTermPlan(strategies, input),
      timeline: this.generateActionTimeline(strategies, input),
      contingencies: this.generateContingencyPlans(strategies, input)
    };
  }

  static generateCurrentYearPlan(strategies, input) {
    return {
      deductions: {
        strategy: strategies.deductions.optimal,
        actions: this.generateDeductionActions(strategies.deductions),
        estimatedSavings: this.calculateDeductionSavings(strategies.deductions, input)
      },
      retirement: {
        contributions: strategies.retirement.contributions,
        taxSavings: strategies.retirement.taxSavings,
        actions: this.generateRetirementActions(strategies.retirement)
      },
      investments: {
        locationStrategy: strategies.investments.assetLocations,
        harvestingActions: this.generateHarvestingActions(strategies.investments),
        rebalancing: strategies.investments.rebalancingStrategy
      },
      timing: {
        incomeDeferral: this.generateTimingStrategy(strategies.timing),
        estimatedImpact: this.calculateTimingImpact(strategies.timing, input)
      }
    };
  }

  static generateShortTermPlan(strategies, input) {
    const nextTwoYears = [];
    
    // Project tax situations for next two years
    for (let year = 1; year <= 2; year++) {
      const projectedIncome = this.projectIncome(input.income, year);
      const projectedDeductions = this.projectDeductions(strategies.deductions, year);
      
      nextTwoYears.push({
        year: new Date().getFullYear() + year,
        strategies: {
          deductionStrategy: this.generateDeductionStrategy(projectedIncome, projectedDeductions),
          retirementStrategy: this.generateRetirementStrategy(projectedIncome, input, year),
          investmentStrategy: this.generateInvestmentStrategy(strategies.investments, year),
          timingStrategy: this.generateTimingStrategy(projectedIncome, input.filingStatus)
        },
        actions: this.generateYearlyActions(year, strategies, input),
        milestones: this.generateYearlyMilestones(year, strategies),
        estimatedSavings: this.calculateYearlySavings(projectedIncome, strategies, year)
      });
    }

    return {
      years: nextTwoYears,
      focusAreas: this.identifyShortTermFocusAreas(strategies, input),
      keyActions: this.prioritizeShortTermActions(nextTwoYears),
      riskFactors: this.identifyShortTermRisks(strategies, input)
    };
  }

  static generateLongTermPlan(strategies, input) {
    const timeHorizon = this.determineLongTermHorizon(input);
    const phases = this.identifyLongTermPhases(input);
    
    return {
      horizon: timeHorizon,
      phases: phases.map(phase => ({
        name: phase.name,
        years: phase.years,
        strategies: this.generatePhaseStrategies(phase, strategies, input),
        objectives: this.definePhaseObjectives(phase, input),
        adjustments: this.anticipatePhaseAdjustments(phase, strategies),
        contingencies: this.definePhaseContingencies(phase, input)
      })),
      legacyPlanning: this.generateLegacyPlan(strategies, input),
      wealthTransfer: this.optimizeWealthTransfer(strategies, input),
      estateTaxStrategy: this.generateEstateTaxStrategy(input)
    };
  }

  static generateActionTimeline(strategies, input) {
    const timeline = [];
    const criticalDates = this.identifyCriticalDates(input);
    
    // Generate immediate actions (next 30 days)
    timeline.push({
      period: 'immediate',
      actions: this.generateImmediateActions(strategies),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Generate quarterly actions
    for (let quarter = 1; quarter <= 4; quarter++) {
      timeline.push({
        period: `Q${quarter}`,
        actions: this.generateQuarterlyActions(quarter, strategies, input),
        deadline: this.calculateQuarterEnd(quarter),
        estimatedImpact: this.calculateQuarterlyImpact(quarter, strategies)
      });
    }

    // Generate annual milestones
    timeline.push({
      period: 'annual',
      actions: this.generateAnnualActions(strategies, input),
      deadline: this.calculateTaxYearEnd(),
      requirements: this.identifyAnnualRequirements(strategies)
    });

    // Add critical date actions
    criticalDates.forEach(date => {
      timeline.push({
        period: 'critical',
        date: date.date,
        actions: this.generateCriticalDateActions(date, strategies),
        impact: this.calculateCriticalDateImpact(date, strategies)
      });
    });

    return {
      actions: timeline,
      priorities: this.prioritizeTimelineActions(timeline),
      dependencies: this.identifyActionDependencies(timeline),
      contingencies: this.generateTimelineContingencies(timeline, input)
    };
  }

  static generateContingencyPlans(strategies, input) {
    const scenarios = this.identifyRiskScenarios(input);
    const contingencies = {};

    // Generate plans for each risk scenario
    scenarios.forEach(scenario => {
      contingencies[scenario.type] = {
        trigger: scenario.trigger,
        impact: this.assessScenarioImpact(scenario, strategies),
        response: this.generateScenarioResponse(scenario, strategies),
        alternatives: this.identifyAlternativeStrategies(scenario, strategies),
        recovery: this.defineRecoveryPath(scenario, strategies)
      };
    });

    return {
      scenarios: contingencies,
      preventiveActions: this.generatePreventiveActions(scenarios, strategies),
      monitoringPlan: this.createMonitoringPlan(scenarios),
      adjustmentTriggers: this.defineAdjustmentTriggers(scenarios)
    };
  }

  static identifyRiskScenarios(input) {
    return [
      {
        type: 'income_change',
        trigger: 'Income decrease > 20%',
        probability: this.assessProbability('income_change', input),
        severity: 'high'
      },
      {
        type: 'tax_law_change',
        trigger: 'Significant tax legislation',
        probability: this.assessProbability('tax_law_change', input),
        severity: 'medium'
      },
      {
        type: 'market_downturn',
        trigger: 'Market decline > 30%',
        probability: this.assessProbability('market_downturn', input),
        severity: 'high'
      },
      {
        type: 'life_event',
        trigger: 'Major life changes (marriage, children, etc.)',
        probability: this.assessProbability('life_event', input),
        severity: 'medium'
      }
    ];
  }

  static assessScenarioImpact(scenario, strategies) {
    const impacts = {
      tax_liability: this.calculateTaxImpact(scenario, strategies),
      cash_flow: this.calculateCashFlowImpact(scenario, strategies),
      long_term: this.calculateLongTermImpact(scenario, strategies)
    };

    return {
      ...impacts,
      severity: this.assessImpactSeverity(impacts),
      duration: this.estimateImpactDuration(scenario, impacts),
      recovery: this.assessRecoveryPotential(impacts)
    };
  }

  static generateScenarioResponse(scenario, strategies) {
    return {
      immediate: this.generateImmediateResponse(scenario, strategies),
      shortTerm: this.generateShortTermResponse(scenario, strategies),
      longTerm: this.generateLongTermResponse(scenario, strategies),
      requirements: this.identifyResponseRequirements(scenario),
      timeline: this.createResponseTimeline(scenario)
    };
  }

  static generatePreventiveActions(scenarios, strategies) {
    return scenarios.map(scenario => ({
      scenario: scenario.type,
      actions: this.identifyPreventiveActions(scenario, strategies),
      cost: this.calculatePreventiveCost(scenario),
      benefit: this.assessPreventiveBenefit(scenario),
      timeline: this.createPreventiveTimeline(scenario)
    }));
  }

  static createMonitoringPlan(scenarios) {
    return {
      metrics: this.identifyMonitoringMetrics(scenarios),
      frequency: this.determineMonitoringFrequency(scenarios),
      thresholds: this.defineMonitoringThresholds(scenarios),
      responsibilities: this.assignMonitoringResponsibilities(scenarios),
      reporting: this.createMonitoringReports(scenarios)
    };
  }

  static defineAdjustmentTriggers(scenarios) {
    return scenarios.map(scenario => ({
      scenario: scenario.type,
      triggers: this.identifyTriggers(scenario),
      thresholds: this.defineTriggerThresholds(scenario),
      responses: this.defineTriggeredResponses(scenario),
      verification: this.createTriggerVerification(scenario)
    }));
  }
}
