import Education from '@/modules/education';
import EventBus from '@/core/EventBus';

jest.mock('@/core/EventBus');

describe('Education Module', () => {
  let education;

  beforeEach(() => {
    education = new Education();
    EventBus.emit.mockClear();
  });

  test('solve method calculates correct results', () => {
    const input = {
      students: 1000,
      teachers: 50,
      classrooms: 40,
      budget: 1000000
    };

    const result = education._solve(input);

    expect(result.studentsPerTeacher).toBe(20);
    expect(result.studentsPerClassroom).toBe(25);
    expect(result.budgetPerStudent).toBe(1000);
    expect(result.message).toContain('20 students per teacher');
    expect(result.message).toContain('25 students per classroom');
    expect(result.message).toContain('$1000.00 budget per student');
  });

  test('solve method throws error when inputs are invalid', () => {
    const input = {
      students: 1000,
      teachers: 0,
      classrooms: 40,
      budget: 1000000
    };

    expect(() => education._solve(input)).toThrow('All input values must be positive');
  });

  test('getInputFields returns correct fields', () => {
    const fields = education.getInputFields();

    expect(fields).toHaveLength(4);
    expect(fields).toContainEqual({ name: 'students', type: 'number', label: 'Number of Students' });
    expect(fields).toContainEqual({ name: 'teachers', type: 'number', label: 'Number of Teachers' });
    expect(fields).toContainEqual({ name: 'classrooms', type: 'number', label: 'Number of Classrooms' });
    expect(fields).toContainEqual({ name: 'budget', type: 'number', label: 'Total Budget' });
  });

  test('solve method emits event with result', () => {
    const input = {
      students: 1000,
      teachers: 50,
      classrooms: 40,
      budget: 1000000
    };

    education._solve(input);

    expect(EventBus.emit).toHaveBeenCalledWith('updateModuleState', expect.any(Object));
  });
});
