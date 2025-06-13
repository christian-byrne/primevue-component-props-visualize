<template>
  <div class="playground bg-gray-50 min-h-screen p-6">
    <div class="grid grid-cols-12 gap-6 h-screen">
      <!-- Preview Area -->
      <div class="col-span-7 bg-white rounded-xl shadow-elevation-2 p-8 flex flex-col">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">PrimeVue Component Playground</h1>
          <p class="text-gray-600">Explore props visually to decide which ones to expose in your SDK</p>
        </div>
        
        <div class="component-preview litegraph-bg border-2 border-dashed border-gray-600 rounded-xl p-12 min-h-64 flex items-center justify-center flex-1 mb-6">
          <div class="mock-node">
            <div class="node-header">
              <div class="node-dot"></div>
              {{ selectedComponentName }} Widget
            </div>
            <div class="widget-container">
              <component 
                :is="selectedComponent" 
                v-bind="currentProps"
                :pt="getComponentPt(selectedComponentName)"
                @update:modelValue="onModelValueUpdate"
                v-if="selectedComponent"
                class="text-xs"
              >
                {{ componentContent }}
              </component>
            </div>
          </div>
        </div>
        
        <div v-if="exposedPropsCode" class="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm">
          <h4 class="text-blue-400 mb-4 font-semibold">Generated SDK API Interface:</h4>
          <pre class="whitespace-pre-wrap">{{ exposedPropsCode }}</pre>
        </div>
      </div>
      
      <!-- Controls Panel -->
      <div class="col-span-5 bg-white rounded-xl shadow-elevation-2 p-6 overflow-y-auto">
        <div class="mb-8">
          <label class="block text-sm font-semibold text-gray-900 mb-3">Component:</label>
          <Select 
            v-model="selectedComponentName" 
            :options="availableComponents" 
            optionLabel="name" 
            optionValue="name"
            placeholder="Select a component..."
            @change="switchComponent"
            fluid
          />
        </div>
        
        <div v-if="selectedComponentName" class="space-y-6">
          <div v-for="group in propGroups" :key="group.name" class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 pb-2 border-b-2 border-gray-200">
              {{ group.name }} ({{ group.props.length }} props)
            </h3>
            
            <div 
              v-for="prop in group.props" 
              :key="prop.name"
              :class="[
                'p-6 rounded-lg border bg-gray-50',
                {
                  'border-l-4 border-l-red-500': group.priority === 'high',
                  'border-l-4 border-l-orange-500': group.priority === 'medium', 
                  'border-l-4 border-l-green-500': group.priority === 'low'
                }
              ]"
            >
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold text-gray-900 font-mono">{{ prop.name }}</span>
                <span class="text-xs text-gray-700 font-mono">{{ prop.type }}</span>
              </div>
              
              <div class="text-sm text-gray-600 mb-4 leading-relaxed">
                {{ prop.description || 'No description available' }}
              </div>
              
              <div class="mb-4">
                <InputText 
                  v-if="getEnhancedInputConfig(prop).inputType === 'text'"
                  v-model="currentProps[prop.name]"
                  :placeholder="getPlaceholder(prop)"
                  fluid
                />
                <InputNumber 
                  v-else-if="getEnhancedInputConfig(prop).inputType === 'number'"
                  v-model="currentProps[prop.name]"
                  :placeholder="getPlaceholder(prop)"
                  fluid
                />
                <ToggleSwitch 
                  v-else-if="getEnhancedInputConfig(prop).inputType === 'boolean'"
                  v-model="currentProps[prop.name]"
                />
                <Select 
                  v-else-if="getEnhancedInputConfig(prop).inputType === 'select'"
                  v-model="currentProps[prop.name]"
                  :options="getEnhancedInputConfig(prop).options?.map(opt => ({ 
                    label: opt === undefined ? '(undefined)' : opt || '(default)', 
                    value: opt 
                  }))"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                />
                <div v-else-if="getEnhancedInputConfig(prop).inputType === 'readonly'">
                  <label class="block text-sm font-medium text-gray-700 mb-2">JSON Object:</label>
                  <Textarea 
                    v-model="complexObjectStrings[prop.name]"
                    @input="updateComplexObject(prop.name)"
                    rows="4"
                    fluid
                    :placeholder="getPlaceholder(prop)"
                    class="font-mono text-sm"
                  />
                  <small v-if="complexObjectErrors[prop.name]" class="text-red-500 block mt-1">
                    {{ complexObjectErrors[prop.name] }}
                  </small>
                </div>
              </div>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="text-sm font-semibold text-gray-800 mb-2">SDK API Decision:</div>
                <div class="flex items-center gap-3">
                  <ToggleSwitch 
                    v-model="exposedProps[prop.name]"
                    @change="updateExposedProps"
                  />
                  <span class="text-sm text-gray-700">Expose this prop in SDK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import ColorPicker from 'primevue/colorpicker'
