<template>
  <div class="module-form">
    <h2>{{ module.getName() }}</h2>
    <p>{{ module.getDescription() }}</p>
    <form @submit.prevent="submitForm">
      <div v-for="field in module.getInputFields()" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        
        <input v-if="field.type === 'text' || field.type === 'number'"
               :id="field.name" 
               :type="field.type" 
               v-model="formData[field.name]"
               :min="field.min"
               :max="field.max"
               :step="field.step"
               required>
        
        <div v-else-if="field.type === 'budgetAllocation'">
          <div v-for="category in field.categories" :key="category" class="budget-category">
            <label>{{ category }}</label>
            <input 
              type="number" 
              v-model="formData[field.name][category]"
              min="0"
              max="100"
              step="0.1"
            >
          </div>
          <div class="total">Total: {{ getTotalAllocation(field.name) }}%</div>
        </div>

        <div v-else-if="field.type === 'nestedCategoryValues'">
          <div v-for="(subcategories, maincategory) in field.categories" :key="maincategory" class="main-category">
            <h4>{{ maincategory }}</h4>
            <div v-for="subcategory in subcategories" :key="subcategory" class="subcategory-input">
              <label>{{ subcategory }}</label>
              <input 
                type="number" 
                v-model="formData[field.name][maincategory][subcategory]"
                min="0"
                step="0.01"
              >
            </div>
          </div>
        </div>
        
      </div>
      <button type="submit">Optimize</button>
    </form>
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
      formData: {}
    };
  },
  methods: {
    ...mapActions(['saveModuleData']),
    submitForm() {
      try {
        this.module.validateInput(this.formData);
        this.$emit('submit', this.formData);
      } catch (error) {
        alert(error.message);
      }
    },
    getTotalAllocation(fieldName) {
      return Object.values(this.formData[fieldName] || {}).reduce((sum, value) => sum + Number(value), 0).toFixed(1);
    },
    initializeFormData() {
      this.module.getInputFields().forEach(field => {
        if (field.type === 'budgetAllocation') {
          this.formData[field.name] = {};
          field.categories.forEach(category => {
            this.formData[field.name][category] = 0;
          });
        } else if (field.type === 'nestedCategoryValues') {
          this.formData[field.name] = {};
          Object.keys(field.categories).forEach(maincategory => {
            this.formData[field.name][maincategory] = {};
            field.categories[maincategory].forEach(subcategory => {
              this.formData[field.name][maincategory][subcategory] = 0;
            });
          });
        } else {
          this.formData[field.name] = '';
        }
      });
    }
  },
  created() {
    this.initializeFormData();
  }
};
</script>

<style scoped>
.module-form {
  max-width: 600px;
  margin: 0 auto;
}

.budget-category, .subcategory-input {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.budget-category input, .subcategory-input input {
  width: 100px;
}

.total {
  font-weight: bold;
  margin-top: 10px;
}

.main-category {
  margin-top: 20px;
}
</style>
