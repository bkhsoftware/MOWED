<template>
  <div class="module-form">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input 
          v-if="field.type !== 'array'"
          :id="field.name" 
          :type="field.type" 
          v-model="formData[field.name]"
          :min="0"
          required
        >
        <div v-else>
          <input 
            v-for="(item, index) in formData[field.name]"
            :key="index"
            v-model="formData[field.name][index]"
            :placeholder="`${field.label} ${index + 1}`"
          >
          <button @click.prevent="addArrayItem(field.name)">Add {{ field.label }}</button>
        </div>
      </div>
      <button type="submit">Optimize</button>
    </form>
    <div v-if="result" class="result">
      <h3>Result:</h3>
      <p>{{ result.message }}</p>
      <ul>
        <li v-for="(value, key) in result" :key="key" v-if="key !== 'message'">
          {{ key }}: {{ value }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'ModuleForm',
  props: {
    module: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      formData: {},
      result: null
    };
  },
  methods: {
    ...mapActions(['saveModuleData']),
    solveOptimization() {
      this.result = this.module.solve(this.formData);
      this.saveModuleData({
        moduleName: this.module.getName(),
        data: { formData: this.formData, result: this.result }
      });
    },
    addArrayItem(fieldName) {
      if (!this.formData[fieldName]) {
        this.$set(this.formData, fieldName, []);
      }
      this.formData[fieldName].push('');
    }
  },
  created() {
    this.module.getInputFields().forEach(field => {
      this.$set(this.formData, field.name, field.type === 'array' ? [] : '');
    });
  }
};
</script>
