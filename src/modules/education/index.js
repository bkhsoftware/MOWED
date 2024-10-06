import ModuleInterface from '../../core/ModuleInterface';
import EventBus from '../../core/EventBus';

export default class Education extends ModuleInterface {
  constructor() {
    super('Education', 'Optimize educational resource allocation');
  }

  _solve(input) {
    const { students, teachers, classrooms, budget, date } = input;
    
    if (students <= 0 || teachers <= 0 || classrooms <= 0 || budget <= 0) {
      throw new Error('All input values must be positive');
    }

    const studentsPerTeacher = students / teachers;
    const studentsPerClassroom = students / classrooms;
    const budgetPerStudent = budget / students;

    const result = {
      studentsPerTeacher: parseFloat(studentsPerTeacher.toFixed(2)),
      studentsPerClassroom: parseFloat(studentsPerClassroom.toFixed(2)),
      budgetPerStudent: parseFloat(budgetPerStudent.toFixed(2)),
      date: date,
      message: `Optimal allocation as of ${date}: ${studentsPerTeacher.toFixed(2)} students per teacher, ${studentsPerClassroom.toFixed(2)} students per classroom, $${budgetPerStudent.toFixed(2)} budget per student.`
    };

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
      { name: 'budget', type: 'number', label: 'Total Budget' },
      { name: 'date', type: 'date', label: 'Allocation Date' }
    ];
  }
}
