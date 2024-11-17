<template>
  <div class="savings-goal-progress">
    <Card>
      <CardHeader>
        <CardTitle>Savings Goals Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <div v-for="(goal, index) in goals" :key="index" class="goal-item">
            <div class="flex justify-between mb-2">
              <span class="font-medium">{{ goal.name }}</span>
              <span class="text-sm">
                ${{ formatNumber(goal.current) }} / ${{ formatNumber(goal.target) }}
              </span>
            </div>
            
            <div class="relative">
              <!-- Background bar -->
              <div class="h-4 bg-gray-200 rounded-full">
                <!-- Progress bar -->
                <div 
                  class="h-full rounded-full transition-all duration-500 ease-in-out"
                  :class="getProgressColorClass(goal.progress)"
                  :style="{ width: `${Math.min(goal.progress * 100, 100)}%` }"
                />
              </div>
              
              <!-- Percentage label -->
              <div class="absolute -top-1 text-xs">
                {{ (goal.progress * 100).toFixed(1) }}%
              </div>
            </div>

            <!-- Estimated completion -->
            <div class="mt-1 text-sm text-gray-600">
              {{ getEstimatedCompletion(goal) }}
            </div>
          </div>
        </div>

        <!-- Summary section -->
        <div v-if="goals.length > 0" class="mt-6 pt-4 border-t">
          <div class="text-sm text-gray-600">
            <div class="flex justify-between mb-2">
              <span>Total Progress:</span>
              <span>{{ (averageProgress * 100).toFixed(1) }}%</span>
            </div>
            <div class="flex justify-between">
              <span>Monthly Savings Required:</span>
              <span>${{ formatNumber(totalMonthlySavingsNeeded) }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const props = defineProps({
  goals: {
    type: Array,
    required: true,
    validator: (goals) => goals.every(goal => 
      typeof goal.name === 'string' &&
      typeof goal.target === 'number' &&
      typeof goal.current === 'number' &&
      typeof goal.monthlyContribution === 'number'
    )
  },
  monthlyIncome: {
    type: Number,
    required: true
  }
});

// Computed properties
const averageProgress = computed(() => {
  if (props.goals.length === 0) return 0;
  return props.goals.reduce((sum, goal) => sum + goal.progress, 0) / props.goals.length;
});

const totalMonthlySavingsNeeded = computed(() => {
  return props.goals.reduce((sum, goal) => {
    const remaining = goal.target - goal.current;
    if (remaining <= 0) return sum;
    // Assume 2 years as default timeframe if not specified
    const months = goal.timeframe || 24;
    return sum + (remaining / months);
  }, 0);
});

// Helper methods
const formatNumber = (value) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getProgressColorClass = (progress) => {
  if (progress >= 0.8) return 'bg-green-500';
  if (progress >= 0.5) return 'bg-blue-500';
  if (progress >= 0.3) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getEstimatedCompletion = (goal) => {
  if (goal.progress >= 1) return 'Goal achieved! 🎉';
  if (goal.monthlyContribution <= 0) return 'No monthly contribution set';

  const remaining = goal.target - goal.current;
  const monthsToComplete = remaining / goal.monthlyContribution;

  if (monthsToComplete > 60) {
    return `Estimated completion in ${Math.ceil(monthsToComplete / 12)} years`;
  } else {
    return `Estimated completion in ${Math.ceil(monthsToComplete)} months`;
  }
};
</script>

<style scoped>
.goal-item {
  position: relative;
  padding: 0.5rem 0;
}

.progress-bar {
  transition: width 0.5s ease-in-out;
}
</style>
