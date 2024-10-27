// config/categories.js
export const budgetCategories = [
  'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 
  'Healthcare', 'Debt Payments', 'Personal', 'Entertainment', 'Savings'
];

export const assetCategories = {
  'Liquid Assets': ['Cash', 'Checking Accounts', 'Savings Accounts'],
  'Investments': ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Retirement Accounts'],
  'Real Estate': ['Primary Residence', 'Investment Properties'],
  'Personal Property': ['Vehicles', 'Jewelry', 'Collectibles'],
  'Other Assets': ['Business Ownership', 'Intellectual Property']
};

export const liabilityCategories = {
  'Secured Debts': ['Mortgage', 'Auto Loans', 'Home Equity Loans'],
  'Unsecured Debts': ['Credit Card Debt', 'Personal Loans'],
  'Student Loans': ['Federal Student Loans', 'Private Student Loans'],
  'Other Debts': ['Medical Debt', 'Tax Debt']
};

export const assetMapping = {
  'Stocks': 'US Large Cap Stocks',
  'Bonds': 'US Government Bonds',
  'Mutual Funds': 'US Large Cap Stocks',
  'ETFs': 'US Large Cap Stocks',
  'Retirement Accounts': 'US Large Cap Stocks'
};
