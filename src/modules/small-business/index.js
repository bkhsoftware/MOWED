import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class SmallBusiness extends ModuleInterface {
  constructor() {
    super('Small Business', 'Optimize small business operations');
  }

  _solve(input) {
    const { revenue, costs, employees } = input;
    
    if (revenue < 0 || costs < 0 || employees <= 0) {
      throw new Error('Revenue and costs must be non-negative, and number of employees must be positive');
    }

    const profit = revenue - costs;
    const revenuePerEmployee = revenue / employees;
    const profitPerEmployee = profit / employees;

    const result = {
      revenue: parseFloat(revenue.toFixed(2)),
      costs: parseFloat(costs.toFixed(2)),
      employees: parseInt(employees),
      profit: parseFloat(profit.toFixed(2)),
      revenuePerEmployee: parseFloat(revenuePerEmployee.toFixed(2)),
      profitPerEmployee: parseFloat(profitPerEmployee.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      message: `Business analysis: Profit: $${profit.toFixed(2)}, Revenue per employee: $${revenuePerEmployee.toFixed(2)}, Profit per employee: $${profitPerEmployee.toFixed(2)}.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastAnalysis: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'revenue', type: 'number', label: 'Monthly Revenue', min: 0 },
      { name: 'costs', type: 'number', label: 'Monthly Costs', min: 0 },
      { name: 'employees', type: 'number', label: 'Number of Employees', min: 1 }
    ];
  }

  validateField(field, value) {
    super.validateField(field, value);
    if (field.name === 'revenue' || field.name === 'costs') {
      if (value < 0) {
        throw new Error(`${field.label} must be non-negative`);
      }
    } else if (field.name === 'employees') {
      if (value <= 0 || !Number.isInteger(value)) {
        throw new Error('Number of employees must be a positive integer');
      }
    }
  }
}
