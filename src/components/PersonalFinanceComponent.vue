<template>
  <div class="personal-finance">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input :id="field.name" :type="field.type" v-model.number="formData[field.name]" required>
      </div>
      <button type="submit">Optimize</button>
    </form>
    <div v-if="result" class="result">
      <h3>Result:</h3>
      <p>{{ result.message }}</p>
    </div>
  </div>
</template>

<script>
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
  methods: {
    solveOptimization() {
      this.result = this.module.solve(this.formData);
    }
  }
};
</script>
