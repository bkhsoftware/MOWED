import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class Reforestation extends ModuleInterface {
  constructor() {
    super('Reforestation', 'Optimize reforestation efforts');
  }

  _solve(input) {
    const { area, budget, treeTypes } = input;
    
    if (area <= 0 || budget <= 0 || treeTypes.length === 0) {
      throw new Error('Area and budget must be positive, and at least one tree type must be provided');
    }

    const totalTrees = Math.floor(budget / this.getAverageCost(treeTypes));
    const allocation = this.allocateTrees(totalTrees, treeTypes);
    const areaCovered = this.calculateCoverage(allocation);

    const result = {
      totalTrees,
      allocation,
      areaCovered,
      date: new Date().toISOString().split('T')[0],
      message: `Optimal plan: Plant ${totalTrees} trees, covering ${areaCovered.toFixed(2)} square meters.`
    };

    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastPlan: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'area', type: 'number', label: 'Total Area (sq m)' },
      { name: 'budget', type: 'number', label: 'Available Budget' },
      { name: 'treeTypes', type: 'array', label: 'Tree Types', fields: [
        { name: 'name', type: 'text', label: 'Tree Name' },
        { name: 'cost', type: 'number', label: 'Cost' },
        { name: 'growthRate', type: 'number', label: 'Growth Rate' },
        { name: 'carbonSequestration', type: 'number', label: 'Carbon Sequestration' },
        { name: 'coverage', type: 'number', label: 'Coverage (sq m)' }
      ]}
    ];
  }

  getLastPlan() {
    // This method now needs to be implemented differently, possibly using the store or EventBus
    // For now, we'll leave it as a placeholder
    console.warn('getLastPlan needs to be implemented');
    return null;
  }

  getAverageCost(treeTypes) {
    const totalCost = treeTypes.reduce((sum, tree) => sum + tree.cost, 0);
    return totalCost / treeTypes.length;
  }

  allocateTrees(totalTrees, treeTypes) {
    const totalWeight = treeTypes.reduce((sum, tree) => sum + tree.growthRate * tree.carbonSequestration, 0);
    return treeTypes.map(tree => {
      const weight = tree.growthRate * tree.carbonSequestration;
      const allocation = Math.round((weight / totalWeight) * totalTrees);
      return { ...tree, allocation };
    });
  }

  calculateCoverage(allocation) {
    return allocation.reduce((total, tree) => total + tree.allocation * tree.coverage, 0);
  }
}
