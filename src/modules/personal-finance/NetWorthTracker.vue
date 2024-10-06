<template>
  <div class="net-worth-tracker">
    <h2>Net Worth Tracker</h2>
    <div class="net-worth-summary">
      <div class="summary-item">
        <h3>Total Assets</h3>
        <p>${{ totalAssets.toFixed(2) }}</p>
      </div>
      <div class="summary-item">
        <h3>Total Liabilities</h3>
        <p>${{ totalLiabilities.toFixed(2) }}</p>
      </div>
      <div class="summary-item net-worth">
        <h3>Net Worth</h3>
        <p>${{ netWorth.toFixed(2) }}</p>
      </div>
    </div>
    <div class="net-worth-details">
      <div class="assets">
        <h3>Assets</h3>
        <ul>
          <li v-for="(value, category) in assets" :key="category">
            {{ category }}: ${{ value.toFixed(2) }}
          </li>
        </ul>
      </div>
      <div class="liabilities">
        <h3>Liabilities</h3>
        <ul>
          <li v-for="(value, category) in liabilities" :key="category">
            {{ category }}: ${{ value.toFixed(2) }}
          </li>
        </ul>
      </div>
    </div>
    <ChartComponent
      v-if="chartData"
      :type="chartType"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script>
import ChartComponent from '../ChartComponent.vue';

export default {
  name: 'NetWorthTracker',
  components: {
    ChartComponent
  },
  props: {
    assets: {
      type: Object,
      required: true
    },
    liabilities: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chartType: 'bar',
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  },
  computed: {
    totalAssets() {
      return Object.values(this.assets).reduce((sum, value) => sum + value, 0);
    },
    totalLiabilities() {
      return Object.values(this.liabilities).reduce((sum, value) => sum + value, 0);
    },
    netWorth() {
      return this.totalAssets - this.totalLiabilities;
    }
  },
  methods: {
    updateChartData() {
      this.chartData = {
        labels: ['Assets', 'Liabilities', 'Net Worth'],
        datasets: [{
          label: 'Financial Overview',
          data: [this.totalAssets, this.totalLiabilities, this.netWorth],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }]
      };
    }
  },
  watch: {
    assets: {
      handler() {
        this.updateChartData();
      },
      deep: true
    },
    liabilities: {
      handler() {
        this.updateChartData();
      },
      deep: true
    }
  },
  mounted() {
    this.updateChartData();
  }
};
</script>

<style scoped>
.net-worth-tracker {
  max-width: 800px;
  margin: 0 auto;
}

.net-worth-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
  flex: 1;
}

.net-worth {
  font-weight: bold;
}

.net-worth-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.assets, .liabilities {
  flex: 1;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 5px;
}
</style>
