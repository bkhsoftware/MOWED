<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between pb-2">
      <CardTitle>Net Worth History</CardTitle>
      <div class="space-x-2">
        <button
          v-for="timeframe in timeframes"
          :key="timeframe.value"
          @click="selectedTimeframe = timeframe.value"
          :class="[
            'px-3 py-1 rounded-lg text-sm',
            selectedTimeframe === timeframe.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ timeframe.label }}
        </button>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Summary Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="p-4 bg-white rounded-lg border">
          <div class="text-sm text-gray-500">Current Net Worth</div>
          <div class="text-2xl font-bold">
            ${{ formatNumber(currentNetWorth) }}
          </div>
        </div>
        
        <div class="p-4 bg-white rounded-lg border">
          <div class="text-sm text-gray-500">Change</div>
          <div :class="['text-2xl font-bold', netWorthChange >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ netWorthChange >= 0 ? '+' : '' }}
            ${{ formatNumber(Math.abs(netWorthChange)) }}
          </div>
        </div>

        <div class="p-4 bg-white rounded-lg border">
          <div class="text-sm text-gray-500">Percent Change</div>
          <div :class="['text-2xl font-bold', netWorthChangePercent >= 0 ? 'text-green-600' : 'text-red-600']">
            {{ netWorthChangePercent >= 0 ? '+' : '' }}
            {{ netWorthChangePercent.toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="h-[400px]">
        <ChartComponent
          type="line"
          :data="chartData"
          :options="chartOptions"
        />
      </div>

      <!-- Legend -->
      <div class="mt-4 flex items-center justify-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Net Worth</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Assets</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Liabilities</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ChartComponent from '../../../components/ChartComponent.vue';

const props = defineProps({
  data: {
    type: Array,
    required: true,
    validator: (data) => data.every(entry => 
      entry.date && 
      typeof entry.netWorth === 'number' &&
      typeof entry.assets === 'number' &&
      typeof entry.liabilities === 'number'
    )
  }
});

const timeframes = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: 'Year' },
  { value: 'ALL', label: 'All' }
];

const selectedTimeframe = ref('1Y');

// Computed properties for metrics
const currentNetWorth = computed(() => {
  return props.data[props.data.length - 1]?.netWorth || 0;
});

const previousNetWorth = computed(() => {
  return props.data[props.data.length - 2]?.netWorth || 0;
});

const netWorthChange = computed(() => {
  return currentNetWorth.value - previousNetWorth.value;
});

const netWorthChangePercent = computed(() => {
  return previousNetWorth.value ? (netWorthChange.value / previousNetWorth.value) * 100 : 0;
});

// Filter data based on selected timeframe
const filteredData = computed(() => {
  const now = new Date();
  const timeframeLimits = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    'ALL': Infinity
  };
  
  const daysLimit = timeframeLimits[selectedTimeframe.value];
  return props.data.filter(entry => {
    const entryDate = new Date(entry.date);
    const diffTime = Math.ceil((now - entryDate) / (1000 * 60 * 60 * 24));
    return diffTime <= daysLimit;
  });
});

// Chart configuration
const chartData = computed(() => ({
  labels: filteredData.value.map(entry => 
    new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  ),
  datasets: [
    {
      label: 'Net Worth',
      data: filteredData.value.map(entry => entry.netWorth),
      borderColor: 'rgb(59, 130, 246)', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Assets',
      data: filteredData.value.map(entry => entry.assets),
      borderColor: 'rgb(16, 185, 129)', // emerald-500
      backgroundColor: 'transparent',
      tension: 0.4,
      borderDash: [5, 5]
    },
    {
      label: 'Liabilities',
      data: filteredData.value.map(entry => entry.liabilities),
      borderColor: 'rgb(239, 68, 68)', // red-500
      backgroundColor: 'transparent',
      tension: 0.4,
      borderDash: [5, 5]
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `$${(value / 1000)}k`
      }
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: $${value.toLocaleString()}`;
        }
      }
    }
  }
};

// Helper function for number formatting
const formatNumber = (value) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
</script>

<style scoped>
.space-x-2 > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(0.5rem * var(--tw-space-x-reverse));
  margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)));
}
</style>
