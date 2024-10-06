<template>
  <div class="personal-finance">
    <ModuleForm :module="module" @submit="handleSubmit">
      <!-- ... (previous custom slots) -->
      <template v-slot:categoryValues="{ field, value, updateValue }">
        <div class="category-values">
          <h3>{{ field.label }}</h3>
          <div v-for="category in field.categories" :key="category" class="category-input">
            <label>{{ category }}</label>
            <input 
              type="number" 
              :value="value[category] || 0" 
              @input="updateCategoryValue(field.name, category, $event.target.value, updateValue)"
              min="0"
              step="0.01"
            >
          </div>
        </div>
      </template>
    </ModuleForm>
    <ResultsDisplay v-if="result" :result="result" />
    <NetWorthTracker 
      v-if="result" 
      :assets="result.assets" 
      :liabilities="result.liabilities" 
    />
    <ChartComponent 
      v-if="budgetChartData"
      :type="budgetChartType"
      :data="budgetChartData"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import PersonalFinance from './index';
import ModuleForm from '../ModuleForm.vue';
import ResultsDisplay from '../ResultsDisplay.vue';
import ChartComponent from '../ChartComponent.vue';
import NetWorthTracker from './NetWorthTracker.vue';

export default {
  name: 'PersonalFinanceComponent',
  components: {
    ModuleForm,
    ResultsDisplay,
    ChartComponent,
    NetWorthTracker
  },
  data() {
    return {
      module: new PersonalFinance(),
      result: null,
      budgetChartType: 'pie',
      budgetChartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },
      budgetAllocation: {},
      assets: {},
      liabilities: {}
    };
  },
  computed: {
    ...mapGetters(['getModuleData']),
    totalAllocation() {
      return Object.values(this.budgetAllocation).reduce((sum, value) => sum + Number(value), 0).toFixed(1);
    }
  },
  methods: {
    ...mapActions(['saveModuleData']),
    async handleSubmit(formData) {
      try {
        this.result = await this.module.solve(formData);
        this.saveModuleData({
          moduleName: this.module.getName(),
          data: { result: this.result }
        });
        this.updateBudgetChartData();
      } catch (error) {
        alert(error.message);
      }
    },
    updateBudgetAllocation(category, value, updateValue) {
      const newValue = Number(value);
      this.budgetAllocation = { ...this.budgetAllocation, [category]: newValue };
      updateValue(this.budgetAllocation);
    },
    updateCategoryValue(fieldName, category, value, updateValue) {
      const newValue = Number(value);
      const updatedField = { ...this[fieldName], [category]: newValue };
      this[fieldName] = updatedField;
      updateValue(updatedField);
    },
    updateBudgetChartData() {
      const allocation = this.result.budgetAllocation;
      this.budgetChartData = {
        labels: Object.keys(allocation),
        datasets: [{
          data: Object.values(allocation),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 159, 64, 0.6)',
            'rgba(210, 199, 199, 0.6)',
          ],
          borderWidth: 1
        }]
      };
    }
  },
  created() {
    const savedData = this.getModuleData(this.module.getName());
    if (savedData && savedData.result) {
      this.result = savedData.result;
      this.budgetAllocation = savedData.result.budgetAllocation;
      this.assets = savedData.result.assets;
      this.liabilities = savedData.result.liabilities;
      this.updateBudgetChartData();
    }
  }
};
</script>

<style scoped>
.personal-finance {
  max-width: 800px;
  margin: 0 auto;
}

.budget-allocation, .category-values {
  margin-bottom: 20px;
}

.budget-category, .category-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.budget-category input, .category-input input {
  width: 100px;
  margin: 0 10px;
}

.total {
  font-weight: bold;
  margin-top: 10px;
}
</style>
