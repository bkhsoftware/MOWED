<template>
  <div class="personal-finance">
    <ModuleForm :module="module" @submit="handleSubmit" />
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
      chartType: 'bar',
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  },
  computed: {
    ...mapGetters(['getModuleData'])
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
    updateChartData() {
      this.chartData = {
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [{
          label: 'Monthly Finances',
          data: [
            this.result.income,
            this.result.expenses,
            this.result.availableSavings
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
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
</style>
