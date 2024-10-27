<template>
  <div class="financial-dashboard">
    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="(metric, index) in metrics" :key="index" class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <p class="text-sm text-gray-500">{{ metric.title }}</p>
            <div class="flex items-center space-x-2">
              <p class="text-2xl font-bold">${{ formatNumber(metric.value) }}</p>
              <span :class="`text-sm ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`">
                {{ metric.change }}
              </span>
            </div>
          </div>
          <component 
            :is="metric.icon" 
            class="h-8 w-8"
            :class="metric.iconClass"
          />
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="bg-white rounded-lg p-6 shadow-sm">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold">Financial Overview</h3>
        <div class="flex space-x-2">
          <button
            v-for="period in timePeriods"
            :key="period"
            @click="selectedTimeframe = period"
            :class="[
              'px-3 py-1 rounded-lg text-sm',
              selectedTimeframe === period
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ period }}
          </button>
        </div>
      </div>
      
      <div class="h-80">
        <LineChart
          v-if="chartData"
          :chart-data="chartData"
          :options="chartOptions"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, defineComponent } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line as LineChart } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default defineComponent({
  name: 'FinancialDashboard',
  components: {
    LineChart
  },
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const selectedTimeframe = ref('1Y');
    const timePeriods = ['1M', '3M', '6M', '1Y', 'ALL'];

    const calculateTotalInvestments = (assets) => {
      return assets.Investments 
        ? Object.values(assets.Investments).reduce((sum, value) => sum + value, 0)
        : 0;
    };

    const metrics = computed(() => [
      {
        title: 'Net Worth',
        value: props.result.netWorth,
        change: '+12%',
        trend: 'up',
        icon: 'div',
        iconClass: 'text-blue-500'
      },
      {
        title: 'Total Savings',
        value: props.result.availableSavings * 12, // Annualized
        change: '+20%',
        trend: 'up',
        icon: 'div',
        iconClass: 'text-green-500'
      },
      {
        title: 'Investments',
        value: calculateTotalInvestments(props.result.assets),
        change: '+8.5%',
        trend: 'up',
        icon: 'div',
        iconClass: 'text-purple-500'
      },
      {
        title: 'Total Debt',
        value: props.result.totalLiabilities,
        change: '-15%',
        trend: 'down',
        icon: 'div',
        iconClass: 'text-red-500'
      }
    ]);

    const chartData = computed(() => ({
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [
        {
          label: 'Net Worth',
          data: [50000, 52000, 54000, props.result.netWorth],
          borderColor: '#3b82f6',
          tension: 0.1
        },
        {
          label: 'Savings',
          data: [15000, 16000, 17000, props.result.availableSavings * 12],
          borderColor: '#22c55e',
          tension: 0.1
        },
        {
          label: 'Investments',
          data: [35000, 36000, 37000, calculateTotalInvestments(props.result.assets)],
          borderColor: '#a855f7',
          tension: 0.1
        },
        {
          label: 'Debt',
          data: [20000, 19000, 18000, props.result.totalLiabilities],
          borderColor: '#ef4444',
          tension: 0.1
        }
      ]
    }));

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `$${value.toLocaleString()}`
          }
        }
      }
    };

    const formatNumber = (value) => {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    return {
      selectedTimeframe,
      timePeriods,
      metrics,
      chartData,
      chartOptions,
      formatNumber
    };
  }
});
</script>

<style scoped>
.financial-dashboard {
  @apply space-y-6;
}
</style>
