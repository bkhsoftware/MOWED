<template>
  <div class="retirement-projection">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Retirement Savings Projection</CardTitle>
        <div class="space-x-2">
          <button
            v-for="view in views"
            :key="view"
            @click="selectedView = view"
            :class="[
              'px-3 py-1 rounded-lg text-sm',
              selectedView === view
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ view }}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Main Projection Chart -->
        <div class="h-[400px] mb-6">
          <ChartComponent
            type="line"
            :data="chartData"
            :options="chartOptions"
          />
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="p-4 bg-white rounded-lg border">
            <div class="text-sm text-gray-500">Probability of Success</div>
            <div class="text-2xl font-bold" :class="getSuccessProbabilityColor">
              {{ successProbability }}%
            </div>
          </div>
          <div class="p-4 bg-white rounded-lg border">
            <div class="text-sm text-gray-500">Projected at Retirement</div>
            <div class="text-2xl font-bold">${{ formatNumber(projectedAtRetirement) }}</div>
          </div>
          <div class="p-4 bg-white rounded-lg border">
            <div class="text-sm text-gray-500">Monthly Income Goal</div>
            <div class="text-2xl font-bold">${{ formatNumber(monthlyIncomeGoal) }}</div>
          </div>
          <div class="p-4 bg-white rounded-lg border">
            <div class="text-sm text-gray-500">Savings Gap</div>
            <div 
              class="text-2xl font-bold"
              :class="savingsGap > 0 ? 'text-red-500' : 'text-green-500'"
            >
              ${{ formatNumber(Math.abs(savingsGap)) }}
            </div>
          </div>
        </div>

        <!-- Scenario Analysis -->
        <div class="space-y-4 mb-6">
          <h4 class="font-medium">Scenario Analysis</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              v-for="scenario in scenarios" 
              :key="scenario.name"
              class="p-4 bg-white rounded-lg border"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ scenario.name }}</span>
                <span 
                  class="text-sm px-2 py-1 rounded"
                  :class="getScenarioClass(scenario.probability)"
                >
                  {{ scenario.probability }}% Probability
                </span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Final Balance</span>
                  <span>${{ formatNumber(scenario.finalBalance) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Monthly Income</span>
                  <span>${{ formatNumber(scenario.monthlyIncome) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Shortfall Risk</span>
                  <span>{{ scenario.shortfallRisk }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-medium mb-2">Recommendations</h4>
          <ul class="space-y-2">
            <li 
              v-for="(rec, index) in recommendations" 
              :key="index"
              class="flex items-start space-x-2"
            >
              <div class="mt-1">
                <InfoIcon class="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div class="font-medium">{{ rec.title }}</div>
                <div class="text-sm text-gray-600">{{ rec.description }}</div>
                <div 
                  v-if="rec.impact" 
                  class="text-sm text-blue-600 mt-1"
                >
                  Impact: {{ rec.impact }}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { InfoIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChartComponent from '../../../components/ChartComponent.vue';

const props = defineProps({
  currentAge: {
    type: Number,
    required: true
  },
  retirementAge: {
    type: Number,
    required: true
  },
  currentSavings: {
    type: Number,
    required: true
  },
  monthlyContribution: {
    type: Number,
    required: true
  },
  desiredRetirementIncome: {
    type: Number,
    required: true
  },
  projections: {
    type: Object,
    required: true
  }
});

// View options
const views = ['All Scenarios', 'Most Likely', 'Monte Carlo'];
const selectedView = ref('All Scenarios');

// Chart configuration
const chartData = computed(() => {
  switch (selectedView.value) {
    case 'All Scenarios':
      return {
        labels: generateYearLabels(),
        datasets: [
          {
            label: 'Optimistic',
            data: props.projections.optimistic,
            borderColor: 'rgb(16, 185, 129)', // emerald-500
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false
          },
          {
            label: 'Most Likely',
            data: props.projections.mostLikely,
            borderColor: 'rgb(59, 130, 246)', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: false,
            borderWidth: 2
          },
          {
            label: 'Conservative',
            data: props.projections.conservative,
            borderColor: 'rgb(239, 68, 68)', // red-500
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: false
          }
        ]
      };
    case 'Monte Carlo':
      return {
        labels: generateYearLabels(),
        datasets: [
          {
            label: '95th Percentile',
            data: props.projections.monteCarlo.percentile95,
            borderColor: 'rgba(16, 185, 129, 0.5)',
            fill: '+1'
          },
          {
            label: '75th Percentile',
            data: props.projections.monteCarlo.percentile75,
            borderColor: 'rgba(59, 130, 246, 0.5)',
            fill: '+1'
          },
          {
            label: 'Median',
            data: props.projections.monteCarlo.median,
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: '+1'
          },
          {
            label: '25th Percentile',
            data: props.projections.monteCarlo.percentile25,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            fill: '+1'
          },
          {
            label: '5th Percentile',
            data: props.projections.monteCarlo.percentile5,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            fill: false
          }
        ]
      };
    default:
      return {
        labels: generateYearLabels(),
        datasets: [{
          label: 'Most Likely',
          data: props.projections.mostLikely,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }]
      };
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `$${(value / 1000000).toFixed(1)}M`
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

// Computed properties
const successProbability = computed(() => {
  return Math.round(props.projections.monteCarlo.successRate * 100);
});

const projectedAtRetirement = computed(() => {
  const mostLikely = props.projections.mostLikely;
  const retirementIndex = props.retirementAge - props.currentAge;
  return mostLikely[retirementIndex];
});

const monthlyIncomeGoal = computed(() => 
  props.desiredRetirementIncome / 12
);

const savingsGap = computed(() => {
  const required = props.desiredRetirementIncome * 25; // 4% rule
  return projectedAtRetirement.value - required;
});

const scenarios = computed(() => [
  {
    name: 'Conservative',
    probability: 25,
    finalBalance: props.projections.conservative[props.projections.conservative.length - 1],
    monthlyIncome: calculateMonthlyIncome(props.projections.conservative),
    shortfallRisk: 30
  },
  {
    name: 'Most Likely',
    probability: 50,
    finalBalance: props.projections.mostLikely[props.projections.mostLikely.length - 1],
    monthlyIncome: calculateMonthlyIncome(props.projections.mostLikely),
    shortfallRisk: 15
  },
  {
    name: 'Optimistic',
    probability: 25,
    finalBalance: props.projections.optimistic[props.projections.optimistic.length - 1],
    monthlyIncome: calculateMonthlyIncome(props.projections.optimistic),
    shortfallRisk: 5
  }
]);

const recommendations = computed(() => {
  const recs = [];

  if (savingsGap.value < 0) {
    const additionalNeeded = Math.abs(savingsGap.value / (props.retirementAge - props.currentAge) / 12);
    recs.push({
      title: 'Increase Monthly Savings',
      description: 'Consider increasing your monthly contributions to meet your retirement goal.',
      impact: `Additional $${formatNumber(additionalNeeded)} per month recommended`
    });
  }

  if (successProbability.value < 80) {
    recs.push({
      title: 'Diversify Investment Strategy',
      description: 'Your current success probability suggests reviewing your investment allocation.',
      impact: 'Could improve success probability by 10-15%'
    });
  }

  if (props.monthlyContribution / props.desiredRetirementIncome < 0.15) {
    recs.push({
      title: 'Review Savings Rate',
      description: 'Your current savings rate might be too low for your retirement goals.',
      impact: 'Aim for 15-20% of desired retirement income'
    });
  }

  return recs;
});

// Computed classes
const getSuccessProbabilityColor = computed(() => {
  if (successProbability.value >= 80) return 'text-green-500';
  if (successProbability.value >= 60) return 'text-yellow-500';
  return 'text-red-500';
});

// Helper functions
function formatNumber(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function generateYearLabels() {
  const years = props.retirementAge - props.currentAge + 30; // Include 30 years post-retirement
  return Array.from({ length: years }, (_, i) => props.currentAge + i);
}

function calculateMonthlyIncome(projection) {
  return (projection[projection.length - 1] * 0.04) / 12; // 4% rule
}

function getScenarioClass(probability) {
  if (probability >= 50) return 'bg-blue-100 text-blue-800';
  if (probability >= 25) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}
</script>
