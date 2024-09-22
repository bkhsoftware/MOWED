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
      profit,
      revenuePerEmployee,
      profitPerEmployee,
      message: `Business analysis: Profit: $${profit}, Revenue per employee: $${revenuePerEmployee.toFixed(2)}, Profit per employee: $${profitPerEmployee.toFixed(2)}.`
    };

    // Update module-specific state
    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastAnalysis: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'revenue', type: 'number', label: 'Monthly Revenue' },
      { name: 'costs', type: 'number', label: 'Monthly Costs' },
      { name: 'employees', type: 'number', label: 'Number of Employees' }
    ];
  }

  getLastAnalysis() {
    // This method now needs to be implemented differently, possibly using the store or EventBus
    // For now, we'll leave it as a placeholder
    console.warn('getLastAnalysis needs to be implemented');
    return null;
  }
}
