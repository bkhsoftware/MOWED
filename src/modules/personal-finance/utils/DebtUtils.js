// utils/DebtUtils.js

export class DebtUtils {
  static getEstimatedInterestRates() {
    return {
      'Secured Debts': {
        'Mortgage': 0.04,
        'Auto Loans': 0.06,
        'Home Equity Loans': 0.05
      },
      'Unsecured Debts': {
        'Credit Card Debt': 0.18,
        'Personal Loans': 0.10
      },
      'Student Loans': {
        'Federal Student Loans': 0.05,
        'Private Student Loans': 0.08
      },
      'Other Debts': {
        'Medical Debt': 0.07,
        'Tax Debt': 0.06
      }
    };
  }

  static prepareDebtsForOptimization(liabilities) {
    const debts = {};
    const interestRates = this.getEstimatedInterestRates();
    
    Object.entries(liabilities).forEach(([category, categoryDebts]) => {
      Object.entries(categoryDebts).forEach(([name, amount]) => {
        if (amount > 0) {
          const debtId = `${category}-${name}`;
          debts[debtId] = {
            balance: amount,
            interestRate: interestRates[category]?.[name] || 0.10,
            type: this.categorizeDebtType(category, name),
            isVariableRate: this.isVariableRateDebt(category, name),
            isSecured: this.isSecuredDebt(category),
            creditLimit: this.estimateCreditLimit(category, name, amount)
          };
        }
      });
    });

    return debts;
  }

  static calculateMinimumPayments(liabilities) {
    const minimumPayments = {};
    const interestRates = this.getEstimatedInterestRates();
    
    Object.entries(liabilities).forEach(([category, categoryDebts]) => {
      Object.entries(categoryDebts).forEach(([name, amount]) => {
        if (amount > 0) {
          const debtId = `${category}-${name}`;
          const interestRate = interestRates[category]?.[name] || 0.10;
          
          minimumPayments[debtId] = this.calculateMinimumPayment(
            amount,
            interestRate,
            category,
            name
          );
        }
      });
    });

    return minimumPayments;
  }

  static calculateMinimumPayment(balance, interestRate, category, name) {
    const calculators = {
      'Credit Card Debt': () => Math.max(balance * 0.02, balance * (interestRate / 12) * 1.1),
      'Mortgage': () => {
        const monthlyRate = interestRate / 12;
        const months = 30 * 12;
        return balance * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
               (Math.pow(1 + monthlyRate, months) - 1);
      },
      'Auto Loans': () => {
        const monthlyRate = interestRate / 12;
        const months = 5 * 12;
        return balance * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
               (Math.pow(1 + monthlyRate, months) - 1);
      },
      'default': () => balance * (interestRate / 12) + (balance * 0.01)
    };

    return (calculators[name] || calculators.default)();
  }

  static categorizeDebtType(category, name) {
    const categoryMap = {
      'Secured Debts': {
        'Mortgage': 'mortgage',
        'Auto Loans': 'auto-loan',
        'Home Equity Loans': 'heloc'
      },
      'Unsecured Debts': {
        'Credit Card Debt': 'credit-card',
        'Personal Loans': 'personal-loan'
      },
      'Student Loans': {
        'Federal Student Loans': 'student-loan',
        'Private Student Loans': 'student-loan'
      }
    };

    return categoryMap[category]?.[name] || 'other';
  }

  static isVariableRateDebt(category, name) {
    return [
      'Credit Card Debt',
      'Home Equity Loans',
      'Private Student Loans'
    ].includes(name);
  }

  static isSecuredDebt(category) {
    return category === 'Secured Debts';
  }

  static estimateCreditLimit(category, name, balance) {
    if (name === 'Credit Card Debt') {
      return Math.max(balance * 2, 5000);
    }
    return null;
  }
}
