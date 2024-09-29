import Reforestation from '@/modules/reforestation';

describe('Reforestation Module', () => {
  let reforestation;

  beforeEach(() => {
    reforestation = new Reforestation();
  });

  it('calculates correct average cost', () => {
    const treeTypes = [
      { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 },
      { name: 'Pine', cost: 8, growthRate: 0.7, carbonSequestration: 8, coverage: 3 }
    ];
    expect(reforestation.getAverageCost(treeTypes)).toBe(9);
  });

  it('allocates trees correctly', () => {
    const totalTrees = 100;
    const treeTypes = [
      { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 },
      { name: 'Pine', cost: 8, growthRate: 0.7, carbonSequestration: 8, coverage: 3 }
    ];
    const allocation = reforestation.allocateTrees(totalTrees, treeTypes);
    expect(allocation[0].allocation + allocation[1].allocation).toBe(totalTrees);
  });

  it('calculates correct area coverage', () => {
    const allocation = [
      { name: 'Oak', allocation: 60, coverage: 4 },
      { name: 'Pine', allocation: 40, coverage: 3 }
    ];
    expect(reforestation.calculateCoverage(allocation)).toBe(360);
  });

  test('_solve method calculates correct results', () => {
    const input = {
      area: 1000,
      budget: 10000,
      treeTypes: [
        { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 },
        { name: 'Pine', cost: 8, growthRate: 0.7, carbonSequestration: 8, coverage: 3 }
      ]
    };

    const result = reforestation._solve(input);

    expect(result.totalTrees).toBe(1111); // 10000 / 9 (average cost)
    expect(result.allocation).toHaveLength(2);
    expect(result.areaCovered).toBe(3888); // (556 * 4) + (555 * 3)
    expect(result.message).toContain('Plant 1111 trees');
    expect(result.message).toContain('3888 square meters');
  });

  test('_solve method throws error for invalid inputs', () => {
    const input = {
      area: -1000,
      budget: 10000,
      treeTypes: [
        { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 }
      ]
    };

    expect(() => reforestation._solve(input)).toThrow('Area and budget must be positive');
  });

  test('EventBus emits correct data', () => {
    const input = {
      area: 1000,
      budget: 10000,
      treeTypes: [
        { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 }
      ]
    };

    const result = reforestation._solve(input);

    expect(EventBus.emit).toHaveBeenCalledWith('updateModuleState', {
      moduleName: 'Reforestation',
      moduleState: { lastPlan: result }
    });
  });
});
