<template>
  <div class="personal-finance">
    <SampleDataLoader @load-sample="handleSampleData" />
    <ModuleForm 
      :module="module" 
      :initial-values="formData"
      @submit="handleSubmit" 
    />
    <ResultsDisplay v-if="result" :result="result" />
    <FinancialDashboardWrapper 
      v-if="result" 
      :result="result" 
    />
    <NetWorthTracker 
      v-if="result" 
      :assets="result.assets" 
      :liabilities="result.liabilities" 
    />
    <RetirementDashboard
      v-if="result && result.retirementProjection"
      :retirementProjection="result.retirementProjection"
    />
    <GoalTracker 
      v-if="result && result.goalProgress" 
      :goals="result.goalProgress" 
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
import { ref } from 'vue';
import { mapActions, mapGetters } from 'vuex';
import PersonalFinance from './index';
import SampleDataLoader from './SampleDataLoader.vue';
import ModuleForm from '../../components/ModuleForm.vue';
import ResultsDisplay from '../../components/ResultsDisplay.vue';
import ChartComponent from '../../components/ChartComponent.vue';
import NetWorthTracker from './NetWorthTracker.vue';
import RetirementDashboard from './RetirementDashboard.vue';
import GoalTracker from './GoalTracker.vue';
import FinancialDashboardWrapper from './FinancialDashboardWrapper.vue';

export default {
  name: 'PersonalFinanceComponent',
  components: {
    SampleDataLoader,
    ModuleForm,
    ResultsDisplay,
    ChartComponent,
    NetWorthTracker,
    RetirementDashboard,
    GoalTracker,
    FinancialDashboardWrapper
  },
  setup() {
    const formData = ref({});
    
    // Your existing setup code...
    
    return {
      formData,
      // ... other return values ...
    };
  },
  watch: {
    formData: {
      handler(newData) {
        if (Object.keys(newData).length > 0) {
          this.handleSubmit(newData);
        }
      },
      deep: true
    }
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
    handleSampleData(sampleData) {
      console.log('Received sample data:', sampleData); // Debug log
      if (!sampleData.monthlyIncome) {
        console.error('Missing monthly income in sample data');
        return;
      }
      this.formData = { ...sampleData };
      this.handleSubmit({
        ...sampleData.personalInfo,
        ...sampleData.currentFinances,
        assets: sampleData.assets,
        liabilities: sampleData.liabilities,
        goals: sampleData.goals
      });
    },
    ...mapActions(['saveModuleData']),
    async handleSubmit(formData) {
      try {
        this.result = await this.module.solve({
          ...formData,
          incomeGrowthRate: formData.incomeGrowthRate || 0
        });
        this.saveModuleData({
          moduleName: this.module.getName(),
          data: { result: this.result }
        });
        this.updateBudgetChartData();
      } catch (error) {
        // Instead of alert, log to console
        console.debug('Calculation message:', error.message);
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
    updateNestedCategoryValue(fieldName, maincategory, subcategory, value, updateValue) {
      const newValue = Number(value);
      const updatedField = { 
        ...this[fieldName], 
        [maincategory]: { 
          ...this[fieldName][maincategory], 
          [subcategory]: newValue 
        } 
      };
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
.nested-category-values {
  margin-bottom: 20px;
}

.main-category {
  margin-bottom: 15px;
}

.subcategory-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.subcategory-input input {
  width: 100px;
  margin: 0 10px;
}
</style>
