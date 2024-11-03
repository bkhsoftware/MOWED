import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';
import { 
  budgetCategories, 
  assetCategories, 
  liabilityCategories 
} from './config/categories';
import { BudgetOptimizer } from './optimizers/BudgetOptimizer';
import { PortfolioOptimizer } from './optimizers/PortfolioOptimizer';
import { DebtOptimizer } from './optimizers/DebtOptimizer';
import { RetirementCalculator } from './calculators/RetirementCalculator';
import { RiskCalculator } from './calculators/RiskCalculator';
import { GoalTracker } from './calculators/GoalTracker';
import { InputValidator } from './validators/InputValidator';
import { BudgetRecommendations } from './recommendations/BudgetRecommendations';
import { InvestmentRecommendations } from './recommendations/InvestmentRecommendations';
import { FinancialProjector } from './calculators/FinancialProjector';
import { DebtUtils } from './utils/DebtUtils';
import { CashflowAnalyzer } from './analyzers/CashflowAnalyzer';

export default class PersonalFinance extends ModuleInterface {
  constructor() {
    super('Personal Finance', 'Optimize your personal financial decisions');
    this.budgetCategories = budgetCategories;
    this.assetCategories = assetCategories;
    this.liabilityCategories = liabilityCategories;
    this.validator = new InputValidator();
    this.goalTracker = new GoalTracker();
    this.taxCategories = {
      'Filing Status': ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'],
      'Tax-Advantaged Accounts': ['Traditional IRA', '401(k)', 'Roth IRA', 'HSA', '529 Plan'],
      'Income Sources': ['Wages', 'Self-Employment', 'Investments', 'Rental Income', 'Other'],
      'Tax Credits': ['Child Tax Credit', 'Earned Income Credit', 'Education Credits', 'Energy Credits'],
      'Deductions': ['Mortgage Interest', 'Property Taxes', 'Charitable Contributions', 'Medical Expenses']
    };
  }

