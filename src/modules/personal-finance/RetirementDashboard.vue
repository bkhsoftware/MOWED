<template>
  <div class="retirement-dashboard">
    <h3>Retirement Planning Dashboard</h3>
    <div class="dashboard-grid">
      <div class="dashboard-item">
        <h4>Years Until Retirement</h4>
        <p>{{ retirementProjection.yearsUntilRetirement }}</p>
      </div>
      <div class="dashboard-item">
        <h4>Expected Years in Retirement</h4>
        <p>{{ retirementProjection.yearsInRetirement }}</p>
      </div>
      <div class="dashboard-item">
        <h4>Projected Savings at Retirement</h4>
        <p>${{ formatCurrency(retirementProjection.retirementSavingsAtRetirement) }}</p>
      </div>
      <div class="dashboard-item">
        <h4>Projected Monthly Retirement Income</h4>
        <p>${{ formatCurrency(retirementProjection.monthlyRetirementIncome) }}</p>
      </div>
      <div class="dashboard-item">
        <h4>Desired Monthly Retirement Income</h4>
        <p>${{ formatCurrency(retirementProjection.desiredMonthlyRetirementIncome) }}</p>
      </div>
      <div class="dashboard-item" :class="{ 'income-gap': retirementProjection.retirementIncomeGap > 0 }">
        <h4>Monthly Income Gap</h4>
        <p>${{ formatCurrency(Math.abs(retirementProjection.retirementIncomeGap)) }}</p>
      </div>
    </div>
    <div class="retirement-chart">
      <ChartComponent
        :type="'bar'"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script>
import ChartComponent from '../../components/ChartComponent.vue';

export default {
  name: 'RetirementDashboard',
  components: {
    ChartComponent
  },
  props: {
    retirementProjection: {
      type: Object,
      required: true
    }
  },
  computed: {
    chartData() {
      return {
        labels: ['Projected Income', 'Desired Income'],
        datasets: [{
          label: 'Monthly Retirement Income',
          data: [
            this.retirementProjection.monthlyRetirementIncome,
            this.retirementProjection.desiredMonthlyRetirementIncome
          ],
          backgroundColor: ['#4CAF50', '#2196F3']
        }]
      };
    },
    chartOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Monthly Income ($)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (context) => {
                const index = context[0].dataIndex;
                const label = index === 0 ? 'Projected' : 'Desired';
                return `This ${label} income is calculated based on
                        ${this.retirementProjection.yearsInRetirement} years in retirement.`;
              }
            }
          }
        }
      };
    }
  },
  methods: {
    formatCurrency(value) {
      return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
  }
};
</script>

<style scoped>
.retirement-dashboard {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-item h4 {
  margin-bottom: 10px;
  color: #333;
}

.dashboard-item p {
  font-size: 1.2em;
  font-weight: bold;
  color: #4CAF50;
}

.income-gap p {
  color: #f44336;
}

.retirement-chart {
  height: 300px;
  margin-top: 20px;
}
</style>
