<template>
  <div class="chart-container">
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { defineComponent, onMounted, watch, toRefs } from 'vue';

Chart.register(...registerables);

export default defineComponent({
  name: 'ChartComponent',
  props: {
    type: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const { type, data, options } = toRefs(props);
    let chart = null;

    const createChart = () => {
      const ctx = document.getElementById('chart');
      chart = new Chart(ctx, {
        type: type.value,
        data: data.value,
        options: options.value
      });
    };

    const updateChart = () => {
      if (chart) {
        chart.data = data.value;
        chart.options = options.value;
        chart.update();
      }
    };

    onMounted(() => {
      createChart();
    });

    watch([data, options], () => {
      updateChart();
    });

    return {};
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>
