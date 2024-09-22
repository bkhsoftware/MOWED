<template>
  <div id="app">
    <header>
      <h1>MOWED</h1>
      <p>Mathematical Optimization With End-user Devices</p>
    </header>
    <main>
      <ModuleSelector />
      <component :is="currentModuleComponent" v-if="currentModule"></component>
    </main>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ModuleSelector from './components/ModuleSelector.vue';
import PersonalFinanceComponent from './modules/personal-finance/PersonalFinanceComponent.vue';
import EducationComponent from './modules/education/EducationComponent.vue';
import ReforestationComponent from './modules/reforestation/ReforestationComponent.vue';
import SmallBusinessComponent from './modules/small-business/SmallBusinessComponent.vue';

export default {
  name: 'App',
  components: {
    ModuleSelector,
    PersonalFinanceComponent,
    EducationComponent,
    ReforestationComponent,
    SmallBusinessComponent
  },
  computed: {
    ...mapGetters(['currentModule']),
    currentModuleComponent() {
      if (!this.currentModule) return null;
      switch (this.currentModule.getName()) {
        case 'Personal Finance':
          return 'PersonalFinanceComponent';
        case 'Education':
          return 'EducationComponent';
        case 'Reforestation':
          return 'ReforestationComponent';
        case 'Small Business':
          return 'SmallBusinessComponent';
        default:
          return null;
      }
    }
  }
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

main {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 5px;
}
</style>
