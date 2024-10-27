// components/tax/NestedIncomeInput.vue
<template>
  <div class="nested-income-input">
    <div v-for="(subcategories, category) in categories" 
         :key="category" 
         class="income-category">
      <h4 class="category-title">{{ category }}</h4>
      <div class="subcategories">
        <div v-for="subcategory in subcategories" 
             :key="subcategory" 
             class="subcategory-input">
          <label :for="`${id}_${category}_${subcategory}`">
            {{ subcategory }}
          </label>
          <div class="input-with-currency">
            <span class="currency-symbol">$</span>
            <input
              :id="`${id}_${category}_${subcategory}`"
              type="number"
              v-model.number="localValue[category][subcategory]"
              min="0"
              step="100"
              @input="updateValue"
              class="form-input"
            >
          </div>
          <div class="input-info" v-if="showTaxRate">
            Tax Rate: {{ getTaxRate(category, subcategory) }}%
          </div>
        </div>
      </div>
      <div class="category-total">
        Total {{ category }}: ${{ formatNumber(getCategoryTotal(category)) }}
      </div>
    </div>
    <div class="grand-total">
      Total Income: ${{ formatNumber(getGrandTotal()) }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'NestedIncomeInput',
  props: {
    categories: {
      type: Object,
      required: true
    },
    modelValue: {
      type: Object,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    showTaxRate: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      localValue: JSON.parse(JSON.stringify(this.modelValue))
    };
  },
  methods: {
    updateValue() {
      this.$emit('update:modelValue', JSON.parse(JSON.stringify(this.localValue)));
    },
    getCategoryTotal(category) {
      return Object.values(this.localValue[category] || {})
        .reduce((sum, value) => sum + (value || 0), 0);
    },
    getGrandTotal() {
      return Object.keys(this.categories)
        .reduce((sum, category) => sum + this.getCategoryTotal(category), 0);
    },
    getTaxRate(category, subcategory) {
      const taxRates = {
        'Dividends': {
          'Qualified': 15,
          'Non-Qualified': 37
        },
        'Interest': {
          'Taxable': 37,
          'Tax-Exempt': 0
        },
        'Capital Gains': {
          'Short-Term': 37,
          'Long-Term': 20
        }
      };
      return taxRates[category]?.[subcategory] || 0;
    },
    formatNumber(number) {
      return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  },
  watch: {
    modelValue: {
      deep: true,
      handler(newValue) {
        this.localValue = JSON.parse(JSON.stringify(newValue));
      }
    }
  }
};
</script>

<style scoped>
.nested-income-input {
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.income-category {
  margin-bottom: 1.5rem;
}

.category-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 1rem;
}

.subcategories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.subcategory-input {
  position: relative;
}

.subcategory-input label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.input-with-currency {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 0.75rem;
  color: #718096;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  padding-left: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.input-info {
  font-size: 0.875rem;
  color: #718096;
  margin-top: 0.25rem;
}