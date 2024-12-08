<template>
  <div class="personal-finance">
    <SampleDataLoader @load-sample="handleSampleData" />
    <ModuleForm 
      :module="module"
      :initial-values="formData"
      @submit="handleSubmit" 
    />

    <div class="mt-6">
      <FinancialHealthDashboard
        v-if="result?.healthAnalysis"
        :analysis="result.healthAnalysis"
      />
    </div>

    <div class="mt-6">
      <HistoricalNetWorthTracker 
        v-if="historicalData.length > 0"
        :data="historicalData"
      />
      <p v-else class="text-gray-500 text-center">
        No historical data available yet. Complete calculations to start tracking net worth over time.
      </p>
    </div>

    <BudgetPieChart
      v-if="result && result.budgetAllocation"
      :budgetAllocation="result.budgetAllocation"
      class="mt-6"
    />

    <SavingsGoalProgress
      v-if="result && result.goals"
      :goals="result.goals"
      :monthlyIncome="result.monthlyIncome"
      class="mt-6"
    />

    <NetWorthGraph
      v-if="result && result.historicalData"
      :historicalData="result.historicalData"
      class="mt-6"
    />

    <PortfolioAllocationChart
      v-if="result && result.assets?.Investments"
      :portfolio="result.assets.Investments"
      :expectedReturn="result.investmentMetrics?.expectedReturn"
      :volatility="result.investmentMetrics?.volatility"
      class="mt-6"
    />

    <DebtStrategyComparison
      v-if="result && result.debts"
      :debts="result.debts"
      :monthlyPaymentCapacity="result.monthlyPaymentCapacity"
      class="mt-6"
    />

    <RetirementProjectionGraph
      v-if="result && result.retirementProjection"
      :currentAge="result.age"
      :retirementAge="result.retirementAge"
      :currentSavings="result.currentSavings"
      :monthlyContribution="result.monthlyContribution"
      :desiredRetirementIncome="result.desiredRetirementIncome"
      :projections="result.retirementProjection"
      class="mt-6"
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import PersonalFinance from './index';
import FinancialHealthDashboard from './components/FinancialHealthDashboard.vue';
import HistoricalNetWorthTracker from './components/HistoricalNetWorthTracker.vue';
import SampleDataLoader from './SampleDataLoader.vue';
import ModuleForm from '../../components/ModuleForm.vue';
import ResultsDisplay from '../../components/ResultsDisplay.vue';
import NetWorthTracker from './NetWorthTracker.vue';
import RetirementDashboard from './RetirementDashboard.vue';
import GoalTracker from './GoalTracker.vue';
import FinancialDashboardWrapper from './FinancialDashboardWrapper.vue';
import BudgetPieChart from './components/BudgetPieChart.vue';
import SavingsGoalProgress from './components/SavingsGoalProgress.vue';
import NetWorthGraph from './components/NetWorthGraph.vue';
import PortfolioAllocationChart from './components/PortfolioAllocationChart.vue';
import DebtStrategyComparison from './components/DebtStrategyComparison.vue';
import RetirementProjectionGraph from './components/RetirementProjectionGraph.vue';

// Initialize store
const store = useStore();

// Reactive state
const module = new PersonalFinance();
const formData = ref({});
const result = ref(null);
const budgetAllocation = ref({});
const assets = ref({});
const liabilities = ref({});

const historicalData = computed(() => {
  const moduleState = store.getters.getModuleState(module.getName());
  return moduleState?.historicalData || [];
});

// Computed properties
const totalAllocation = computed(() => {
  return Object.values(budgetAllocation.value)
    .reduce((sum, value) => sum + Number(value), 0)
    .toFixed(1);
});

// Methods
const handleSampleData = (sampleData) => {
  console.log('Received sample data:', sampleData);
  if (!sampleData.monthlyIncome) {
    console.error('Missing monthly income in sample data');
    return;
  }
  formData.value = { ...sampleData };
  handleSubmit({
    ...sampleData.personalInfo,
    ...sampleData.currentFinances,
    assets: sampleData.assets,
    liabilities: sampleData.liabilities,
    goals: sampleData.goals
  });
};

const handleSubmit = async (formValues) => {
  try {
    result.value = await module.solve({
      ...formValues,
      incomeGrowthRate: formValues.incomeGrowthRate || 0
    });

    await store.dispatch('saveModuleData', {
      moduleName: module.getName(),
      data: { 
        result: result.value,
        historicalData: result.value.historicalData 
      }
    });

    // Update local state
    if (result.value) {
      budgetAllocation.value = result.value.budgetAllocation;
      assets.value = result.value.assets;
      liabilities.value = result.value.liabilities;
    }
  } catch (error) {
    console.debug('Calculation message:', error.message);
  }
};

const updateCategoryValue = (fieldName, category, value, updateValue) => {
  const newValue = Number(value);
  const updatedField = { 
    ...fieldName === 'budgetAllocation' ? budgetAllocation.value : 
      fieldName === 'assets' ? assets.value : liabilities.value
  };
  updatedField[category] = newValue;
  updateValue(updatedField);
};

const updateNestedCategoryValue = (fieldName, maincategory, subcategory, value, updateValue) => {
  const newValue = Number(value);
  const field = fieldName === 'assets' ? assets.value : liabilities.value;
  const updatedField = {
    ...field,
    [maincategory]: {
      ...field[maincategory],
      [subcategory]: newValue
    }
  };
  updateValue(updatedField);
};

// Watch for changes in formData
watch(formData, (newData) => {
  if (Object.keys(newData).length > 0) {
    handleSubmit(newData);
  }
}, { deep: true });

// Load saved data on component mount
onMounted(() => {
  const savedData = store.getters.getModuleData(module.getName());
  if (savedData?.result) {
    result.value = savedData.result;
    budgetAllocation.value = savedData.result.budgetAllocation;
    assets.value = savedData.result.assets;
    liabilities.value = savedData.result.liabilities;
  }
});
</script>

<style scoped>
.personal-finance {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.budget-allocation,
.category-values {
  margin-bottom: 20px;
}

.budget-category,
.category-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.budget-category input,
.category-input input {
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
