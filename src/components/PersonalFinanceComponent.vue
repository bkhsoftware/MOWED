<template>
  <div class="personal-finance">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input 
          :id="field.name" 
          :type="field.type" 
          v-model.number="formData[field.name]"
          :min="0"
          required
        >
      </div>
      <button type="submit">Optimize</button>
    </form>
    <div v-if="result" class="result">
      <h3>Result:</h3>
      <p>{{ result.message }}</p>
      <p>Monthly savings: ${{ result.availableSavings.toFixed(2) }}</p>
      <p>Time to reach goal: {{ result.monthsToGoal }} months</p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import PersonalFinance from '../modules/PersonalFinance';

export default {
  name: 'PersonalFinanceComponent',
  data() {
    return {
      module: new PersonalFinance(),
      formData: {},
      result: null
    };
  },
  computed: {
    ...mapGetters(['getModuleData'])
  },
  methods: {
    ...mapActions(['saveModuleData']),
    solveOptimization() {
      if (this.formData.expenses > this.formData.income) {
        alert('Expenses cannot be greater than income!');
        return;
      }
      this.result = this.module.solve(this.formData);
      this.saveModuleData({
        moduleName: this.module.getName(),
        data: { formData: this.formData, result: this.result }
      });
    }
  },
  created() {
    const savedData = this.getModuleData(this.module.getName());
    if (savedData.formData) {
      this.formData = savedData.formData;
      this.result = savedData.result;
    }
  }
};
</script>
