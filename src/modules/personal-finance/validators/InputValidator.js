// validators/InputValidator.js

export class InputValidator {
  validateInput(input) {
    this.validateRequired(input);
    this.validateRanges(input);
    this.validateBudgetAllocation(input);
    this.validateAssetLiabilities(input);
    this.validateRetirementInputs(input);
    this.validateGoals(input);
  }

  validateRequired(input) {
    const requiredFields = [
      'monthlyIncome',
      'budgetAllocation',
      'savingsGoal',
      'investmentRate',
      'assets',
      'liabilities'
    ];

    requiredFields.forEach(field => {
      if (input[field] === undefined || input[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }

  validateRanges(input) {
    if (input.monthlyIncome <= 0) {
      throw new Error('Monthly income must be greater than 0');
    }

    if (input.investmentRate < 0 || input.investmentRate > 1) {
      throw new Error('Investment rate must be between 0 and 1');
    }

    if (input.incomeGrowthRate < 0 || input.incomeGrowthRate > 100) {
      throw new Error('Income growth rate must be between 0 and 100');
    }
  }

  validateBudgetAllocation(input) {
    const total = Object.values(input.budgetAllocation)
      .reduce((sum, value) => sum + Number(value), 0);
    
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Budget allocation must sum to 100%');
    }

    Object.entries(input.budgetAllocation).forEach(([category, value]) => {
      if (value < 0) {
        throw new Error(`${category} allocation cannot be negative`);
      }
    });
  }

  validateAssetLiabilities(input) {
    this.validateNestedNumbers(input.assets, 'Assets');
    this.validateNestedNumbers(input.liabilities, 'Liabilities');
  }

  validateNestedNumbers(obj, label) {
    Object.entries(obj).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, value]) => {
        if (typeof value !== 'number' || value < 0) {
          throw new Error(`Invalid ${label.toLowerCase()} value for ${category} - ${subcategory}`);
        }
      });
    });
  }

  validateRetirementInputs(input) {
    if (input.age !== undefined) {
      if (input.age < 18 || input.age > 100) {
        throw new Error('Age must be between 18 and 100');
      }

      if (input.retirementAge <= input.age) {
        throw new Error('Retirement age must be greater than current age');
      }

      if (input.retirementAge > 100) {
        throw new Error('Retirement age must be less than or equal to 100');
      }

      if (input.yearsInRetirement < 1 || input.yearsInRetirement > 50) {
        throw new Error('Years in retirement must be between 1 and 50');
      }
    }
  }

  validateGoals(input) {
    if (input.goals && Array.isArray(input.goals)) {
      input.goals.forEach((goal, index) => {
        if (!goal.name || !goal.type || !goal.target) {
          throw new Error(`Invalid goal at index ${index}`);
        }

        if (!['savings', 'debt_reduction', 'income'].includes(goal.type)) {
          throw new Error(`Invalid goal type: ${goal.type}`);
        }

        if (goal.target <= 0) {
          throw new Error(`Goal target must be greater than 0`);
        }
      });
    }
  }

  validateField(field, value) {
    switch (field.type) {
      case 'number':
        this.validateNumberField(field, value);
        break;
      case 'budgetAllocation':
        this.validateBudgetAllocationField(value);
        break;
      case 'nestedCategoryValues':
        this.validateNestedCategoryField(field, value);
        break;
      case 'goals':
        this.validateGoalsField(value);
        break;
    }
  }

  validateNumberField(field, value) {
    if (typeof value !== 'number') {
      throw new Error(`${field.label} must be a number`);
    }

    if (field.min !== undefined && value < field.min) {
      throw new Error(`${field.label} must be at least ${field.min}`);
    }

    if (field.max !== undefined && value > field.max) {
      throw new Error(`${field.label} must be no more than ${field.max}`);
    }
  }

  validateBudgetAllocationField(value) {
    const total = Object.values(value).reduce((sum, allocation) => sum + allocation, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error('Budget allocation must sum to 100%');
    }
  }

  validateNestedCategoryField(field, value) {
    Object.entries(value).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, amount]) => {
        if (amount < 0) {
          throw new Error(`${field.label} values must be non-negative`);
        }
      });
    });
  }

  validateGoalsField(value) {
    if (!Array.isArray(value)) {
      throw new Error('Goals must be an array');
    }

    value.forEach((goal, index) => {
      if (!goal.name || !goal.type || !goal.target) {
        throw new Error(`Invalid goal at index ${index}`);
      }

      if (!['savings', 'debt_reduction', 'income'].includes(goal.type)) {
        throw new Error(`Invalid goal type: ${goal.type} at index ${index}`);
      }

      if (typeof goal.target !== 'number' || goal.target <= 0) {
        throw new Error(`Invalid target value for goal at index ${index}`);
      }
    });    
  }
}
