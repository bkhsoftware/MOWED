import { addMonths, format } from 'date-fns';

export class PersonalFinanceSampleData {
  static generateSampleData() {
    const monthlyIncome = 5000;
    const currentDate = new Date();
    
    // Generate 12 months of historical data
    const historicalData = Array.from({ length: 12 }).map((_, index) => {
      const date = addMonths(currentDate, -11 + index);
      const monthStr = format(date, 'MMM');
      const baseIncrease = 1 + (index * 0.015); // 1.5% monthly growth
      
      return {
        date,
        month: monthStr,
        income: monthlyIncome * baseIncrease,
        expenses: monthlyIncome * 0.7 * (1 + (index * 0.01)),
        savings: monthlyIncome * 0.3 * baseIncrease,
        investments: 20000 * (1 + (index * 0.02))
      };
    });

    // Create the complete form data structure matching ModuleForm fields
    return {
      // Basic financial info
      monthlyIncome: monthlyIncome,
      investmentRate: 0.07,
      savingsGoal: 100000,
      incomeGrowthRate: 3,

      // Budget allocation matching the categories in the module
      budgetAllocation: {
        Housing: 30,
        Transportation: 15,
        Food: 12,
        Utilities: 8,
        Insurance: 5,
        Healthcare: 5,
        'Debt Payments': 10,
        Personal: 5,
        Entertainment: 5,
        Savings: 5
      },

      // Asset categories matching the module structure
      assets: {
        'Liquid Assets': {
          'Cash': 5000,
          'Checking Accounts': 3000,
          'Savings Accounts': 15000
        },
        'Investments': {
          'Stocks': 25000,
          'Bonds': 10000,
          'Mutual Funds': 15000,
          'ETFs': 20000,
          'Retirement Accounts': 50000
        },
        'Real Estate': {
          'Primary Residence': 300000
        },
        'Personal Property': {
          'Vehicles': 25000,
          'Jewelry': 5000,
          'Collectibles': 2000
        },
        'Other Assets': {
          'Business Ownership': 0,
          'Intellectual Property': 0
        }
      },

      // Liability categories matching the module structure
      liabilities: {
        'Secured Debts': {
          'Mortgage': 250000,
          'Auto Loans': 15000,
          'Home Equity Loans': 0
        },
        'Unsecured Debts': {
          'Credit Card Debt': 2000,
          'Personal Loans': 5000
        },
        'Student Loans': {
          'Federal Student Loans': 20000,
          'Private Student Loans': 0
        },
        'Other Debts': {
          'Medical Debt': 0,
          'Tax Debt': 0
        }
      },

      // Financial goals
      goals: [
        {
          name: "Emergency Fund",
          type: "savings",
          target: 30000
        },
        {
          name: "Down Payment",
          type: "savings",
          target: 60000
        },
        {
          name: "Debt Free",
          type: "debt_reduction",
          target: 292000
        },
        {
          name: "Income Goal",
          type: "income",
          target: 8000
        }
      ],

      // Retirement planning fields
      age: 30,
      retirementAge: 65,
      yearsInRetirement: 30,
      retirementSavings: 50000,
      monthlyRetirementContribution: 500,
      desiredRetirementIncome: 80000
    };
  }

  static getNetWorthHistory(data) {
    return data.historicalData.map(month => {
      const totalAssets = Object.values(data.assets).reduce(
        (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
        0
      );
      const totalLiabilities = Object.values(data.liabilities).reduce(
        (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
        0
      );
      return {
        date: month.date,
        netWorth: totalAssets - totalLiabilities
      };
    });
  }
}
