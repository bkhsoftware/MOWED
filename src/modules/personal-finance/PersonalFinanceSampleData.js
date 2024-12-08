import { addMonths, format } from 'date-fns';

export class PersonalFinanceSampleData {
  static generateSampleData() {
    const monthlyIncome = 5000;
    const currentDate = new Date();
    
    // Generate 12 months of historical data with more detailed tracking
    const historicalData = Array.from({ length: 12 }).map((_, index) => {
      const date = addMonths(currentDate, -11 + index);
      const monthStr = format(date, 'MMM');
      const baseIncrease = 1 + (index * 0.015); // 1.5% monthly growth
      
      // Calculate assets with growth rates
      const assets = {
        'Liquid Assets': {
          'Cash': 5000 * (1 + (index * 0.001)), // 0.1% monthly growth
          'Checking Accounts': 3000,
          'Savings Accounts': 15000 * (1 + (index * 0.002)) // 0.2% monthly growth
        },
        'Investments': {
          'Stocks': 25000 * (1 + (index * 0.02)), // 2% monthly growth
          'Bonds': 10000 * (1 + (index * 0.005)), // 0.5% monthly growth
          'Mutual Funds': 15000 * (1 + (index * 0.015)), // 1.5% monthly growth
          'ETFs': 20000 * (1 + (index * 0.018)), // 1.8% monthly growth
          'Retirement Accounts': 50000 * (1 + (index * 0.016)) // 1.6% monthly growth
        },
        'Real Estate': {
          'Primary Residence': 300000 * (1 + (index * 0.005)) // 0.5% monthly growth
        },
        'Personal Property': {
          'Vehicles': 25000 * (1 - (index * 0.005)), // 0.5% monthly depreciation
          'Jewelry': 5000,
          'Collectibles': 2000 * (1 + (index * 0.003)) // 0.3% monthly appreciation
        },
        'Other Assets': {
          'Business Ownership': 0,
          'Intellectual Property': 0
        }
      };

      // Calculate liabilities with paydown and growth rates
      const liabilities = {
        'Secured Debts': {
          'Mortgage': 250000 * (1 - (index * 0.002)), // 0.2% monthly paydown
          'Auto Loans': 15000 * (1 - (index * 0.015)), // 1.5% monthly paydown
          'Home Equity Loans': 0
        },
        'Unsecured Debts': {
          'Credit Card Debt': Math.max(0, 2000 * (1 - (index * 0.05))), // 5% monthly paydown
          'Personal Loans': Math.max(0, 5000 * (1 - (index * 0.03))) // 3% monthly paydown
        },
        'Student Loans': {
          'Federal Student Loans': 20000 * (1 - (index * 0.004)), // 0.4% monthly paydown
          'Private Student Loans': 0
        },
        'Other Debts': {
          'Medical Debt': 0,
          'Tax Debt': 0
        }
      };

      // Calculate totals
      const totalAssets = Object.values(assets).reduce(
        (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
        0
      );

      const totalLiabilities = Object.values(liabilities).reduce(
        (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
        0
      );

      return {
        date,
        month: monthStr,
        income: monthlyIncome * baseIncrease,
        expenses: monthlyIncome * 0.7 * (1 + (index * 0.01)),
        savings: monthlyIncome * 0.3 * baseIncrease,
        investments: 20000 * (1 + (index * 0.02)),
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        assetBreakdown: assets,
        liabilityBreakdown: liabilities
      };
    });

    // Create the complete form data structure
    const baseData = {
      // Basic financial info
      monthlyIncome,
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

      // Note: assets and liabilities will be overwritten with latest historical data
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

      // Note: these will also be overwritten with latest historical data
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

      // Retirement planning fields
      age: 30,
      retirementAge: 65,
      yearsInRetirement: 30,
      retirementSavings: 50000,
      monthlyRetirementContribution: 500,
      desiredRetirementIncome: 80000
    };

    // Use the latest values from historical data for current assets and liabilities
    const latestData = historicalData[historicalData.length - 1];
    
    return {
      ...baseData,
      assets: latestData.assetBreakdown,
      liabilities: latestData.liabilityBreakdown,
      historicalData, // Add historical data to the return object
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
          target: latestData.liabilities // Use current total liabilities
        },
        {
          name: "Income Goal",
          type: "income",
          target: 8000
        }
      ],
      // Keep existing retirement planning fields
      age: 30,
      retirementAge: 65,
      yearsInRetirement: 30,
      retirementSavings: 50000,
      monthlyRetirementContribution: 500,
      desiredRetirementIncome: 80000
    };
  }

  // Keep existing getNetWorthHistory method but enhance it
  static getNetWorthHistory(data) {
    if (data.historicalData) {
      return data.historicalData.map(entry => ({
        date: entry.date,
        netWorth: entry.netWorth,
        assets: entry.assets,
        liabilities: entry.liabilities
      }));
    }
    
    // Fallback to calculating from current data if no history
    return [{
      date: new Date(),
      netWorth: this.calculateNetWorth(data.assets, data.liabilities),
      assets: this.calculateTotalAssets(data.assets),
      liabilities: this.calculateTotalLiabilities(data.liabilities)
    }];
  }

  // Helper methods for calculations
  static calculateNetWorth(assets, liabilities) {
    return this.calculateTotalAssets(assets) - this.calculateTotalLiabilities(liabilities);
  }

  static calculateTotalAssets(assets) {
    return Object.values(assets).reduce(
      (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
      0
    );
  }

  static calculateTotalLiabilities(liabilities) {
    return Object.values(liabilities).reduce(
      (sum, category) => sum + Object.values(category).reduce((s, v) => s + v, 0),
      0
    );
  }
}
