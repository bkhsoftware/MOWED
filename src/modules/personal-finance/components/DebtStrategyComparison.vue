<template>
  <div class="debt-strategy-comparison">
    <Card>
      <CardHeader>
        <CardTitle>Debt Repayment Strategy Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Strategy Selection -->
        <div class="mb-6 flex gap-4">
          <button
            v-for="strategy in strategies"
            :key="strategy.id"
            @click="selectedStrategy = strategy.id"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedStrategy === strategy.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
          >
            {{ strategy.name }}
          </button>
        </div>

        <!-- Comparison Chart -->
        <div class="h-[300px] mb-6">
          <ChartComponent
            type="line"
            :data="comparisonChartData"
            :options="comparisonChartOptions"
          />
        </div>

        <!-- Strategy Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div v-for="strategy in strategies" :key="strategy.id" class="p-4 rounded-lg bg-gray-50">
            <h4 class="font-medium mb-2">{{ strategy.name }}</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Time to Debt-Free:</span>
                <span>{{ formatMonths(strategy.timeToDebtFree) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Interest:</span>
                <span>${{ formatNumber(strategy.totalInterest) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Interest Saved:</span>
                <span :class="strategy.interestSaved > 0 ? 'text-green-600' : ''">
                  {{ strategy.interestSaved > 0 ? '+' : '' }}${{ formatNumber(strategy.interestSaved) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Schedule -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left p-3">Debt</th>
                <th class="text-right p-3">Balance</th>
                <th class="text-right p-3">Interest Rate</th>
                <th class="text-right p-3">Monthly Payment</th>
                <th class="text-right p-3">Time to Pay Off</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr 
                v-for="debt in selectedStrategyDetails.paymentSchedule" 
                :key="debt.name"
                class="hover:bg-gray-50"
              >
                <td class="p-3">
                  <div class="font-medium">{{ debt.name }}</div>
                  <div class="text-sm text-gray-500">{{ debt.type }}</div>
                </td>
                <td class="p-3 text-right">${{ formatNumber(debt.balance) }}</td>
                <td class="p-3 text-right">{{ (debt.interestRate * 100).toFixed(1) }}%</td>
                <td class="p-3 text-right">${{ formatNumber(debt.monthlyPayment) }}</td>
                <td class="p-3 text-right">{{ formatMonths(debt.monthsToPayoff) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 font-medium">
              <tr>
                <td class="p-3">Total</td>
                <td class="p-3 text-right">
                  ${{ formatNumber(selectedStrategyDetails.totalDebt) }}
                </td>
                <td class="p-3 text-right">
                  {{ (selectedStrategyDetails.avgInterestRate * 100).toFixed(1) }}%
                </td>
                <td class="p-3 text-right">
                  ${{ formatNumber(selectedStrategyDetails.totalMonthlyPayment) }}
                </td>
                <td class="p-3 text-right">
                  {{ formatMonths(selectedStrategyDetails.timeToDebtFree) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Strategy Description -->
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 class="font-medium mb-2">{{ selectedStrategyDetails.name }}</h4>
          <p class="text-sm text-gray-600 mb-2">{{ selectedStrategyDetails.description }}</p>
          <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li v-for="(point, index) in selectedStrategyDetails.keyPoints" :key="index">
              {{ point }}
            </li>
          </ul>
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
  debts: {
    type: Array,
    required: true,
    validator: (debts) => debts.every(debt => 
      typeof debt.name === 'string' &&
      typeof debt.balance === 'number' &&
      typeof debt.interestRate === 'number' &&
      typeof debt.minimumPayment === 'number'
    )
  },
  monthlyPaymentCapacity: {
    type: Number,
    required: true
  }
});

const selectedStrategy = ref('avalanche');

const strategies = [
  {
    id: 'avalanche',
    name: 'Debt Avalanche',
    description: 'Prioritizes debts with the highest interest rates first while making minimum payments on all other debts.',
    keyPoints: [
      'Mathematically optimal - minimizes total interest paid',
      'Best for those focused on minimizing cost',
      'Requires discipline to stick to the plan'
    ]
  },
  {
    id: 'snowball',
    name: 'Debt Snowball',
    description: 'Prioritizes paying off smaller debts first while making minimum payments on larger ones.',
    keyPoints: [
      'Provides psychological wins through early successes',
      'Builds momentum and motivation',
      'Good for those who need to see progress quickly'
    ]
  },
  {
    id: 'hybrid',
    name: 'Hybrid Approach',
    description: 'Balances interest rates and balances to optimize both financial and psychological benefits.',
    keyPoints: [
      'Combines benefits of both avalanche and snowball methods',
      'Adapts to your specific debt situation',
      'Good balance of cost savings and motivation'
    ]
  }
].map(strategy => ({
  ...strategy,
  ...calculateStrategyMetrics(props.debts, strategy.id, props.monthlyPaymentCapacity)
}));

const selectedStrategyDetails = computed(() => 
  strategies.find(s => s.id === selectedStrategy.value)
);

const comparisonChartData = computed(() => ({
  labels: generateMonthLabels(getMaxPayoffMonths()),
  datasets: strategies.map(strategy => ({
    label: strategy.name,
    data: generateDebtProjection(props.debts, strategy.id, props.monthlyPaymentCapacity),
    borderColor: getStrategyColor(strategy.id),
    backgroundColor: getStrategyColor(strategy.id, 0.1),
    fill: true,
    tension: 0.4
  }))
}));

const comparisonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `$${value.toLocaleString()}`
      }
    }
  }
};

// Helper functions
function calculateStrategyMetrics(debts, strategyId, monthlyCapacity) {
  // Simulate debt payoff based on strategy
  const schedule = generatePaymentSchedule(debts, strategyId, monthlyCapacity);
  const baselineInterest = calculateBaselineInterest(debts);
  const totalInterest = calculateTotalInterest(schedule);
  
  return {
    timeToDebtFree: calculateTimeToDebtFree(schedule),
    totalInterest,
    interestSaved: baselineInterest - totalInterest,
    paymentSchedule: schedule,
    totalDebt: debts.reduce((sum, debt) => sum + debt.balance, 0),
    totalMonthlyPayment: monthlyCapacity,
    avgInterestRate: calculateAverageInterestRate(debts)
  };
}

function generatePaymentSchedule(debts, strategyId, monthlyCapacity) {
  let remainingDebts = [...debts];
  
  // Sort debts based on strategy
  if (strategyId === 'avalanche') {
    remainingDebts.sort((a, b) => b.interestRate - a.interestRate);
  } else if (strategyId === 'snowball') {
    remainingDebts.sort((a, b) => a.balance - b.balance);
  } else {
    // Hybrid strategy - balance both factors
    remainingDebts.sort((a, b) => 
      (b.interestRate * b.balance) - (a.interestRate * a.balance)
    );
  }

  return remainingDebts.map(debt => ({
    ...debt,
    monthlyPayment: calculateMonthlyPayment(debt, monthlyCapacity),
    monthsToPayoff: calculateMonthsToPayoff(debt, monthlyCapacity)
  }));
}

function calculateMonthlyPayment(debt, monthlyCapacity) {
  return debt.minimumPayment;
}

function calculateMonthsToPayoff(debt, monthlyPayment) {
  const monthlyRate = debt.interestRate / 12;
  return Math.ceil(
    Math.log(monthlyPayment / (monthlyPayment - monthlyRate * debt.balance)) /
    Math.log(1 + monthlyRate)
  );
}

function generateDebtProjection(debts, strategyId, monthlyCapacity) {
  const months = getMaxPayoffMonths();
  const projection = [];
  let remainingBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  
  for (let month = 0; month <= months; month++) {
    const payment = calculateMonthlyReduction(
      remainingBalance,
      monthlyCapacity,
      debts,
      strategyId
    );
    remainingBalance = Math.max(0, remainingBalance - payment);
    projection.push(remainingBalance);
  }
  
  return projection;
}

function getStrategyColor(strategyId, alpha = 1) {
  const colors = {
    avalanche: `rgba(59, 130, 246, ${alpha})`, // blue
    snowball: `rgba(16, 185, 129, ${alpha})`,  // green
    hybrid: `rgba(168, 85, 247, ${alpha})`     // purple
  };
  return colors[strategyId];
}

function formatNumber(value) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMonths(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} months`;
  return `${years}y ${remainingMonths}m`;
}

function generateMonthLabels(monthCount) {
  return Array.from({ length: monthCount + 1 }, (_, i) => 
    i === 0 ? 'Start' : `Month ${i}`
  );
}

function getMaxPayoffMonths() {
  return Math.max(...strategies.map(s => s.timeToDebtFree));
}

function calculateBaselineInterest(debts) {
  return debts.reduce((sum, debt) => 
    sum + (debt.balance * debt.interestRate * 5), 0); // 5-year baseline
}

function calculateTotalInterest(schedule) {
  return schedule.reduce((sum, debt) => 
    sum + (debt.balance * debt.interestRate * (debt.monthsToPayoff / 12)), 0);
}

function calculateAverageInterestRate(debts) {
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  return debts.reduce((sum, debt) => 
    sum + (debt.interestRate * (debt.balance / totalBalance)), 0);
}
</script>

<style scoped>
.debt-strategy-comparison {
  @apply space-y-6;
}
</style>
