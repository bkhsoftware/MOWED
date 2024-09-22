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
});
