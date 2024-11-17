<template>
  <div class="net-worth-graph">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <CardTitle>Net Worth Over Time</CardTitle>
        <div class="space-x-2">
          <button
            v-for="period in timePeriods"
            :key="period"
            @click="selectedTimePeriod = period"
            :class="[
              'px-3 py-1 rounded-lg text-sm',
              selectedTimePeriod === period
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ period }}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="h-[400px]">
          <ChartComponent
            type="line"
            :data="chartData"
            :options="chartOptions"
          />
        </div>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-sm">
            <div class="text-gray-500">Current Net Worth</div>
            <div class="text-lg font-semibold">${{ formatNumber(currentNetWorth) }}</div>
          </div>
          <div class="text-sm">
            <div class="text-gray-500">Change ({{ selectedTimePeriod }})</div>
            <div 
              class="text-lg font-semibold"
              :class="netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ netWorthChange >= 0 ? '+' : '' }}${{ formatNumber(netWorthChange) }}
            </div>
          </div>
          <div class="text-sm">
            <div class="text-gray-500">Assets</div>
            <div class="text-lg font-semibold text-emerald-600">
              ${{ formatNumber(currentAssets) }}
            </div>
          </div>
          <div class="text-sm">
            <div class="text-gray-500">Liabilities</div>
            <div class="text-lg font-semibold text-red-600">
              ${{ formatNumber(currentLiabilities) }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartComponent from '../../../components/ChartComponent.vue';

const props = defineProps({
  historicalData: {
    type: Array,
    required: true,
    validator: (data) => data.every(entry => 
      entry.date && 
      typeof entry.assets === 'number' && 
      typeof entry.liabilities === 'number'
    )
  }
});

// Time period selection
const timePeriods = ['1M', '3M', '6M', '1Y', 'ALL'];
const selectedTimePeriod = ref('1Y');

// Helper functions
const formatNumber = (value) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getTimeFilteredData = (data, period) => {
  const now = new Date();
  const periodMonths = {
    '1M': 1,
    '3M': 3,
    '6M': 6,
    '1Y': 12,
    'ALL': 999
  };
  
  const monthsAgo = new Date(now.setMonth(now.getMonth() - periodMonths[period]));
  return data.filter(entry => new Date(entry.date) >= monthsAgo);
};

// Computed properties
const filteredData = computed(() => 
  getTimeFilteredData(props.historicalData, selectedTimePeriod.value)
);

const chartData = computed(() => ({
  labels: filteredData.value.map(entry => 
    new Date(entry.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  ),
  datasets: [
    {
      label: 'Net Worth',
      data: filteredData.value.map(entry => entry.assets - entry.liabilities),
      borderColor: 'rgb(59, 130, 246)', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3
    },
    {
      label: 'Assets',
      data: filteredData.value.map(entry => entry.assets),
      borderColor: 'rgb(16, 185, 129)', // emerald-500
      borderDash: [5, 5],
      tension: 0.3
    },
    {
      label: 'Liabilities',
      data: filteredData.value.map(entry => entry.liabilities),
      borderColor: 'rgb(239, 68, 68)', // red-500
      borderDash: [5, 5],
      tension: 0.3
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => `$${value.toLocaleString()}`
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
    },
    legend: {
      position: 'top',
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
};

const currentNetWorth = computed(() => {
  const latest = props.historicalData[props.historicalData.length - 1];
  return latest.assets - latest.liabilities;
});

const currentAssets = computed(() => {
  const latest = props.historicalData[props.historicalData.length - 1];
  return latest.assets;
});

const currentLiabilities = computed(() => {
  const latest = props.historicalData[props.historicalData.length - 1];
  return latest.liabilities;
});

const netWorthChange = computed(() => {
  const filtered = filteredData.value;
  if (filtered.length < 2) return 0;
  
  const latest = filtered[filtered.length - 1];
  const earliest = filtered[0];
  
  return (latest.assets - latest.liabilities) - 
         (earliest.assets - earliest.liabilities);
});
</script>
