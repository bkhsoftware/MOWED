<template>
  <div class="small-business">
    <ModuleForm :module="module" @result="handleResult" />
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
import SmallBusiness from './index';
import ModuleForm from '../ModuleForm.vue';
import ResultsDisplay from '../ResultsDisplay.vue';
import ChartComponent from '../ChartComponent.vue';

export default {
  name: 'SmallBusinessComponent',
  components: {
    ModuleForm,
    ResultsDisplay,
    ChartComponent
  },
  data() {
    return {
      module: new SmallBusiness(),
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
    handleResult(result) {
      this.result = result;
      this.saveModuleData({
        moduleName: this.module.getName(),
        data: { result: this.result }
      });
      this.updateChartData();
    },
    updateChartData() {
      this.chartData = {
        labels: ['Revenue', 'Costs', 'Profit'],
        datasets: [{
          label: 'Business Metrics',
          data: [
            this.result.revenue,
            this.result.costs,
            this.result.profit
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
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
.small-business {
  max-width: 800px;
  margin: 0 auto;
}
</style>
