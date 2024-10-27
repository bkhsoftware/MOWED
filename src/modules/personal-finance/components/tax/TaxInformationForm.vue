// components/tax/TaxInformationForm.vue
<template>
  <div class="tax-information-form">
    <section v-for="section in formSections" :key="section.name" class="form-section">
      <h3 class="section-title">{{ section.label }}</h3>
      
      <div class="section-content">
        <!-- Basic Fields -->
        <template v-for="field in section.fields" :key="field.name">
          <!-- Select Fields -->
          <div v-if="field.type === 'select'" class="form-group">
            <label :for="field.name">{{ field.label }}</label>
            <select 
              :id="field.name"
              v-model="formData[field.name]"
              :required="field.required"
              class="form-select"
            >
              <option value="" disabled>Select {{ field.label }}</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>

          <!-- Number Fields -->
          <div v-else-if="field.type === 'number'" class="form-group">
            <label :for="field.name">{{ field.label }}</label>
            <input
              :id="field.name"
              type="number"
              v-model.number="formData[field.name]"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              class="form-input"
            >
          </div>

          <!-- Boolean Fields -->
          <div v-else-if="field.type === 'boolean'" class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData[field.name]"
                class="form-checkbox"
              >
              {{ field.label }}
            </label>
          </div>

          <!-- Account Details Fields -->
          <div v-else-if="field.type === 'accountDetails'" class="account-details">
            <h4 class="subsection-title">{{ field.label }}</h4>
            <div class="account-fields">
              <div v-for="subField in field.fields" :key="subField.name" class="form-group">
                <label :for="`${field.name}_${subField.name}`">
                  {{ subField.label }}
                </label>
                <input
                  :id="`${field.name}_${subField.name}`"
                  :type="subField.type"
                  v-model.number="formData[field.name][subField.name]"
                  :min="subField.min"
                  :max="subField.max"
                  :step="subField.step"
                  class="form-input"
                >
              </div>
            </div>
          </div>

          <!-- Nested Income Fields -->
          <div v-else-if="field.type === 'nestedIncome'" class="nested-income">
            <h4 class="subsection-title">{{ field.label }}</h4>
            <div v-for="(subcategories, category) in field.categories" 
                 :key="category" 
                 class="income-category">
              <h5 class="category-title">{{ category }}</h5>
              <div v-for="subcategory in subcategories" 
                   :key="subcategory" 
                   class="form-group">
                <label :for="`${field.name}_${category}_${subcategory}`">
                  {{ subcategory }}
                </label>
                <input
                  :id="`${field.name}_${category}_${subcategory}`"
                  type="number"
                  v-model.number="formData[field.name][category][subcategory]"
                  min="0"
                  step="100"
                  class="form-input"
                >
              </div>
            </div>
          </div>

          <!-- Deduction Details Fields -->
          <div v-else-if="field.type === 'deductionDetails'" class="deduction-details">
            <h4 class="subsection-title">{{ field.label }}</h4>
            <div class="deduction-fields">
              <div class="form-group">
                <label :for="`${field.name}_amount`">Amount</label>
                <input
                  :id="`${field.name}_amount`"
                  type="number"
                  v-model.number="formData[field.name].amount"
                  min="0"
                  step="100"
                  class="form-input"
                >
              </div>
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="formData[field.name].recurring"
                    class="form-checkbox"
                  >
                  Recurring Annually
                </label>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'TaxInformationForm',
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    },
    sections: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      formData: this.initializeFormData()
    };
  },
  computed: {
    formSections() {
      return this.sections.filter(section => section.type === 'section');
    }
  },
  methods: {
    initializeFormData() {
      const data = { ...this.initialData };
      
      // Initialize nested structures
      this.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.type === 'accountDetails' && !data[field.name]) {
            data[field.name] = {
              currentBalance: 0,
              annualContribution: 0,
              employerMatch: 0
            };
          } else if (field.type === 'nestedIncome' && !data[field.name]) {
            data[field.name] = {};
            Object.entries(field.categories).forEach(([category, subcategories]) => {
              data[field.name][category] = {};
              subcategories.forEach(subcategory => {
                data[field.name][category][subcategory] = 0;
              });
            });
          } else if (field.type === 'deductionDetails' && !data[field.name]) {
            data[field.name] = {
              amount: 0,
              recurring: false
            };
          } else if (!data[field.name]) {
            data[field.name] = field.type === 'boolean' ? false : '';
          }
        });
      });
      
      return data;
    }
  },
  watch: {
    formData: {
      deep: true,
      handler(newData) {
        this.$emit('update:modelValue', newData);
      }
    }
  }
};
</script>

<style scoped>
.tax-information-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.subsection-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #4a5568;
  margin: 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.form-checkbox {
  margin-right: 0.5rem;
}

.account-details,
.nested-income,
.deduction-details {
  background-color: #f7fafc;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.account-fields,
.income-category,
.deduction-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.category-title {
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
  margin: 0.5rem 0;
  grid-column: 1 / -1;
}

@media (max-width: 640px) {
  .account-fields,
  .income-category,
  .deduction-fields {
    grid-template-columns: 1fr;
  }
}
</style>
