<template>
  <div class="reforestation">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input 
          v-if="field.name !== 'treeTypes'"
          :id="field.name" 
          :type="field.type" 
          v-model.number="formData[field.name]"
          :min="0"
          required
        >
      </div>
      <div>
        <h3>Tree Types</h3>
        <div v-for="(tree, index) in treeTypes" :key="index">
          <input v-model="tree.name" placeholder="Tree Name" required>
          <input v-model.number="tree.cost" type="number" placeholder="Cost" min="0" required>
          <input v-model.number="tree.growthRate" type="number" placeholder="Growth Rate" min="0" max="1" step="0.1" required>
          <input v-model.number="tree.carbonSequestration" type="number" placeholder="Carbon Sequestration" min="0" required>
          <input v-model.number="tree.coverage" type="number" placeholder="Coverage (sq m)" min="0" required>
          <button type="button" @click="removeTreeType(index)">Remove</button>
        </div>
        <button type="button" @click="addTreeType">Add Tree Type</button>
      </div>
      <button type="submit">Optimize</button>
    </form>
    <div v-if="result" class="result">
      <h3>Result:</h3>
      <p>{{ result.message }}</p>
      <p>Total Trees: {{ result.totalTrees }}</p>
      <p>Area Covered: {{ result.areaCovered }} sq m</p>
    </div>
    <ReforestationChart v-if="result" :data="result" />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Reforestation from './index';
import ReforestationChart from './ReforestationChart.vue';
import EventBus from '../../core/EventBus';

export default {
  name: 'ReforestationComponent',
  components: {
    ReforestationChart
  },
  data() {
    return {
      module: new Reforestation(),
      formData: {
        area: 0,
        budget: 0
      },
      treeTypes: [],
      result: null
    };
  },
  computed: {
    ...mapGetters(['getModuleData'])
  },
  methods: {
    ...mapActions(['saveModuleData']),
    solveOptimization() {
      try {
        const input = {
          ...this.formData,
          treeTypes: this.treeTypes
        };
        this.result = this.module.solve(input);
        this.saveModuleData({
          moduleName: this.module.getName(),
          data: { formData: input, result: this.result }
        });
      } catch (error) {
        alert(error.message);
      }
    },
    addTreeType() {
      this.treeTypes.push({
        name: '',
        cost: 0,
        growthRate: 0,
        carbonSequestration: 0,
        coverage: 0
      });
    },
    removeTreeType(index) {
      this.treeTypes.splice(index, 1);
    },
    updateModuleState({ moduleName, moduleState }) {
      if (moduleName === this.module.getName()) {
        this.result = moduleState.lastPlan;
      }
    }
  },
  created() {
    const savedData = this.getModuleData(this.module.getName());
    if (savedData.formData) {
      this.formData = {
        area: savedData.formData.area,
        budget: savedData.formData.budget
      };
      this.treeTypes = savedData.formData.treeTypes;
      this.result = savedData.result;
    }

    // Use the existing EventBus
    EventBus.on('updateModuleState', this.updateModuleState);
  },
  beforeUnmount() {
    // Remove event listener
    EventBus.off('updateModuleState', this.updateModuleState);
  }
};
</script>

<style scoped>
.reforestation {
  max-width: 600px;
  margin: 0 auto;
}

form div {
  margin-bottom: 10px;
}

input {
  width: 100%;
  padding: 5px;
  margin-top: 5px;
}

button {
  margin-top: 10px;
}
</style>
