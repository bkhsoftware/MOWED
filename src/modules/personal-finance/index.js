import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';
import { 
  budgetCategories, 
  assetCategories, 
  liabilityCategories 
} from './config/categories';
import { BudgetOptimizer } from './optimizers/BudgetOptimizer';
import { PortfolioOptimizer } from './optimizers/PortfolioOptimizer';
import { RetirementCalculator } from './calculators/RetirementCalculator';
import { RiskCalculator } from './calculators/RiskCalculator';
import { GoalTracker } from './calculators/GoalTracker';
import { InputValidator } from './validators/InputValidator';
import { BudgetRecommendations } from './recommendations/BudgetRecommendations';
import { InvestmentRecommendations } from './recommendations/InvestmentRecommendations';
import { FinancialProjector } from './calculators/FinancialProjector';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
    this.budgetCategories = budgetCategories;
    this.assetCategories = assetCategories;
    this.liabilityCategories = liabilityCategories;
    this.validator = new InputValidator();
    this.goalTracker = new GoalTracker();
  }

_solve(input) {
    // Validate all inputs
    this.validator.validateInput(input);

    // Calculate basic financial metrics
    const basicMetrics = this.calculateBasicMetrics(input);

    // Calculate retirement projections
    const retirementProjection = RetirementCalculator.calculate(input);

    // Calculate risk tolerance and portfolio recommendations
    const riskTolerance = RiskCalculator.calculateRiskTolerance(input);
    const portfolioOptimization = this.optimizePortfolio(input, riskTolerance);

    // Optimize budget allocation
    const budgetOptimization = this.optimizeBudget(input);

    // Track financial goals
    const goalProgress = this.goalTracker.trackGoals(input, basicMetrics);

    // Generate long-term financial projections
    const financialProjections = FinancialProjector.generateProjections(
      input,
      basicMetrics,
      {
        projectionYears: input.retirementAge - input.age,
        scenarioCount: 3,
        inflationRate: 0.02,
        marketVolatility: 0.15,
        simulationCount: 1000
      }
    );

    // Generate comprehensive recommendations
    const recommendations = this.generateRecommendations(
      input,
      budgetOptimization,
      portfolioOptimization,
      financialProjections
    );

    // Compile complete result
    const result = {
      ...basicMetrics,
      retirementProjection,
      portfolioOptimization,
      goalProgress,
      financialProjections,
      ...recommendations,
      date: new Date().toISOString().split('T')[0]
    };

    // Emit results for state management
    this.emitResults(result);

    return result;
  }

  calculateBasicMetrics(input) {
    const { monthlyIncome, budgetAllocation, assets, liabilities } = input;

    const expenses = this.calculateTotalExpenses(monthlyIncome, budgetAllocation);
    const availableSavings = this.calculateAvailableSavings(monthlyIncome, budgetAllocation);
    const totalAssets = this.calculateTotalAssets(assets);
    const totalLiabilities = this.calculateTotalLiabilities(liabilities);
    const netWorth = totalAssets - totalLiabilities;

    return {
      monthlyIncome: parseFloat(monthlyIncome.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      availableSavings: parseFloat(availableSavings.toFixed(2)),
      totalAssets: parseFloat(totalAssets.toFixed(2)),
      totalLiabilities: parseFloat(totalLiabilities.toFixed(2)),
      netWorth: parseFloat(netWorth.toFixed(2)),
      assets,
      liabilities,
      budgetAllocation
    };
  }

  optimizePortfolio(input, riskTolerance) {
    const investmentAssets = input.assets.Investments || {};
    const totalInvestments = Object.values(investmentAssets)
      .reduce((sum, value) => sum + value, 0);

    const monthlyIncomeNeeds = Math.max(0,
      input.desiredRetirementIncome / 12 - input.monthlyRetirementContribution
    );

    return PortfolioOptimizer.optimize({
      investmentAmount: totalInvestments,
      riskTolerance,
      timeHorizon: input.retirementAge - input.age,
      incomeNeeds: monthlyIncomeNeeds * 12,
      existingPositions: this.normalizeInvestmentPositions(investmentAssets),
      constraints: this.getInvestmentConstraints(input)
    });
  }

  optimizeBudget(input) {
    return BudgetOptimizer.optimize({
      monthlyIncome: input.monthlyIncome,
      currentBudget: input.budgetAllocation,
      savingsGoal: input.savingsGoal,
      debtInfo: this.prepareDebtInfo(input.liabilities),
      preferences: {
        savingsWeight: 0.4,
        debtWeight: 0.3,
        lifestyleWeight: 0.3
      }
    });
  }

  generateRecommendations(input, budgetOptimization, portfolioOptimization, financialProjections) {
    return {
      budgetRecommendations: BudgetRecommendations.generate(
        input.budgetAllocation,
        budgetOptimization.optimizedBudget
      ),
      investmentRecommendations: InvestmentRecommendations.generate(
        portfolioOptimization,
        input
      ),
      longTermRecommendations: financialProjections.recommendations
    };
  }

  prepareDebtInfo(liabilities) {
    const debtInfo = {};
    Object.entries(liabilities).forEach(([category, debts]) => {
      Object.entries(debts).forEach(([name, amount]) => {
        if (amount > 0) {
          debtInfo[`${category}-${name}`] = {
            amount,
            interestRate: this.getEstimatedInterestRate(category, name)
          };
        }
      });
    });
    return debtInfo;
  }

  calculateTotalExpenses(monthlyIncome, budgetAllocation) {
    return this.budgetCategories.reduce((sum, category) => {
      if (category !== 'Savings') {
        return sum + (monthlyIncome * budgetAllocation[category] / 100);
      }
      return sum;
    }, 0);
  }

  calculateAvailableSavings(monthlyIncome, budgetAllocation) {
    return monthlyIncome * (budgetAllocation['Savings'] / 100);
  }

  calculateTotalAssets(assets) {
    return Object.values(assets).reduce((sum, category) => 
      sum + Object.values(category).reduce((s, v) => s + v, 0), 0);
  }

  calculateTotalLiabilities(liabilities) {
    return Object.values(liabilities).reduce((sum, category) => 
      sum + Object.values(category).reduce((s, v) => s + v, 0), 0);
  }

  emitResults(result) {
    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result }
    });
  }

  getInputFields() {
    return [
      { name: 'monthlyIncome', type: 'number', label: 'Monthly Income', min: 0, step: 0.01 },
      { name: 'budgetAllocation', type: 'budgetAllocation', label: 'Budget Allocation', categories: this.budgetCategories },
      { name: 'savingsGoal', type: 'number', label: 'Savings Goal', min: 0, step: 0.01 },
      { name: 'investmentRate', type: 'number', label: 'Annual Investment Return Rate', min: 0, max: 1, step: 0.01 },
      { name: 'assets', type: 'nestedCategoryValues', label: 'Assets', categories: this.assetCategories },
      { name: 'liabilities', type: 'nestedCategoryValues', label: 'Liabilities', categories: this.liabilityCategories },
      { name: 'incomeGrowthRate', type: 'number', label: 'Monthly Income Growth Rate (%)', min: 0, max: 100, step: 0.1 },
      { name: 'goals', type: 'goals', label: 'Financial Goals' },
      { name: 'age', type: 'number', label: 'Current Age', min: 18, max: 100, step: 1 },
      { name: 'retirementAge', type: 'number', label: 'Desired Retirement Age', min: 18, max: 100, step: 1 },
      { name: 'yearsInRetirement', type: 'number', label: 'Expected Years in Retirement', min: 1, max: 50, step: 1 },
      { name: 'retirementSavings', type: 'number', label: 'Current Retirement Savings', min: 0, step: 100 },
      { name: 'monthlyRetirementContribution', type: 'number', label: 'Monthly Retirement Contribution', min: 0, step: 10 },
      { name: 'desiredRetirementIncome', type: 'number', label: 'Desired Annual Retirement Income', min: 0, step: 1000 }
    ];
  }

  validateField(field, value) {
    this.validator.validateField(field, value);
  }
}