import ToggleSwitch from 'primevue/toggleswitch'
import Slider from 'primevue/slider'
import Textarea from 'primevue/textarea'
import componentsData from '../playground-components.json'

interface PropDefinition {
  name: string
  type: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  inputType: string
  options?: string[]
}

interface ComponentDefinition {
  name: string
  component: string
  content: string
  defaultProps: Record<string, any>
  props: PropDefinition[]
}

interface PropGroup {
  name: string
  priority: 'high' | 'medium' | 'low'
  props: PropDefinition[]
}

const selectedComponentName = ref<string>('Button')
const selectedComponent = ref<string | null>(null)
const currentProps = ref<Record<string, any>>({})
const exposedProps = ref<Record<string, boolean>>({})
const exposedPropsCode = ref<string>('')
const complexObjectStrings = ref<Record<string, string>>({})
const complexObjectErrors = ref<Record<string, string | null>>({})

const availableComponents = computed<ComponentDefinition[]>(() => 
  (componentsData as ComponentDefinition[]).filter(comp => comp.props && comp.props.length > 0)
)

const componentContent = computed<string>(() => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  return component ? component.content : ''
})

// Function to detect string literal types and extract options
const detectStringLiteralOptions = (type: string): string[] | null => {
  // Match patterns like 'value1' | 'value2' | 'value3' or 'value1' | 'value2' | undefined
  const stringLiteralPattern = /'([^']+)'\s*\|\s*/g
  const matches = [...type.matchAll(stringLiteralPattern)]
  
  if (matches.length > 1) {
    return matches.map(match => match[1])
  }
  
  return null
}

// Function to get the effective input type and options for a prop
const getEffectiveInputConfig = (prop: PropDefinition) => {
  // If already configured as select, use existing config
  if (prop.inputType === 'select' && prop.options) {
    return {
      inputType: 'select',
      options: prop.options
    }
  }
  
  // Auto-detect string literal types
  const detectedOptions = detectStringLiteralOptions(prop.type)
  if (detectedOptions) {
    return {
      inputType: 'select',
      options: [...detectedOptions, undefined] // Add undefined option
    }
  }
  
  // Return original config
  return {
    inputType: prop.inputType,
    options: prop.options
  }
}

// Function to get appropriate placeholder for different prop types
const getPlaceholder = (prop: PropDefinition) => {
  const propName = prop.name.toLowerCase()
  
  if (propName === 'class') {
    return 'e.g., "bg-blue-500 text-white p-2 rounded"'
  }
  if (propName === 'style') {
    return 'e.g., "color: red; font-size: 14px;"'
  }
  if (propName === 'dt') {
    return 'e.g., { root: { class: "custom-class" } }'
  }
  if (propName === 'pt') {
    // Component-specific pt examples
    return getComponentPtPlaceholder(prop)
  }
  
  return prop.description || `Enter ${prop.type}`
}

// Function to get component-specific pt placeholder
const getComponentPtPlaceholder = (prop: PropDefinition) => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return 'e.g., { root: { class: "custom-class" } }'
  
  const componentName = component.name.toLowerCase()
  
  switch (componentName) {
    case 'button':
      return 'e.g., { root: { class: "bg-[#222222] text-xs border-[#222222] shadow-none" } }'
    case 'inputtext':
      return 'e.g., { root: { class: "bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd]" } }'
    case 'select':
      return 'e.g., { root: { class: "bg-[#222222] text-xs" }, label: { class: "text-[#ddd]" } }'
    default:
      return 'e.g., { root: { class: "bg-[#222222] text-xs border-[#222222] shadow-none" } }'
  }
}

