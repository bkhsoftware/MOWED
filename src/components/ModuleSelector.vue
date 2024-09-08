<template>
  <div class="module-selector">
    <h2>Select a Module</h2>
    <select v-model="selectedModule" @change="changeModule">
      <option value="">-- Select --</option>
      <option v-for="module in modules" :key="module.getName()" :value="module.getName()">
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
    ...mapGetters(['availableModules']),
    modules() {
      return this.availableModules;
    },
  },
  methods: {
    ...mapActions(['selectModule']),
    changeModule() {
      if (this.selectedModule) {
        this.selectModule(this.selectedModule);
      }
    },
  },
};
</script>
