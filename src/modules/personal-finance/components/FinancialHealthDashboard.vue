<template>
  <Card>
    <CardHeader>
      <CardTitle>Financial Health Analysis</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Overall Score -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Overall Financial Health</h3>
        <div class="flex items-center gap-4">
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              class="bg-blue-500 h-2.5 rounded-full" 
              :style="{ width: `${(analysis.overallScore * 100).toFixed(0)}%` }"
            ></div>
          </div>
          <span class="font-bold text-lg">{{ (analysis.overallScore * 100).toFixed(0) }}%</span>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          Your financial health is {{ analysis.summary.overallHealth }}
        </p>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          v-for="(score, category) in analysis.scores" 
          :key="category"
          class="p-4 bg-gray-50 rounded-lg"
        >
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-medium">{{ formatCategory(category) }}</h4>
            <span :class="[
              'text-sm font-bold',
              score >= 0.7 ? 'text-green-600' : 
              score >= 0.5 ? 'text-yellow-600' : 
              'text-red-600'
            ]">
              {{ (score * 100).toFixed(0) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full"
              :class="[
                score >= 0.7 ? 'bg-green-500' : 
                score >= 0.5 ? 'bg-yellow-500' : 
                'bg-red-500'
              ]"
              :style="{ width: `${(score * 100).toFixed(0)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Strengths and Weaknesses -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircleIcon class="text-green-500 h-5 w-5" />
            Financial Strengths
          </h3>
          <ul class="space-y-2">
            <li 
              v-for="(strength, index) in analysis.summary.strengths" 
              :key="index"
              class="flex items-center gap-2 text-green-700"
            >
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              {{ formatCategory(strength) }}
            </li>
          </ul>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircleIcon class="text-red-500 h-5 w-5" />
            Areas for Improvement
          </h3>
          <ul class="space-y-2">
            <li 
              v-for="(weakness, index) in analysis.summary.weaknesses" 
              :key="index"
              class="flex items-center gap-2 text-red-700"
            >
              <div class="w-2 h-2 rounded-full bg-red-500"></div>
              {{ formatCategory(weakness) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Priority Recommendations -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <TrendingUpIcon class="text-blue-500 h-5 w-5" />
          Key Recommendations
        </h3>
        <div class="space-y-4">
          <Card 
            v-for="(rec, index) in analysis.recommendations" 
            :key="index"
            class="bg-gray-50"
          >
            <CardContent class="p-4">
              <div class="flex items-start gap-4">
                <div :class="[
                  'px-2 py-1 rounded text-sm font-medium',
                  rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                ]">
                  {{ rec.priority.toUpperCase() }}
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold mb-2">{{ rec.title }}</h4>
                  <p class="text-gray-600 mb-3">{{ rec.description }}</p>
                  <div class="space-y-2">
                    <div 
                      v-for="(action, actionIndex) in rec.actions" 
                      :key="actionIndex"
                      class="flex items-center gap-2 text-sm"
                    >
                      <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      {{ action }}
                    </div>
                  </div>
                  <div class="mt-3 text-sm text-blue-600">
                    Impact: {{ rec.impact }}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircleIcon, AlertCircleIcon, TrendingUpIcon } from 'lucide-vue-next';

const props = defineProps({
  analysis: {
    type: Object,
    required: true
  }
});

const formatCategory = (category) => {
  return category.replace(/([A-Z])/g, ' $1').trim();
};
</script>
