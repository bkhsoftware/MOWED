import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class Education extends ModuleInterface {
  constructor() {
    super('Education', 'Optimize educational resource allocation');
  }

  _solve(input) {
    const { students, teachers, classrooms, budget } = input;
    
    if (students <= 0 || teachers <= 0 || classrooms <= 0 || budget <= 0) {
      throw new Error('All input values must be positive');
    }

    const studentsPerTeacher = Math.floor(students / teachers);
    const studentsPerClassroom = Math.floor(students / classrooms);
    const budgetPerStudent = budget / students;

    const result = {
      studentsPerTeacher,
      studentsPerClassroom,
      budgetPerStudent,
      message: `Optimal allocation: ${studentsPerTeacher} students per teacher, ${studentsPerClassroom} students per classroom, $${budgetPerStudent.toFixed(2)} budget per student.`
    };

    // Update module-specific state
    EventBus.emit('updateModuleState', {
      moduleName: this.getName(),
      moduleState: { lastAllocation: result }
    });

    return result;
  }

  getInputFields() {
    return [
      { name: 'students', type: 'number', label: 'Number of Students' },
      { name: 'teachers', type: 'number', label: 'Number of Teachers' },
      { name: 'classrooms', type: 'number', label: 'Number of Classrooms' },
      { name: 'budget', type: 'number', label: 'Total Budget' }
    ];
  }

  getLastAllocation() {
    // This method now needs to be implemented differently, possibly using the store or EventBus
    // For now, we'll leave it as a placeholder
    console.warn('getLastAllocation needs to be implemented');
    return null;
  }
}
