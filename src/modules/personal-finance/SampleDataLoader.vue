<template>
  <div class="sample-data-loader">
    <div class="flex items-center space-x-2 mb-4">
      <button
        @click="loadSampleData"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
      >
        <span>Load Sample Data</span>
        <div v-if="loading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
      </button>
      <div v-if="showConfirmation" class="text-sm text-green-600">
        Sample data loaded successfully!
      </div>
    </div>
    <div v-if="showInfo" class="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
      <h4 class="font-semibold mb-2">Sample Data Information:</h4>
      <ul class="list-disc list-inside space-y-1">
        <li>Demonstrates a typical financial profile for a 30-year-old professional</li>
        <li>Includes 12 months of historical data</li>
        <li>Shows realistic asset and liability distributions</li>
        <li>Contains sample financial goals and retirement planning</li>
      </ul>
      <p class="mt-2 text-xs text-blue-600">
        Note: This is example data for demonstration purposes only.
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { PersonalFinanceSampleData } from './PersonalFinanceSampleData';

export default {
  name: 'SampleDataLoader',
  emits: ['load-sample'],
  
  setup(props, { emit }) {
    const loading = ref(false);
    const showConfirmation = ref(false);
    const showInfo = ref(false);

    const loadSampleData = async () => {
      loading.value = true;
      showInfo.value = true;
      try {
        // Get the sample data
        const rawData = PersonalFinanceSampleData.generateSampleData();
        
        // Ensure all required fields are present and correctly formatted
        const sampleData = {
          monthlyIncome: Number(rawData.monthlyIncome),
          budgetAllocation: { ...rawData.budgetAllocation },
          savingsGoal: Number(rawData.savingsGoal),
          investmentRate: Number(rawData.investmentRate),
          incomeGrowthRate: Number(rawData.incomeGrowthRate),
          assets: { ...rawData.assets },
          liabilities: { ...rawData.liabilities },
          goals: [...(rawData.goals || [])],
          age: Number(rawData.age),
          retirementAge: Number(rawData.retirementAge),
          yearsInRetirement: Number(rawData.yearsInRetirement),
          retirementSavings: Number(rawData.retirementSavings),
          monthlyRetirementContribution: Number(rawData.monthlyRetirementContribution),
          desiredRetirementIncome: Number(rawData.desiredRetirementIncome)
        };

        // Log the data for debugging
        console.log('Sample Data being emitted:', sampleData);
        
        // Verify monthlyIncome is present and valid
        if (typeof sampleData.monthlyIncome !== 'number' || isNaN(sampleData.monthlyIncome)) {
          throw new Error('Invalid monthly income in sample data');
        }

        emit('load-sample', sampleData);

        showConfirmation.value = true;
        setTimeout(() => {
          showConfirmation.value = false;
        }, 3000);
      } catch (error) {
        console.error('Error loading sample data:', error);
        alert('Error loading sample data: ' + error.message);
      } finally {
        loading.value = false;
      }
    };

    return {
      loading,
      showConfirmation,
      showInfo,
      loadSampleData
    };
  }
};
</script>
