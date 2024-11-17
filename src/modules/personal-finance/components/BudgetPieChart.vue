<template>
  <div class="budget-pie-chart">
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Budget Overview</h3>
      <ChartComponent
        type="pie"
        :data="chartData"
        :options="chartOptions"
        class="h-[400px]"
      />
      <div class="mt-4 text-sm text-gray-500">
        <p>Click on legend items to show/hide categories</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import ChartComponent from '../../../components/ChartComponent.vue';

const props = defineProps({
  budgetAllocation: {
    type: Object,
    required: true
  }
});

// Chart colors array
const chartColors = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(16, 185, 129)', // emerald-500
  'rgb(239, 68, 68)',  // red-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(251, 191, 36)', // amber-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(34, 211, 238)', // cyan-500
  'rgb(139, 92, 246)', // violet-500
  'rgb(245, 158, 11)', // yellow-500
  'rgb(99, 102, 241)'  // indigo-500
];

// Computed property for chart data
const chartData = computed(() => ({
  labels: Object.keys(props.budgetAllocation),
  datasets: [{
    data: Object.values(props.budgetAllocation),
    backgroundColor: chartColors,
    borderColor: 'white',
    borderWidth: 2,
    hoverOffset: 15
  }]
}));

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        padding: 20,
        font: {
          size: 12
        },
        generateLabels: (chart) => {
          const data = chart.data;
          if (!data.labels) return [];
          return data.labels.map((label, i) => ({
            text: `${label} (${data.datasets[0].data[i]}%)`,
            fillStyle: data.datasets[0].backgroundColor[i],
            hidden: false,
            index: i
          }));
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.parsed || 0;
          return `${label}: ${value}%`;
        }
      }
    }
  }
};
</script>

<style scoped>
.budget-pie-chart {
  margin-bottom: 1.5rem;
}
</style>
