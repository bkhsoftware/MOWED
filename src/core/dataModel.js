class OptimizationModel {
  constructor() {
    this.variables = []
    this.constraints = []
    this.objective = null
  }

  addVariable(variable) {
    this.variables.push(variable)
  }

  addConstraint(constraint) {
    this.constraints.push(constraint)
  }

  setObjective(objective) {
    this.objective = objective
  }

  serialize() {
    return JSON.stringify({
      variables: this.variables,
      constraints: this.constraints,
      objective: this.objective
    })
  }

  static deserialize(data) {
    const model = new OptimizationModel()
    const parsedData = JSON.parse(data)
    model.variables = parsedData.variables
    model.constraints = parsedData.constraints
    model.objective = parsedData.objective
    return model
  }
}

export default OptimizationModel
