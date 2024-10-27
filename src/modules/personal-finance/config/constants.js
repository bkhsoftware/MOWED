// config/constants.js
export const interestRates = {
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

export const budgetConstraints = {
  minimums: {
    Housing: 25,
    Food: 10,
    Utilities: 5,
    Healthcare: 5
  },
  maximums: {
    Entertainment: 10,
    Personal: 10
  }
};

export const optimizationWeights = {
  savings: 0.4,
  debt: 0.3,
  lifestyle: 0.3
};
