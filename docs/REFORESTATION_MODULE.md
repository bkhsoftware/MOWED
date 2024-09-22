# Reforestation Module

The Reforestation module helps optimize tree planting efforts based on available budget, area, and tree types.

## Input Fields

- `area`: Total area available for reforestation (in square meters)
- `budget`: Available budget for the reforestation project
- `treeTypes`: An array of tree types with the following properties:
  - `name`: Name of the tree species
  - `cost`: Cost per tree
  - `growthRate`: Growth rate factor (0-1)
  - `carbonSequestration`: Carbon sequestration factor
  - `coverage`: Area covered by a single tree (in square meters)

## Optimization Process

1. Calculate the total number of trees that can be planted based on the budget and average tree cost.
2. Allocate trees to different species based on a weighted system considering growth rate and carbon sequestration.
3. Calculate the total area that will be covered by the allocated trees.

## Output

- `totalTrees`: Total number of trees to be planted
- `allocation`: An array of tree types with their allocated numbers
- `areaCovered`: Total area that will be covered by the planted trees

## Usage

```javascript
const reforestationModule = new Reforestation();
const result = reforestationModule.solve({
  area: 10000,
  budget: 10000,
  treeTypes: [
    { name: 'Oak', cost: 10, growthRate: 0.5, carbonSequestration: 10, coverage: 4 },
    { name: 'Pine', cost: 8, growthRate: 0.7, carbonSequestration: 8, coverage: 3 }
  ]
});
```

The `result` object will contain the optimization results and a message summarizing the reforestation plan.
