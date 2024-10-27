<template>
  <div class="module-form">
    <h2>{{ module.getName() }}</h2>
    <p class="module-description">{{ module.getDescription() }}</p>
    <form @submit.prevent="submitForm">
      <div v-for="field in module.getInputFields()" :key="field.name" class="form-section">
        <h3 class="section-header">{{ field.label }}</h3>
        
        <div v-if="field.type === 'text' || field.type === 'number'" class="input-group">
          <label :for="field.name">{{ field.label }}</label>
          <input 
            :id="field.name" 
            :type="field.type" 
            v-model.number="formData[field.name]"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            required
          >
        </div>
        
        <div v-else-if="field.type === 'budgetAllocation'" class="budget-allocation">
          <div v-for="category in field.categories" :key="category" class="budget-category">
            <label>{{ category }}</label>
            <input 
              type="number" 
              v-model.number="formData[field.name][category]"
              min="0"
              max="100"
              step="0.1"
            >
          </div>
          <div class="total">Total: {{ getTotalAllocation(field.name) }}%</div>
        </div>

        <div v-else-if="field.type === 'nestedCategoryValues'" class="nested-categories">
          <div v-for="(subcategories, maincategory) in field.categories" :key="maincategory" class="main-category">
            <h4>{{ maincategory }}</h4>
            <div v-for="subcategory in subcategories" :key="subcategory" class="subcategory-input">
              <label>{{ subcategory }}</label>
              <input 
                type="number" 
                v-model.number="formData[field.name][maincategory][subcategory]"
                min="0"
                step="0.01"
              >
            </div>
          </div>
        </div>

        <div v-else-if="field.type === 'goals'" class="goals-section">
          <div v-for="(goal, index) in formData[field.name]" :key="index" class="goal-input">
            <input v-model="goal.name" placeholder="Goal Name">
            <select v-model="goal.type">
              <option value="savings">Savings</option>
              <option value="debt_reduction">Debt Reduction</option>
              <option value="income">Income</option>
            </select>
            <input v-model.number="goal.target" type="number" placeholder="Target Amount">
            <button @click.prevent="removeGoal(index)" class="remove-goal">Remove</button>
          </div>
          <button @click.prevent="addGoal" class="add-goal">Add Goal</button>
        </div>
        
      </div>
      <button type="submit" class="optimize-button">Optimize</button>
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
    },
    initialValues: {
      type: Object,
      default: () => ({})
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
        console.debug('Form validation message:', error.message);
      }
    },
    getTotalAllocation(fieldName) {
      return Object.values(this.formData[fieldName] || {}).reduce((sum, value) => sum + Number(value), 0).toFixed(1);
    },
    addGoal() {
      if (!this.formData.goals) {
        this.formData.goals = [];
      }
      this.formData.goals.push({ name: '', type: 'savings', target: 0 });
    },
    removeGoal(index) {
      this.formData.goals.splice(index, 1);
    },
    initializeFormData() {
      // Start with empty form structure
      this.formData = {};
      
      this.module.getInputFields().forEach(field => {
        if (field.type === 'budgetAllocation') {
          this.formData[field.name] = {};
          field.categories.forEach(category => {
            this.formData[field.name][category] = this.initialValues[field.name]?.[category] || 0;
          });
        } else if (field.type === 'nestedCategoryValues') {
          this.formData[field.name] = {};
          Object.keys(field.categories).forEach(maincategory => {
            this.formData[field.name][maincategory] = {};
            field.categories[maincategory].forEach(subcategory => {
              this.formData[field.name][maincategory][subcategory] = 
                this.initialValues[field.name]?.[maincategory]?.[subcategory] || 0;
            });
          });
        } else if (field.type === 'goals') {
          this.formData[field.name] = this.initialValues[field.name] || [];
        } else if (field.type === 'number') {
          this.formData[field.name] = this.initialValues[field.name] ?? (field.min || 0);
        } else {
          this.formData[field.name] = this.initialValues[field.name] || '';
        }
      });
    }
  },
  watch: {
    initialValues: {
      handler(newValues) {
        if (Object.keys(newValues).length > 0) {
          this.initializeFormData();
        }
      },
      deep: true
    }
  },
  created() {
    this.initializeFormData();
  }
};
</script>

<style scoped>
.module-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.module-description {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  margin-bottom: 15px;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.input-group label {
  margin-bottom: 5px;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.budget-allocation, .nested-categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.budget-category, .subcategory-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-category input, .subcategory-input input {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.total {
  grid-column: 1 / -1;
  font-weight: bold;
  margin-top: 10px;
}

.main-category h4 {
  margin-bottom: 10px;
  color: #555;
}

.goals-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.goal-input input, .goal-input select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.remove-goal, .add-goal {
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-goal:hover, .add-goal:hover {
  background-color: #e0e0e0;
}

.optimize-button {
  display: block;
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
}

.optimize-button:hover {
  background-color: #45a049;
}
</style>
