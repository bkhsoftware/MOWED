<template>
  <div class="education">
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
import Education from './index';
import ModuleForm from '../ModuleForm.vue';
import ResultsDisplay from '../ResultsDisplay.vue';
import ChartComponent from '../ChartComponent.vue';

export default {
  name: 'EducationComponent',
  components: {
    ModuleForm,
    ResultsDisplay,
    ChartComponent
  },
  data() {
    return {
      module: new Education(),
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
        labels: ['Students per Teacher', 'Students per Classroom', 'Budget per Student'],
        datasets: [{
          label: 'Education Resources',
          data: [
            this.result.studentsPerTeacher,
            this.result.studentsPerClassroom,
            this.result.budgetPerStudent
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)'
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
.education {
  max-width: 800px;
  margin: 0 auto;
}
</style>
