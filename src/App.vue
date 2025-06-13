<template>
  <div class="playground bg-gray-50 min-h-screen p-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">PrimeVue Component Playground</h1>
      <p class="text-gray-600">Explore props visually to decide which ones to expose in your SDK</p>
    </div>
    
    <div class="grid grid-cols-12 gap-6 h-screen">
      <!-- Left Section: Preview + Code Panels -->
      <div class="col-span-8 flex flex-col gap-6">
        <!-- Component Preview -->
        <div class="bg-white rounded-xl shadow-elevation-2 p-6">
          <div class="component-preview litegraph-bg border-2 border-dashed border-gray-600 rounded-xl p-8 min-h-48 flex items-center justify-center">
          <div class="mock-node">
            <div class="node-header">
              <div class="node-dot"></div>
              {{ selectedComponentName }} Widget
            </div>
            <div class="widget-container">
              <!-- Special handling for slot-based components -->
              <ImageCompare 
                v-if="selectedComponent === 'ImageCompare'"
                v-bind="currentProps"
                :pt="getComponentPt(selectedComponentName)"
                class="text-xs w-96"
              >
                <template #left>
                  <img :src="currentProps.leftImage || 'https://picsum.photos/400/300?random=1'" alt="Left comparison image" />
                </template>
                <template #right>
                  <img :src="currentProps.rightImage || 'https://picsum.photos/400/300?random=2'" alt="Right comparison image" />
                </template>
              </ImageCompare>
              
              <Galleria 
                v-else-if="selectedComponent === 'Galleria'"
                v-bind="currentProps"
                :pt="getComponentPt(selectedComponentName)"
                class="text-xs"
              >
                <template #item="slotProps">
                  <img :src="slotProps.item.itemImageSrc" :alt="slotProps.item.alt" style="width: 100%; display: block;" />
                </template>
                <template #thumbnail="slotProps">
                  <img :src="slotProps.item.thumbnailImageSrc" :alt="slotProps.item.alt" style="width: 100%; display: block;" />
                </template>
              </Galleria>
              
              <FileUpload 
                v-else-if="selectedComponent === 'FileUpload'"
                v-bind="currentProps"
                :pt="getComponentPt(selectedComponentName)"
                class="text-xs"
                name="demo[]"
                :multiple="true"
                accept="image/*"
                :maxFileSize="1000000"
              >
                <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
                  <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
                    <div class="flex gap-2">
                      <Button @click="chooseCallback()" icon="pi pi-images" rounded outlined severity="secondary" size="small"></Button>
                      <Button @click="uploadCallback" icon="pi pi-cloud-upload" rounded outlined severity="success" size="small" :disabled="!files || files.length === 0"></Button>
                      <Button @click="clearCallback()" icon="pi pi-times" rounded outlined severity="danger" size="small" :disabled="!files || files.length === 0"></Button>
                    </div>
                    <ProgressBar :value="files?.length ? (files.length / 5) * 100 : 0" :showValue="false" class="w-32 h-1">
                      <span class="whitespace-nowrap text-xs">{{ files?.length || 0 }} files</span>
                    </ProgressBar>
                  </div>
                </template>
                <template #content="{ files, uploadedFiles, removeFileCallback }">
                  <div class="flex flex-col gap-4 pt-4">
                    <div v-if="files && files.length > 0">
                      <h5 class="text-sm font-semibold mb-2">Pending</h5>
                      <div class="flex flex-wrap gap-2">
                        <div v-for="(file, index) of files" :key="file.name + file.type + file.size" class="p-4 rounded border border-surface flex flex-col items-center gap-2 text-xs">
                          <div class="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <i class="pi pi-file text-gray-500"></i>
                          </div>
                          <span class="font-semibold text-ellipsis max-w-20 whitespace-nowrap overflow-hidden">{{ file.name }}</span>
                          <div class="text-xs text-gray-500">{{ Math.round(file.size / 1024) }}KB</div>
                          <Badge value="Pending" severity="warn" />
                          <Button icon="pi pi-times" @click="removeFileCallback(index)" outlined rounded severity="danger" size="small" />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                <template #empty>
                  <div class="flex items-center justify-center flex-col py-8">
                    <i class="pi pi-cloud-upload border-2 rounded-full p-4 text-2xl text-muted-color mb-4" />
                    <p class="text-sm text-gray-600 mb-0">Drag and drop files here to upload.</p>
                  </div>
                </template>
              </FileUpload>
              
              <!-- Regular dynamic component for others -->
              <component 
                v-else
                :is="getComponent(selectedComponent)" 
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
        </div>
        
        <!-- Generated Code Display - Three Columns -->
        <div v-if="exposedPropsCode" class="grid grid-cols-3 gap-4">
          <!-- TypeScript Interface -->
          <div class="bg-white rounded-xl shadow-elevation-2 p-4 flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-900">TypeScript Interface</h4>
              <Button 
                @click="copyToClipboard(exposedPropsCode)" 
                size="small" 
                severity="secondary"
                icon="pi pi-copy"
                class="text-xs"
              />
            </div>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs flex-1 overflow-y-auto max-h-96">
              <pre class="whitespace-pre-wrap">{{ exposedPropsCode }}</pre>
            </div>
          </div>
          
          <!-- TypeScript Pick Type -->
          <div class="bg-white rounded-xl shadow-elevation-2 p-4 flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-900">TypeScript Pick Type</h4>
              <Button 
                @click="copyToClipboard(tsPickType)" 
                size="small" 
                severity="secondary"
                icon="pi pi-copy"
                class="text-xs"
              />
            </div>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs flex-1 overflow-y-auto max-h-96">
              <pre class="whitespace-pre-wrap">{{ tsPickType }}</pre>
            </div>
          </div>
          
          <!-- Python InputSpec -->
          <div class="bg-white rounded-xl shadow-elevation-2 p-4 flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-900">Python InputSpec</h4>
              <Button 
                @click="copyToClipboard(pythonInputSpec)" 
                size="small" 
                severity="secondary"
                icon="pi pi-copy"
                class="text-xs"
              />
            </div>
            <div class="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs flex-1 overflow-y-auto max-h-96">
              <pre class="whitespace-pre-wrap">{{ pythonInputSpec }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Section: Controls Panel -->
      <div class="col-span-4 bg-white rounded-xl shadow-elevation-2 p-6 overflow-y-auto">
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
import Chart from 'primevue/chart'
import Image from 'primevue/image'
import ImageCompare from 'primevue/imagecompare'
import Galleria from 'primevue/galleria'
import FileUpload from 'primevue/fileupload'
import TreeSelect from 'primevue/treeselect'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import Badge from 'primevue/badge'
import componentsData from '../playground-components-updated.json'

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

// Computed properties for the three code displays
const tsPickType = computed<string>(() => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return '// No component selected'
  
  const exposedPropsList = Object.keys(exposedProps.value).filter(prop => exposedProps.value[prop])
  
  if (exposedPropsList.length === 0) {
    return '// No props selected'
  }
  
  const propsArray = exposedPropsList.map(prop => `"${prop}"`).join(' | ')
  return `Pick<${selectedComponentName.value}Props, ${propsArray}>`
})