  _solve(input) {
    // Validate all inputs
    this.validator.validateInput(input);

    // Calculate basic financial metrics
    const basicMetrics = this.calculateBasicMetrics(input);

    // Calculate tax optimization first as it affects other optimizations
    const taxOptimization = TaxOptimizer.optimize({
      income: input.monthlyIncome * 12,
      filingStatus: input.taxInformation?.filingStatus || 'single',
      deductions: this.prepareTaxDeductions(input),
      retirementAccounts: this.prepareRetirementAccounts(input),
      investmentAccounts: input.assets.Investments || {},
      capitalGains: this.prepareCapitalGains(input),
      age: input.age,
      stateOfResidence: input.taxInformation?.stateOfResidence,
      selfEmployed: Boolean(input.incomeSources?.selfEmploymentIncome)
    });

    // Calculate retirement projections with tax-aware considerations
    const retirementProjection = RetirementCalculator.calculate({
      ...input,
      taxOptimization: taxOptimization.strategies
    });

    // Calculate risk tolerance and portfolio recommendations
    const riskTolerance = RiskCalculator.calculateRiskTolerance(input);
    const portfolioOptimization = this.optimizePortfolio(input, riskTolerance, taxOptimization.strategies.investments);

    // Optimize budget allocation considering tax implications
    const budgetOptimization = BudgetOptimizer.optimize({
      monthlyIncome: basicMetrics.monthlyIncome,
      currentBudget: input.budgetAllocation,
      savingsGoal: input.savingsGoal,
      debtInfo: DebtUtils.prepareDebtsForOptimization(input.liabilities),
      preferences: {
        savingsWeight: 0.4,
        debtWeight: 0.3,
        lifestyleWeight: 0.3
      },
      taxConsiderations: taxOptimization.strategies.timing
    });

    // Optimize debt repayment with tax considerations
    const debtOptimization = DebtOptimizer.optimize({
      debts: DebtUtils.prepareDebtsForOptimization(input.liabilities),
      monthlyPaymentCapacity: basicMetrics.availableSavings +
        (input.monthlyIncome * (budgetOptimization.optimizedBudget['Debt Payments'] / 100)),
      strategy: 'optimal',
      minimumPayments: DebtUtils.calculateMinimumPayments(input.liabilities),
      extraFunds: basicMetrics.availableSavings * 0.5,
      riskTolerance,
      cashflowStability: CashflowAnalyzer.analyzeCashflowStability(input).score,
      taxConsiderations: taxOptimization.strategies.timing
    });

    // Track financial goals with tax awareness
    const goalProgress = this.goalTracker.trackGoals(input, {
      ...basicMetrics,
      taxSavings: taxOptimization.savings
    });

    // Generate long-term financial projections
    const financialProjections = FinancialProjector.generateProjections(
      input,
      basicMetrics,
      {
        projectionYears: input.retirementAge - input.age,
        scenarioCount: 3,
        inflationRate: 0.02,
        marketVolatility: 0.15,
        simulationCount: 1000,
        taxStrategies: taxOptimization.strategies
      }
    );

    // Generate comprehensive recommendations
    const recommendations = {
      budget: BudgetRecommendations.generate(
        input.budgetAllocation,
        budgetOptimization.optimizedBudget
      ),
      investment: InvestmentRecommendations.generate(
        portfolioOptimization,
        input
      ),
      tax: taxOptimization.recommendations,
      longTerm: financialProjections.recommendations
    };

    // Compile complete result
    const result = {
      ...basicMetrics,
      taxOptimization,
      retirementProjection,
      portfolioOptimization,
      debtOptimization,
      goalProgress,
      financialProjections,
      recommendations,
      date: new Date().toISOString().split('T')[0]
    };

    // Emit results for state management
    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastCalculation: result }
    });

    return result;
  }

  prepareTaxDeductions(input) {
    const deductions = [];
    
    // Add itemized deductions if provided
    if (input.deductions) {
      Object.entries(input.deductions).forEach(([type, details]) => {
        deductions.push({
          type,
          amount: details.amount,
          recurring: details.recurring,
          eligible: true,
          certainty: 1,
          bunchable: this.isDeductionBunchable(type)
        });
      });
    }

    // Add retirement contributions as deductions
    if (input.taxAdvantaged) {
      Object.entries(input.taxAdvantaged).forEach(([account, details]) => {
        if (details.annualContribution > 0) {
          deductions.push({
            type: 'retirement_contribution',
            amount: details.annualContribution,
            accountType: account,
            eligible: true,
            certainty: 1,
            bunchable: false
          });
        }
      });
    }

    return deductions;
  }

  prepareRetirementAccounts(input) {
    const accounts = {};
    
    if (input.taxAdvantaged) {
      Object.entries(input.taxAdvantaged).forEach(([account, details]) => {
        accounts[account] = {
          balance: details.currentBalance,
          contribution: details.annualContribution,
          employerMatch: details.employerMatch,
          type: this.getAccountType(account)
        };
      });
    }

    return accounts;
  }

  prepareCapitalGains(input) {
    const gains = [];
    const investments = input.assets.Investments || {};
    
    // Add realized gains/losses
    if (input.investmentIncome?.['Capital Gains']) {
      Object.entries(input.investmentIncome['Capital Gains']).forEach(([term, amount]) => {
        gains.push({
          amount,
          realized: true,
          longTerm: term === 'Long-Term',
          year: new Date().getFullYear()
        });
      });
    }

    return gains;
  }

  isDeductionBunchable(type) {
    return ['charitable_contributions', 'medical_expenses', 'property_taxes'].includes(type);
  }

  getAccountType(account) {
    const types = {
      traditional_ira: 'traditional',
      roth_ira: 'roth',
      '401k': 'traditional',
      hsa: 'hsa'
    };
    return types[account.toLowerCase()] || 'traditional';
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
      { name: 'desiredRetirementIncome', type: 'number', label: 'Desired Annual Retirement Income', min: 0, step: 1000 },

      // Tax Information Section
      {
        name: 'taxInformation',
        type: 'section',
        label: 'Tax Information',
        fields: [
          {
            name: 'filingStatus',
            type: 'select',
            label: 'Filing Status',
            options: this.taxCategories['Filing Status'],
            required: true
          },
          {
            name: 'dependents',
            type: 'number',
            label: 'Number of Dependents',
            min: 0,
            step: 1
          },
          {
            name: 'stateOfResidence',
            type: 'select',
            label: 'State of Residence',
            options: this.getStatesList()
          }
        ]
      },

      // Income Sources Section
      {
        name: 'incomeSources',
        type: 'section',
        label: 'Income Sources',
        fields: [
          {
            name: 'wagesIncome',
            type: 'number',
            label: 'Annual Wages',
            min: 0,
            step: 100
          },
          {
            name: 'selfEmploymentIncome',
            type: 'number',
            label: 'Self-Employment Income',
            min: 0,
            step: 100
          },
          {
            name: 'investmentIncome',
            type: 'nestedIncome',
            label: 'Investment Income',
            categories: {
              'Dividends': ['Qualified', 'Non-Qualified'],
              'Interest': ['Taxable', 'Tax-Exempt'],
              'Capital Gains': ['Short-Term', 'Long-Term']
            }
          },
          {
            name: 'rentalIncome',
            type: 'number',
            label: 'Rental Income',
            min: 0,
            step: 100
          },
          {
            name: 'otherIncome',
            type: 'number',
            label: 'Other Income',
            min: 0,
            step: 100
          }
        ]
      },

      // Tax-Advantaged Accounts Section
      {
        name: 'taxAdvantaged',
        type: 'section',
        label: 'Tax-Advantaged Accounts',
        fields: this.taxCategories['Tax-Advantaged Accounts'].map(account => ({
          name: account.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          type: 'accountDetails',
          label: account,
          fields: [
            {
              name: 'currentBalance',
              type: 'number',
              label: 'Current Balance',
              min: 0,
              step: 100
            },
            {
              name: 'annualContribution',
              type: 'number',
              label: 'Annual Contribution',
              min: 0,
              step: 100
            },
            {
              name: 'employerMatch',
              type: 'number',
              label: 'Employer Match %',
              min: 0,
              max: 100,
              step: 0.1
            }
          ]
        }))
      },

      // Deductions Section
      {
        name: 'deductions',
        type: 'section',
        label: 'Tax Deductions',
        fields: this.taxCategories['Deductions'].map(deduction => ({
          name: deduction.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          type: 'deductionDetails',
          label: deduction,
          fields: [
            {
              name: 'amount',
              type: 'number',
              label: 'Amount',
              min: 0,
              step: 100
            },
            {
              name: 'recurring',
              type: 'boolean',
              label: 'Recurring Annually'
            }
          ]
        }))
      },

      // Tax Credits Section
      {
        name: 'taxCredits',
        type: 'section',
        label: 'Tax Credits',
        fields: this.taxCategories['Tax Credits'].map(credit => ({
          name: credit.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          type: 'boolean',
          label: credit
        }))
      },

      // Tax Planning Preferences
      {
        name: 'taxPreferences',
        type: 'section',
        label: 'Tax Planning Preferences',
        fields: [
          {
            name: 'riskTolerance',
            type: 'select',
            label: 'Tax Planning Risk Tolerance',
            options: ['Conservative', 'Moderate', 'Aggressive'],
            required: true
          },
          {
            name: 'prioritizeCurrentYear',
            type: 'boolean',
            label: 'Prioritize Current Year Tax Savings'
          },
          {
            name: 'considerRothConversion',
            type: 'boolean',
            label: 'Consider Roth Conversion Strategies'
          },
          {
            name: 'harvestingPreference',
            type: 'select',
            label: 'Tax Loss Harvesting Preference',
            options: ['None', 'Conservative', 'Moderate', 'Aggressive']
          }
        ]
      }

    ];
  }

  getStatesList() {
    return [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming'
    ];
  }

  validateField(field, value) {
    super.validateField(field, value);
    
    // Add tax-specific validations
    switch (field.type) {
      case 'accountDetails':
        this.validateAccountDetails(field, value);
        break;
      case 'deductionDetails':
        this.validateDeductionDetails(field, value);
        break;
      case 'nestedIncome':
        this.validateNestedIncome(field, value);
        break;
    }
  }

  validateAccountDetails(field, value) {
    if (value.annualContribution < 0) {
      throw new Error(`${field.label} annual contribution cannot be negative`);
    }
    if (value.employerMatch < 0 || value.employerMatch > 100) {
      throw new Error(`${field.label} employer match must be between 0 and 100%`);
    }
  }

  validateDeductionDetails(field, value) {
    if (value.amount < 0) {
      throw new Error(`${field.label} amount cannot be negative`);
    }
  }

  validateNestedIncome(field, value) {
    Object.entries(value).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, amount]) => {
        if (amount < 0) {
          throw new Error(`${category} - ${subcategory} amount cannot be negative`);
        }
      });
    });
  }
}
