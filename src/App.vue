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
import PersonalFinanceComponent from './components/PersonalFinanceComponent.vue';

export default {
  name: 'App',
  components: {
    ModuleSelector,
    PersonalFinanceComponent,
  },
  computed: {
    ...mapGetters(['currentModule']),
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

<style scoped>
header {
  text-align: center;
  margin-bottom: 30px;
}

main {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
