import ModuleRegistry from './core/ModuleRegistry';
import PersonalFinance from './modules/personal-finance';
import Education from './modules/education';
import Reforestation from './modules/reforestation';
import SmallBusiness from './modules/small-business';

export function registerModules() {
  ModuleRegistry.registerModule(new PersonalFinance());
  ModuleRegistry.registerModule(new Education());
  ModuleRegistry.registerModule(new Reforestation());
  ModuleRegistry.registerModule(new SmallBusiness());
}
