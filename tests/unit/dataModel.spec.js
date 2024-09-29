import OptimizationModel from '@/core/dataModel'

describe('OptimizationModel', () => {
  let model;

  beforeEach(() => {
    model = new OptimizationModel();
  });

  test('creates an instance with empty arrays', () => {
    expect(model.variables).toEqual([]);
    expect(model.constraints).toEqual([]);
    expect(model.objective).toBeNull();
  });

  test('adds variables correctly', () => {
    model.addVariable({ name: 'x', lowerBound: 0 });
    model.addVariable({ name: 'y', upperBound: 10 });
    expect(model.variables).toHaveLength(2);
    expect(model.variables[0]).toEqual({ name: 'x', lowerBound: 0 });
    expect(model.variables[1]).toEqual({ name: 'y', upperBound: 10 });
  });

  test('adds constraints correctly', () => {
    model.addConstraint({ lhs: 'x', operator: '<=', rhs: 10 });
    model.addConstraint({ lhs: 'y', operator: '>=', rhs: 5 });
    expect(model.constraints).toHaveLength(2);
    expect(model.constraints[0]).toEqual({ lhs: 'x', operator: '<=', rhs: 10 });
    expect(model.constraints[1]).toEqual({ lhs: 'y', operator: '>=', rhs: 5 });
  });

  test('sets objective correctly', () => {
    model.setObjective({ expression: 'x + y', goal: 'maximize' });
    expect(model.objective).toEqual({ expression: 'x + y', goal: 'maximize' });
  });

  test('serializes and deserializes correctly', () => {
    model.addVariable({ name: 'x', lowerBound: 0 });
    model.addConstraint({ lhs: 'x', operator: '<=', rhs: 10 });
    model.setObjective({ expression: 'x', goal: 'maximize' });

    const serialized = model.serialize();
    const deserialized = OptimizationModel.deserialize(serialized);

    expect(deserialized.variables).toEqual(model.variables);
    expect(deserialized.constraints).toEqual(model.constraints);
    expect(deserialized.objective).toEqual(model.objective);
  });

  test('handles empty model serialization and deserialization', () => {
    const serialized = model.serialize();
    const deserialized = OptimizationModel.deserialize(serialized);

    expect(deserialized.variables).toEqual([]);
    expect(deserialized.constraints).toEqual([]);
    expect(deserialized.objective).toBeNull();
  });

  test('throws error when deserializing invalid data', () => {
    expect(() => {
      OptimizationModel.deserialize('invalid json');
    }).toThrow();
  });
});
