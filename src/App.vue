<template>
  <div id="app">
    <h1>MOWED</h1>
    <p>Mathematical Optimization With End-user Devices</p>
    <ModuleSelector />
    <component :is="currentModuleComponent" v-if="currentModule"></component>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ModuleSelector from './components/ModuleSelector.vue';
import PersonalFinanceComponent from './components/PersonalFinanceComponent.vue';

export default {
  name: 'App',
  components: {
    ModuleSelector,
    PersonalFinanceComponent,
  },
  computed: {
    ...mapState(['currentModule']),
    currentModuleComponent() {
      if (!this.currentModule) return null;
      switch (this.currentModule.getName()) {
        case 'Personal Finance':
          return 'PersonalFinanceComponent';
        default:
          return null;
      }
    },
  },
};
</script>
