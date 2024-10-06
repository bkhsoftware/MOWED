import ResultsDisplay from './ResultsDisplay.vue';

<template>
  <div class="module-form">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="solveOptimization">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        
        <input v-if="field.type === 'text' || field.type === 'number'"
               :id="field.name" 
               :type="field.type" 
               v-model="formData[field.name]"
               :min="field.type === 'number' ? 0 : undefined"
               required>
        
        <input v-else-if="field.type === 'date'"
               :id="field.name"
               type="date"
               v-model="formData[field.name]"
               required>

        <select v-else-if="field.type === 'select'"
                :id="field.name"
                v-model="formData[field.name]"
                required>
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>        

        <div v-else-if="field.type === 'array'">
          <input 
            v-for="(item, index) in formData[field.name]"
            :key="index"
            v-model="formData[field.name][index]"
            :placeholder="`${field.label} ${index + 1}`"
          >
          <button @click.prevent="addArrayItem(field.name)">Add {{ field.label }}</button>
        </div>
        
        <div v-else-if="field.type === 'object'">
          <div v-for="(subField, subFieldName) in field.fields" :key="subFieldName">
            <label :for="`${field.name}.${subFieldName}`">{{ subField.label }}</label>
            <input :id="`${field.name}.${subFieldName}`"
                   :type="subField.type"
                   v-model="formData[field.name][subFieldName]"
                   required>
          </div>
        </div>
      </div>
      <button type="submit">Optimize</button>
    </form>
    <ResultsDisplay v-if="result" :result="result" />
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'ModuleForm',
  components: {
    ResultsDisplay
  },
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
    submitForm() {
      try {
        this.module.validateInput(this.formData);
        this.$emit('submit', this.formData);
      } catch (error) {
        alert(error.message);
      }
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
      if (field.type === 'array') {
        this.$set(this.formData, field.name, []);
      } else if (field.type === 'object') {
        this.$set(this.formData, field.name, {});
        Object.keys(field.fields).forEach(subFieldName => {
          this.$set(this.formData[field.name], subFieldName, '');
        });
      } else if (field.type === 'date') {
        this.$set(this.formData, field.name, new Date().toISOString().split('T')[0]);
      } else {
        this.$set(this.formData, field.name, '');
      }
    });
  }
};
</script>
