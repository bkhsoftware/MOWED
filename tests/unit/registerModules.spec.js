import { registerModules } from '@/registerModules';
import ModuleRegistry from '@/core/ModuleRegistry';
import PersonalFinance from '@/modules/personal-finance';
import Education from '@/modules/education';
import Reforestation from '@/modules/reforestation';
import SmallBusiness from '@/modules/small-business';

jest.mock('@/core/ModuleRegistry');
jest.mock('@/modules/personal-finance');
jest.mock('@/modules/education');
jest.mock('@/modules/reforestation');
jest.mock('@/modules/small-business');

describe('registerModules', () => {
  beforeEach(() => {
    ModuleRegistry.registerModule.mockClear();
    PersonalFinance.mockClear();
    Education.mockClear();
    Reforestation.mockClear();
    SmallBusiness.mockClear();
  });

  test('registers all modules', () => {
    registerModules();

    expect(ModuleRegistry.registerModule).toHaveBeenCalledTimes(4);
    expect(PersonalFinance).toHaveBeenCalledTimes(1);
    expect(Education).toHaveBeenCalledTimes(1);
    expect(Reforestation).toHaveBeenCalledTimes(1);
    expect(SmallBusiness).toHaveBeenCalledTimes(1);
  });

  test('registers modules in the correct order', () => {
    registerModules();

    const calls = ModuleRegistry.registerModule.mock.calls;
    expect(calls[0][0]).toBeInstanceOf(PersonalFinance);
    expect(calls[1][0]).toBeInstanceOf(Education);
    expect(calls[2][0]).toBeInstanceOf(Reforestation);
    expect(calls[3][0]).toBeInstanceOf(SmallBusiness);
  });

  test('handles errors during module registration', () => {
    ModuleRegistry.registerModule.mockImplementationOnce(() => {
      throw new Error('Registration failed');
    });

    expect(() => registerModules()).toThrow('Registration failed');
    expect(ModuleRegistry.registerModule).toHaveBeenCalledTimes(1);
  });
});
