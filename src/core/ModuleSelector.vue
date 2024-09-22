<template>
  <div class="module-selector">
    <h2>Select a Module</h2>
    <select v-model="selectedModule" @change="changeModule">
      <option value="">-- Select --</option>
      <option v-for="module in availableModules" :key="module.getName()" :value="module.getName()">
        {{ module.getName() }}
      </option>
    </select>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'ModuleSelector',
  data() {
    return {
      selectedModule: '',
    };
  },
  computed: {
    ...mapGetters(['availableModules', 'currentModule']),
  },
  methods: {
    ...mapActions(['selectModule']),
    changeModule() {
      if (this.selectedModule) {
        this.selectModule(this.selectedModule);
      }
    },
  },
  mounted() {
    if (this.currentModule) {
      this.selectedModule = this.currentModule.getName();
    }
  }
};
</script>

<style scoped>
.module-selector {
  margin-bottom: 20px;
}
select {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  font-size: 16px;
}
</style>