const pythonInputSpec = computed<string>(() => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  if (!component) return '# No component selected'
  
  const exposedPropsList = Object.keys(exposedProps.value).filter(prop => exposedProps.value[prop])
  const exposedPropsDetails = component.props.filter(prop => exposedPropsList.includes(prop.name))
  
  if (exposedPropsDetails.length === 0) {
    return '# No props selected'
  }
  
  // Generate widget input with selected props as parameters
  const componentName = selectedComponentName.value
  const propsParams = exposedPropsDetails.map(prop => {
    // Convert prop names to snake_case for Python convention
    const pythonPropName = prop.name.replace(/([A-Z])/g, '_$1').toLowerCase()
    // Clean up type for comment (remove complex syntax)
    const cleanType = prop.type.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim()
    return `    ${pythonPropName}=None,  # ${cleanType}`
  }).join('\n')
  
  return `# ${componentName} Widget Input\n${componentName}.Input(\n    "${componentName.toLowerCase()}_widget",\n${propsParams}\n)`
})

const availableComponents = computed<ComponentDefinition[]>(() => 
  (componentsData as ComponentDefinition[]).filter(comp => comp.props && comp.props.length > 0)
)

const componentContent = computed<string>(() => {
  const component = availableComponents.value.find(c => c.name === selectedComponentName.value)
  return component ? component.content : ''
})

// Component mapping for dynamic resolution
const componentMap: Record<string, any> = {
  Button,
  InputText,
  InputNumber,
  Select,
  MultiSelect,
  SelectButton,
  ColorPicker,
  ToggleSwitch,
  Slider,
  Textarea,
  Chart,
  Image,
  ImageCompare,
  Galleria,
  FileUpload,
  TreeSelect,
  ProgressBar,
  Message,
  Badge
}

const getComponent = (componentName: string | null) => {
  if (!componentName) return null
  return componentMap[componentName] || null
}


// Simple clipboard copy function
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

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
  
  // Icon-related props
  if (propName.includes('icon') && !propName.includes('class')) {
    return 'e.g., "pi pi-home", "pi pi-user", "pi pi-folder" (see PrimeVue Icons docs)'
  }
  
  // Class-related props
  if (propName.includes('class') || propName === 'class') {
    if (propName.includes('icon')) {
      return 'e.g., "text-blue-500 text-lg", "rotate-90", "opacity-50" (Tailwind classes)'
    }
    if (propName.includes('badge')) {
      return 'e.g., "bg-red-500 text-white text-xs", "rounded-full px-2" (Tailwind classes)'
    }
    return 'e.g., "bg-blue-500 text-white p-2 rounded", "shadow-lg border" (Tailwind classes)'
  }
  
  // Style props
  if (propName === 'style' || propName.includes('style')) {
    return 'e.g., "color: red; font-size: 14px; margin: 10px;"'
  }
  
  // Design tokens
  if (propName === 'dt') {
    return 'e.g., { root: { class: "custom-class" } }'
  }
  
  // Pass-through props
  if (propName === 'pt') {
    return getComponentPtPlaceholder(prop)
  }
  
  // Severity props
  if (propName.includes('severity')) {
    return 'e.g., "success", "info", "warn", "danger", "secondary"'
  }
  
  // Size props
  if (propName === 'size') {
    return 'e.g., "small", "large" (or leave empty for default)'
  }
  
  // Label props
  if (propName.includes('label')) {
    return 'e.g., "Click me", "Submit", "Cancel"'
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

