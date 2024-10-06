<template>
  <div class="personal-finance">
    <ModuleForm :module="module" @submit="handleSubmit">
      <template v-slot:budgetAllocation="{ field, value, updateValue }">
        <div class="budget-allocation">
          <h3>{{ field.label }}</h3>
          <div v-for="category in field.categories" :key="category" class="budget-category">
            <label>{{ category }}</label>
            <input 
              type="number" 
              :value="value[category] || 0" 
              @input="updateBudgetAllocation(category, $event.target.value, updateValue)"
              min="0"
              max="100"
              step="0.1"
            >
            <span>%</span>
          </div>
          <div class="total">Total: {{ totalAllocation }}%</div>
        </div>
      </template>
    </ModuleForm>
    <ResultsDisplay v-if="result" :result="result" />
    <ChartComponent 
      v-if="chartData"
      :type="chartType"
      :data="chartData"
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

export default {
  name: 'PersonalFinanceComponent',
  components: {
    ModuleForm,
    ResultsDisplay,
    ChartComponent
  },
  data() {
    return {
      module: new PersonalFinance(),
      result: null,
      chartType: 'pie',
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
      },
      budgetAllocation: {}
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
        this.updateChartData();
      } catch (error) {
        alert(error.message);
      }
    },
    updateBudgetAllocation(category, value, updateValue) {
      const newValue = Number(value);
      this.budgetAllocation = { ...this.budgetAllocation, [category]: newValue };
      updateValue(this.budgetAllocation);
    },
    updateChartData() {
      const allocation = this.result.budgetAllocation;
      this.chartData = {
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
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(40, 159, 64, 1)',
            'rgba(210, 199, 199, 1)',
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
      this.updateChartData();
    }
  }
};
</script>

<style scoped>
.personal-finance {
  max-width: 800px;
  margin: 0 auto;
}

.budget-allocation {
  margin-bottom: 20px;
}

.budget-category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.budget-category input {
  width: 60px;
  margin: 0 10px;
}

.total {
  font-weight: bold;
  margin-top: 10px;
}
</style>