// Function to get default pt styling for components to match widgets
const getComponentPt = (componentName: string | null) => {
  if (!componentName) return {}
  
  const name = componentName.toLowerCase()
  
  switch (name) {
    case 'button':
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd] px-3 py-2' }
      }
    case 'inputtext':
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd] px-3 py-2' }
      }
    case 'select':
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none' },
        label: { class: 'text-[#ddd] px-3 py-2' }
      }
    case 'inputnumber':
      return {
        pcInputText: {
          root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd] px-3 py-2' }
        }
      }
    case 'textarea':
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd] px-3 py-2' }
      }
    case 'multiselect':
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none' },
        label: { class: 'text-[#ddd] px-3 py-2' }
      }
    default:
      return {
        root: { class: 'bg-[#222222] text-xs border-[#222222] shadow-none text-[#ddd]' }
      }
  }
}

const propGroups = computed<PropGroup[]>(() => {
  if (!selectedComponentName.value) return []
  
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return []
  
  const groups: Record<string, PropGroup> = {
    high: { name: '🔴 Core Props', priority: 'high', props: [] },
    medium: { name: '🟡 Styling Props', priority: 'medium', props: [] },
    low: { name: '🟢 Advanced Props', priority: 'low', props: [] }
  }
  
  component.props.forEach(prop => {
    groups[prop.priority].props.push(prop)
  })
  
  return Object.values(groups).filter(group => group.props.length > 0)
})

// Get enhanced config for a specific prop
const getEnhancedInputConfig = (prop: PropDefinition) => {
  return getEffectiveInputConfig(prop)
}

const switchComponent = () => {
  if (!selectedComponentName.value) {
    selectedComponent.value = null
    return
  }
  
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return
  
  selectedComponent.value = component.component
  currentProps.value = { ...component.defaultProps }
  
  // Initialize complex object strings and clear errors
  complexObjectStrings.value = {}
  complexObjectErrors.value = {}
  
  // Initialize complex objects from default props
  component.props.forEach(prop => {
    if (prop.inputType === 'readonly' && currentProps.value[prop.name]) {
      try {
        complexObjectStrings.value[prop.name] = JSON.stringify(currentProps.value[prop.name], null, 2)
      } catch (e) {
        complexObjectStrings.value[prop.name] = String(currentProps.value[prop.name])
      }
    }
  })
  
  // Initialize exposed props (enable all by default)
  exposedProps.value = {}
  component.props.forEach(prop => {
    exposedProps.value[prop.name] = true
  })
  
  updateExposedProps()
}

const onModelValueUpdate = (value: any) => {
  currentProps.value.modelValue = value
}

const updateExposedProps = () => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return
  
  const exposedPropsList = Object.keys(exposedProps.value).filter(prop => exposedProps.value[prop])
  const exposedPropsDetails = component.props.filter(prop => exposedPropsList.includes(prop.name))
  
  // Generate TypeScript interface
  let code = `interface ${selectedComponentName.value}Props {\n`
  exposedPropsDetails.forEach(prop => {
    const optional = prop.name !== 'modelValue' ? '?' : ''
    code += `  ${prop.name}${optional}: ${prop.type};\n`
  })
  code += `}`
  
  exposedPropsCode.value = code
}

const updateComplexObject = (propName: string) => {
  const jsonString = complexObjectStrings.value[propName]
  
  // Clear previous error
  complexObjectErrors.value[propName] = null
  
  if (!jsonString || jsonString.trim() === '') {
    currentProps.value[propName] = null
    return
  }
  
  try {
    const parsed = JSON.parse(jsonString)
    currentProps.value[propName] = parsed
  } catch (e: any) {
    complexObjectErrors.value[propName] = `Invalid JSON: ${e.message}`
  }
}

onMounted(() => {
  switchComponent()
})
</script>

<style scoped>
.litegraph-bg {
  background-color: #202020;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=");
  background-repeat: repeat;
}

.mock-node {
  background-color: #353535;
  border: 1px solid #666;
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  color: #AAA;
  min-width: 250px;
  width: fit-content;
  height: fit-content;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.node-header {
  background-color: #333;
  color: #777;
  line-height: 1;
  padding: 8px 13px 7px;
  margin-bottom: 5px;
  font-size: 14px;
  text-wrap: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #666;
  margin-right: 8px;
  flex-shrink: 0;
}

.widget-container {
  padding: 10px 15px 15px 15px;
  background-color: #353535;
}
</style>

