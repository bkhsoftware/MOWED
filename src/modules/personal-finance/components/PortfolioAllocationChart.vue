<template>
  <div class="portfolio-allocation">
    <Card>
      <CardHeader>
        <CardTitle>Investment Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Donut chart -->
          <div class="flex flex-col items-center">
            <div class="h-[300px] w-full">
              <ChartComponent
                type="doughnut"
                :data="chartData"
                :options="chartOptions"
              />
            </div>
            <div class="mt-4 text-center">
              <div class="text-sm text-gray-500">Total Portfolio Value</div>
              <div class="text-2xl font-bold">${{ formatNumber(totalValue) }}</div>
            </div>
          </div>

          <!-- Detailed breakdown -->
          <div class="space-y-4">
            <div v-for="(allocation, category) in portfolio" :key="category" class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getCategoryColor(category) }"
                  ></div>
                  <span class="font-medium">{{ category }}</span>
                </div>
                <span class="font-medium">
                  {{ (getCategoryPercentage(category) * 100).toFixed(1) }}%
                </span>
              </div>
              
              <!-- Subcategories -->
              <div class="ml-5 space-y-1">
                <div 
                  v-for="(value, subcategory) in allocation" 
                  :key="subcategory"
                  class="flex items-center justify-between text-sm text-gray-600"
                >
                  <span>{{ subcategory }}</span>
                  <div class="flex items-center space-x-2">
                    <span>${{ formatNumber(value) }}</span>
                    <span class="text-gray-400">
                      ({{ ((value / totalValue) * 100).toFixed(1) }}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Risk metrics -->
            <div class="mt-6 pt-4 border-t">
              <h4 class="font-medium mb-2">Portfolio Metrics</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="text-gray-500">Risk Level</div>
                  <div class="font-medium">{{ getRiskLevel }}</div>
                </div>
                <div>
                  <div class="text-gray-500">Diversification Score</div>
                  <div class="font-medium">{{ getDiversificationScore }}/10</div>
                </div>
                <div>
                  <div class="text-gray-500">Expected Return</div>
                  <div class="font-medium">{{ expectedReturn }}%</div>
                </div>
                <div>
                  <div class="text-gray-500">Volatility</div>
                  <div class="font-medium">{{ volatility }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="recommendations.length > 0" class="mt-6 pt-4 border-t">
          <h4 class="font-medium mb-2">Recommendations</h4>
          <ul class="space-y-2">
            <li 
              v-for="(rec, index) in recommendations" 
              :key="index"
              class="flex items-start space-x-2 text-sm"
            >
              <div class="w-4 h-4 mt-0.5 flex-shrink-0">
                <InfoIcon class="w-4 h-4 text-blue-500" />
              </div>
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { InfoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartComponent from '../../../components/ChartComponent.vue';

const props = defineProps({
  portfolio: {
    type: Object,
    required: true,
    validator: (portfolio) => {
      return Object.values(portfolio).every(category => 
        typeof category === 'object' &&
        Object.values(category).every(value => typeof value === 'number')
      );
    }
  },
  expectedReturn: {
    type: Number,
    default: 0
  },
  volatility: {
    type: Number,
    default: 0
  }
});

// Chart colors
const categoryColors = {
  'Stocks': 'rgb(59, 130, 246)',    // blue-500
  'Bonds': 'rgb(16, 185, 129)',     // emerald-500
  'Real Estate': 'rgb(168, 85, 247)', // purple-500
  'Cash': 'rgb(251, 191, 36)',      // amber-500
  'Commodities': 'rgb(236, 72, 153)', // pink-500
  'International': 'rgb(34, 211, 238)', // cyan-500
  'Alternative': 'rgb(139, 92, 246)'  // violet-500
};

// Computed properties
const totalValue = computed(() => {
  return Object.values(props.portfolio).reduce((total, category) => {
    return total + Object.values(category).reduce((sum, value) => sum + value, 0);
  }, 0);
});

const chartData = computed(() => ({
  labels: Object.keys(props.portfolio),
  datasets: [{
    data: Object.entries(props.portfolio).map(([category, allocation]) => 
      Object.values(allocation).reduce((sum, value) => sum + value, 0)
    ),
    backgroundColor: Object.keys(props.portfolio).map(category => categoryColors[category] || '#CBD5E1'),
    borderWidth: 2,
    borderColor: '#ffffff'
  }]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const value = context.raw;
          const percentage = ((value / totalValue.value) * 100).toFixed(1);
          return `${context.label}: $${formatNumber(value)} (${percentage}%)`;
        }
      }
    }
  }
};

const getRiskLevel = computed(() => {
  const stocksPercentage = getCategoryPercentage('Stocks') * 100;
  if (stocksPercentage >= 80) return 'Aggressive';
  if (stocksPercentage >= 60) return 'Moderately Aggressive';
  if (stocksPercentage >= 40) return 'Moderate';
  if (stocksPercentage >= 20) return 'Moderately Conservative';
  return 'Conservative';
});

const getDiversificationScore = computed(() => {
  const categoryCount = Object.keys(props.portfolio).length;
  const avgAllocation = 1 / categoryCount;
  
  // Calculate how well balanced the portfolio is
  const totalDeviation = Object.entries(props.portfolio).reduce((sum, [category]) => {
    const actual = getCategoryPercentage(category);
    return sum + Math.abs(actual - avgAllocation);
  }, 0);

  // Convert to a 0-10 score
  return Math.round((1 - totalDeviation / 2) * 10);
});

// Computed recommendations based on portfolio analysis
const recommendations = computed(() => {
  const recs = [];
  const stocksPercentage = getCategoryPercentage('Stocks') * 100;
  const bondsPercentage = getCategoryPercentage('Bonds') * 100;
  const cashPercentage = getCategoryPercentage('Cash') * 100;

  if (getDiversificationScore.value < 7) {
    recs.push('Consider increasing portfolio diversification across more asset classes.');
  }

  if (stocksPercentage > 80) {
    recs.push('Current stock allocation suggests high risk. Consider adding bonds for better balance.');
  }

  if (cashPercentage < 5) {
    recs.push('Maintain adequate cash reserves for emergencies and opportunities.');
  }

  if (bondsPercentage < 20 && getRiskLevel.value !== 'Aggressive') {
    recs.push('Consider increasing bond allocation for better portfolio stability.');
  }

  return recs;
});

// Helper functions
const formatNumber = (value) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getCategoryColor = (category) => {
  return categoryColors[category] || '#CBD5E1';
};

const getCategoryPercentage = (category) => {
  const categoryTotal = Object.values(props.portfolio[category] || {})
    .reduce((sum, value) => sum + value, 0);
  return categoryTotal / totalValue.value;
};
</script>
