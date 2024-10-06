<template>
  <div class="results-display">
    <h3>Result:</h3>
    <p v-if="result.message">{{ result.message }}</p>
    <ul>
      <li v-for="(value, key) in result" :key="key" v-if="key !== 'message'">
        {{ key }}: {{ formatValue(value) }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ResultsDisplay',
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatValue(value) {
      if (typeof value === 'number') {
        return value.toFixed(2);
      } else if (value instanceof Date) {
        return value.toLocaleDateString();
      } else if (Array.isArray(value)) {
        return value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    }
  }
}
</script>
