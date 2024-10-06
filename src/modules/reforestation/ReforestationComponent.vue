<template>
  <div class="reforestation">
    <ModuleForm :module="module" @submit="handleSubmit" />
    <ResultsDisplay v-if="result" :result="result" />
    <ReforestationChart v-if="result" :data="result" />
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
import Reforestation from './index';
import ModuleForm from '../ModuleForm.vue';
import ResultsDisplay from '../ResultsDisplay.vue';
import ReforestationChart from './ReforestationChart.vue';
import ChartComponent from '../ChartComponent.vue';

export default {
  name: 'ReforestationComponent',
  components: {
    ModuleForm,
    ResultsDisplay,
    ReforestationChart,
    ChartComponent
  },
  data() {
    return {
      module: new Reforestation(),
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
        labels: this.result.allocation.map(tree => tree.name),
        datasets: [{
          label: 'Trees Allocated',
          data: this.result.allocation.map(tree => tree.allocation),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
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
.reforestation {
  max-width: 800px;
  margin: 0 auto;
}
</style>
