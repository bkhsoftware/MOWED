<template>
  <div class="small-business">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input 
          :id="field.name" 
          :type="field.type" 
          v-model.number="formData[field.name]"
          :min="field.name === 'employees' ? 1 : 0"
          required
        >
      </div>
      <button type="submit">Analyze</button>
    </form>
    <div v-if="result" class="result">
      <h3>Result:</h3>
      <p>{{ result.message }}</p>
    </div>
    <div v-if="result" class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import SmallBusiness from './index';
import Chart from 'chart.js/auto';

export default {
  name: 'SmallBusinessComponent',
  data() {
    return {
      module: new SmallBusiness(),
      formData: {},
      result: null,
      chart: null
    };
  },
  computed: {
    ...mapGetters(['getModuleData'])
  },
  methods: {
    ...mapActions(['saveModuleData']),
    solveOptimization() {
      try {
        this.result = this.module.solve(this.formData);
        this.saveModuleData({
          moduleName: this.module.getName(),
          data: { formData: this.formData, result: this.result }
        });
        this.$nextTick(() => {
          this.createChart();
        });
      } catch (error) {
        alert(error.message);
      }
    },
    createChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d');
      
      if (this.chart) {
        this.chart.destroy();
      }
      
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Revenue', 'Costs', 'Profit'],
          datasets: [{
            label: 'Business Metrics',
            data: [
              this.formData.revenue,
              this.formData.costs,
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
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  },
  created() {
    const savedData = this.getModuleData(this.module.getName());
    if (savedData.formData) {
      this.formData = savedData.formData;
      this.result = savedData.result;
    }
  },
  mounted() {
    if (this.result) {
      this.$nextTick(() => {
        this.createChart();
      });
    }
  }
};
</script>

<style scoped>
.chart-container {
  height: 300px;
  margin-top: 20px;
}
</style>
