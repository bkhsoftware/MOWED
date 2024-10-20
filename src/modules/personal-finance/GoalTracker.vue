<template>
  <div class="goal-tracker">
    <h3>Financial Goals Progress</h3>
    <p>Monthly Income Growth Rate: {{ incomeGrowthRate }}%</p>
    <div v-for="goal in goals" :key="goal.name" class="goal-progress">
      <h4>{{ goal.name }}</h4>
      <p>Type: {{ formatGoalType(goal.type) }}</p>
      <p>Target: ${{ goal.target.toFixed(2) }}</p>
      <p>Progress: {{ (goal.progress * 100).toFixed(2) }}%</p>
      <p>Estimated time to goal: {{ formatTime(goal.timeToGoal) }}</p>
      <progress :value="goal.progress" max="1"></progress>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoalTracker',
  props: {
    goals: {
      type: Array,
      required: true
    },
    incomeGrowthRate: {
      type: Number,
      required: true
    }
  },
  methods: {
    formatGoalType(type) {
      switch (type) {
        case 'savings': return 'Savings';
        case 'debt_reduction': return 'Debt Reduction';
        case 'income': return 'Income';
        default: return type;
      }
    },
    formatTime(months) {
      const years = Math.floor(months / 12);
      const remainingMonths = Math.round(months % 12);
      if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  }
}
</script>

<style scoped>
.goal-tracker {
  margin-top: 20px;
}
.goal-progress {
  margin-bottom: 20px;
}
progress {
  width: 100%;
}
</style>
