import OptimizationModel from '@/core/dataModel'

describe('OptimizationModel', () => {
  it('should create an instance with empty arrays', () => {
    const model = new OptimizationModel()
    expect(model.variables).toEqual([])
    expect(model.constraints).toEqual([])
    expect(model.objective).toBeNull()
  })

  it('should add variables and constraints', () => {
    const model = new OptimizationModel()
    model.addVariable({ name: 'x', lowerBound: 0 })
    model.addConstraint({ lhs: 'x', operator: '<=', rhs: 10 })
    expect(model.variables).toHaveLength(1)
    expect(model.constraints).toHaveLength(1)
  })

  it('should serialize and deserialize correctly', () => {
    const model = new OptimizationModel()
    model.addVariable({ name: 'x', lowerBound: 0 })
    model.addConstraint({ lhs: 'x', operator: '<=', rhs: 10 })
    model.setObjective({ expression: 'x', goal: 'maximize' })

    const serialized = model.serialize()
    const deserialized = OptimizationModel.deserialize(serialized)

    expect(deserialized.variables).toEqual(model.variables)
    expect(deserialized.constraints).toEqual(model.constraints)
    expect(deserialized.objective).toEqual(model.objective)
  })
})
