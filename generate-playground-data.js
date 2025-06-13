#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the extracted API data
const apiDataPath = path.join(__dirname, '../primevue-api-data.json');
const apiData = JSON.parse(fs.readFileSync(apiDataPath, 'utf8'));

// Component playground configurations
const playgroundConfigs = {
  Button: {
    component: 'Button',
    content: 'Click Me',
    defaultProps: {
      label: 'Click Me',
      icon: 'pi pi-check',
      iconPos: 'left'
    },
    propOverrides: {
      severity: { options: ['', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] },
      iconPos: { options: ['left', 'right', 'top', 'bottom'] },
      size: { options: ['', 'small', 'large'] }
    }
  },
  InputText: {
    component: 'InputText',
    content: '',
    defaultProps: {
      modelValue: 'Sample text',
      placeholder: 'Enter text...'
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] },
      variant: { options: ['outlined', 'filled'] }
    }
  },
  InputNumber: {
    component: 'InputNumber',
    content: '',
    defaultProps: {
      modelValue: 42,
      placeholder: 'Enter number...',
      showButtons: true
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] },
      variant: { options: ['outlined', 'filled'] },
      buttonLayout: { options: ['stacked', 'horizontal', 'vertical'] },
      mode: { options: ['decimal', 'currency'] }
    }
  },
  Select: {
    component: 'Select',
    content: '',
    defaultProps: {
      options: [
        { label: 'New York', value: 'ny' },
        { label: 'London', value: 'ldn' },
        { label: 'Paris', value: 'prs' },
        { label: 'Tokyo', value: 'tky' }
      ],
      optionLabel: 'label',
      optionValue: 'value',
      placeholder: 'Select a city...'
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] },
      variant: { options: ['outlined', 'filled'] }
    }
  },
  MultiSelect: {
    component: 'MultiSelect',
    content: '',
    defaultProps: {
      options: [
        { label: 'Australia', value: 'au' },
        { label: 'Brazil', value: 'br' },
        { label: 'China', value: 'cn' },
        { label: 'Egypt', value: 'eg' },
        { label: 'France', value: 'fr' }
      ],
      optionLabel: 'label',
      optionValue: 'value',
      placeholder: 'Select countries...',
      display: 'chip'
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] },
      variant: { options: ['outlined', 'filled'] },
      display: { options: ['comma', 'chip'] }
    }
  },
  ToggleSwitch: {
    component: 'ToggleSwitch',
    content: '',
    defaultProps: {
      modelValue: true
    }
  },
  Slider: {
    component: 'Slider',
    content: '',
    defaultProps: {
      modelValue: 50,
      min: 0,
      max: 100,
      step: 1
    },
    propOverrides: {
      orientation: { options: ['horizontal', 'vertical'] }
    }
  },
  TextArea: {
    component: 'Textarea',
    content: '',
    defaultProps: {
      modelValue: 'This is a sample text in the textarea component.',
      placeholder: 'Enter your message...',
      rows: 4
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] },
      variant: { options: ['outlined', 'filled'] }
    }
  },
  ColorPicker: {
    component: 'ColorPicker',
    content: '',
    defaultProps: {
      modelValue: '#42b883'
    },
    propOverrides: {
      format: { options: ['hex', 'rgb', 'hsb'] }
    }
  },
  SelectButton: {
    component: 'SelectButton',
    content: '',
    defaultProps: {
      options: [
        { label: 'Small', value: 'S' },
        { label: 'Medium', value: 'M' },
        { label: 'Large', value: 'L' }
      ],
      optionLabel: 'label',
      optionValue: 'value',
      modelValue: 'M'
    },
    propOverrides: {
      size: { options: ['', 'small', 'large'] }
    }
  }
};

function determineInputType(prop, componentConfig) {
  // Check for overrides first
  if (componentConfig.propOverrides && componentConfig.propOverrides[prop.name]) {
    const override = componentConfig.propOverrides[prop.name];
    if (override.options) return 'select';
  }
  
  // Determine from type
  if (prop.type.includes('boolean')) return 'boolean';
  if (prop.type.includes('number')) return 'number';
  if (prop.type.includes('|') && !prop.type.includes('undefined')) return 'select';
  if (prop.name === 'options' || prop.name.includes('Options')) return 'readonly';
  
  return 'text';
}

function getSelectOptions(prop, componentConfig) {
  // Check for overrides
  if (componentConfig.propOverrides && componentConfig.propOverrides[prop.name]) {
    return componentConfig.propOverrides[prop.name].options;
  }
  
  // Extract from union types
  const unionMatch = prop.type.match(/'([^']+)'/g);
  if (unionMatch) {
    const options = unionMatch.map(match => match.replace(/'/g, ''));
    return ['', ...options]; // Add empty option
  }
  
  return [''];
}

function determinePriority(prop) {
  const coreProps = ['modelValue', 'value', 'label', 'options', 'placeholder', 'disabled', 'size', 'variant'];
  const stylingProps = ['class', 'style', 'severity', 'outlined', 'text', 'raised', 'rounded'];
  
  if (coreProps.some(core => prop.name.toLowerCase().includes(core.toLowerCase()))) {
    return 'high';
  }
  
  if (stylingProps.some(style => prop.name.toLowerCase().includes(style.toLowerCase()))) {
    return 'medium';
  }
  
  return 'low';
}

function generatePlaygroundComponent(componentData) {
  const config = playgroundConfigs[componentData.componentName];
  if (!config) return null;
  
  const processedProps = componentData.props.map(prop => {
    const inputType = determineInputType(prop, config);
    const priority = determinePriority(prop);
    
    const processedProp = {
      name: prop.name,
      type: prop.type,
      description: prop.description,
      priority,
      inputType
    };
    
    if (inputType === 'select') {
      processedProp.options = getSelectOptions(prop, config);
    }
    
    return processedProp;
  });
  
  return {
    name: componentData.componentName,
    component: config.component,
    content: config.content,
    defaultProps: config.defaultProps,
    props: processedProps
  };
}

function generatePlaygroundData() {
  const playgroundData = [];
  
  for (const componentData of apiData) {
    const playgroundComponent = generatePlaygroundComponent(componentData);
    if (playgroundComponent) {
      playgroundData.push(playgroundComponent);
    }
  }
  
  return playgroundData;
}

function generateFullPlaygroundHTML(playgroundData) {
  const componentsJSON = JSON.stringify(playgroundData, null, 2);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PrimeVue Component Prop Playground - Complete</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/primevue@4/umd/primevue.min.js"></script>
    <link href="https://unpkg.com/primevue@4/resources/themes/aura-light-blue/theme.css" rel="stylesheet">
    <link href="https://unpkg.com/primevue@4/resources/primevue.min.css" rel="stylesheet">
    <link href="https://unpkg.com/primeicons/primeicons.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
        }
        
        .playground {
            display: grid;
            grid-template-columns: 1fr 400px;
            height: 100vh;
            gap: 1rem;
            padding: 1rem;
        }
        
        .preview-area {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            overflow-y: auto;
        }
        
        .controls-panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            padding: 1.5rem;
            overflow-y: auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .header h1 {
            color: #1f2937;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #6b7280;
        }
        
        .component-selector {
            margin-bottom: 2rem;
        }
        
        .component-selector select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 1rem;
        }
        
        .component-preview {
            padding: 2rem;
            border: 2px dashed #e5e7eb;
            border-radius: 12px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .prop-group {
            margin-bottom: 2rem;
        }
        
        .prop-group h3 {
            color: #374151;
            font-size: 1.1rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .group-toggle {
            font-size: 0.875rem;
            color: #6b7280;
            cursor: pointer;
            user-select: none;
        }
        
        .prop-control {
            margin-bottom: 1rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .prop-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .prop-name {
            font-weight: 600;
            color: #1f2937;
            font-family: 'Courier New', monospace;
        }
        
        .prop-type {
            font-size: 0.75rem;
            color: #6b7280;
            font-family: 'Courier New', monospace;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .prop-description {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.75rem;
        }
        
        .prop-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        
        .checkbox-input {
            width: auto;
            margin-right: 0.5rem;
        }
        
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        
        .api-decision {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .api-decision h4 {
            color: #92400e;
            margin-bottom: 0.5rem;
        }
        
        .expose-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        }
        
        .expose-toggle input[type="checkbox"] {
            transform: scale(1.2);
        }
        
        .code-output {
            background: #1f2937;
            color: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .stats-summary {
            background: #f0f9ff;
            border: 1px solid #0284c7;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .summary-item {
            color: #0369a1;
            font-weight: 600;
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="playground">
            <div class="preview-area">
                <div class="header">
                    <h1>PrimeVue SDK Prop Designer</h1>
                    <p>Interactive playground to decide which props to expose in your component SDK</p>
                </div>
                
                <div class="stats-summary" v-if="selectedComponentName">
                    <h4 style="color: #0369a1; margin-bottom: 0.5rem;">{{ selectedComponentName }} API Decisions</h4>
                    <div class="summary-grid">
                        <div class="summary-item">Exposed Props: {{ exposedPropsCount }} / {{ totalPropsCount }}</div>
                        <div class="summary-item">Coverage: {{ exposedPercentage }}%</div>
                        <div class="summary-item">Core Props: {{ exposedCoreCount }} / {{ totalCoreCount }}</div>
                        <div class="summary-item">Priority: {{ getOverallPriority() }}</div>
                    </div>
                </div>
                
                <div class="component-preview">
                    <component 
                        :is="selectedComponent" 
                        v-bind="currentProps"
                        @update:modelValue="onModelValueUpdate"
                        v-if="selectedComponent"
                    >
                        {{ componentContent }}
                    </component>
                </div>
                
                <div class="code-output" v-if="exposedPropsCode">
                    <h4 style="color: #f59e0b; margin-bottom: 1rem;">Generated SDK API Interface:</h4>
                    {{ exposedPropsCode }}
                </div>
            </div>
            
            <div class="controls-panel">
                <div class="component-selector">
                    <label for="component-select" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Component:</label>
                    <select id="component-select" v-model="selectedComponentName" @change="switchComponent">
                        <option value="">Select a component...</option>
                        <option v-for="comp in availableComponents" :key="comp.name" :value="comp.name">
                            {{ comp.name }} ({{ comp.props.length }} props)
                        </option>
                    </select>
                </div>
                
                <div v-if="selectedComponentName" class="prop-groups">
                    <div v-for="group in propGroups" :key="group.name" class="prop-group">
                        <h3>
                            {{ group.name }} ({{ group.props.length }} props)
                            <span class="group-toggle" @click="toggleGroup(group.priority)">
                                {{ collapsedGroups[group.priority] ? '▼ Show' : '▲ Hide' }}
                            </span>
                        </h3>
                        
                        <div :class="{ hidden: collapsedGroups[group.priority] }">
                            <div 
                                v-for="prop in group.props" 
                                :key="prop.name"
                                :class="['prop-control', 'priority-' + group.priority]"
                            >
                                <div class="prop-header">
                                    <span class="prop-name">{{ prop.name }}</span>
                                    <span class="prop-type" :title="prop.type">{{ prop.type }}</span>
                                </div>
                                
                                <div class="prop-description">{{ prop.description || 'No description available' }}</div>
                                
                                <div style="margin-bottom: 0.75rem;">
                                    <input 
                                        v-if="prop.inputType === 'text'"
                                        type="text"
                                        class="prop-input"
                                        v-model="currentProps[prop.name]"
                                        :placeholder="'Enter ' + prop.name"
                                    />
                                    <input 
                                        v-else-if="prop.inputType === 'number'"
                                        type="number"
                                        class="prop-input"
                                        v-model="currentProps[prop.name]"
                                    />
                                    <input 
                                        v-else-if="prop.inputType === 'boolean'"
                                        type="checkbox"
                                        class="checkbox-input"
                                        v-model="currentProps[prop.name]"
                                    />
                                    <select 
                                        v-else-if="prop.inputType === 'select'"
                                        class="prop-input"
                                        v-model="currentProps[prop.name]"
                                    >
                                        <option v-for="option in prop.options" :key="option" :value="option">
                                            {{ option || '(default)' }}
                                        </option>
                                    </select>
                                    <div 
                                        v-else-if="prop.inputType === 'readonly'"
                                        style="color: #6b7280; font-style: italic; padding: 0.5rem; background: #f3f4f6; border-radius: 4px;"
                                    >
                                        [Complex object - view component defaults]
                                    </div>
                                </div>
                                
                                <div class="api-decision">
                                    <h4>SDK API Decision:</h4>
                                    <label class="expose-toggle">
                                        <input 
                                            type="checkbox" 
                                            v-model="exposedProps[prop.name]"
                                            @change="updateExposedProps"
                                        />
                                        Expose this prop in SDK
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const { createApp } = Vue;
        
        const availableComponents = ${componentsJSON};
        
        createApp({
            data() {
                return {
                    selectedComponentName: '',
                    selectedComponent: null,
                    currentProps: {},
                    exposedProps: {},
                    exposedPropsCode: '',
                    availableComponents,
                    collapsedGroups: {
                        low: true, // Start with advanced props collapsed
                        medium: false,
                        high: false
                    }
                }
            },
            
            computed: {
                componentContent() {
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    return component ? component.content : '';
                },
                
                propGroups() {
                    if (!this.selectedComponentName) return [];
                    
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    if (!component) return [];
                    
                    const groups = {
                        high: { name: '🔴 Core Props', priority: 'high', props: [] },
                        medium: { name: '🟡 Styling Props', priority: 'medium', props: [] },
                        low: { name: '🟢 Advanced Props', priority: 'low', props: [] }
                    };
                    
                    component.props.forEach(prop => {
                        groups[prop.priority].props.push(prop);
                    });
                    
                    return Object.values(groups).filter(group => group.props.length > 0);
                },
                
                totalPropsCount() {
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    return component ? component.props.length : 0;
                },
                
                exposedPropsCount() {
                    return Object.values(this.exposedProps).filter(Boolean).length;
                },
                
                exposedPercentage() {
                    return this.totalPropsCount > 0 ? Math.round((this.exposedPropsCount / this.totalPropsCount) * 100) : 0;
                },
                
                totalCoreCount() {
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    return component ? component.props.filter(p => p.priority === 'high').length : 0;
                },
                
                exposedCoreCount() {
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    if (!component) return 0;
                    
                    return component.props
                        .filter(p => p.priority === 'high')
                        .filter(p => this.exposedProps[p.name])
                        .length;
                }
            },
            
            mounted() {
                // Auto-select first component
                if (this.availableComponents.length > 0) {
                    this.selectedComponentName = this.availableComponents[0].name;
                    this.switchComponent();
                }
            },
            
            methods: {
                switchComponent() {
                    if (!this.selectedComponentName) {
                        this.selectedComponent = null;
                        return;
                    }
                    
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    if (!component) return;
                    
                    this.selectedComponent = component.component;
                    this.currentProps = { ...component.defaultProps };
                    
                    // Initialize exposed props (start with core props exposed)
                    this.exposedProps = {};
                    component.props.forEach(prop => {
                        this.exposedProps[prop.name] = prop.priority === 'high';
                    });
                    
                    this.updateExposedProps();
                },
                
                updateProp(propName, value) {
                    this.currentProps[propName] = value;
                },
                
                onModelValueUpdate(value) {
                    this.currentProps.modelValue = value;
                },
                
                updateExposedProps() {
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    if (!component) return;
                    
                    const exposedPropsList = Object.keys(this.exposedProps).filter(prop => this.exposedProps[prop]);
                    const exposedPropsDetails = component.props.filter(prop => exposedPropsList.includes(prop.name));
                    
                    // Generate TypeScript interface
                    let code = \`export interface \${this.selectedComponentName}Props {\\n\`;
                    exposedPropsDetails.forEach(prop => {
                        const optional = prop.name !== 'modelValue' ? '?' : '';
                        const cleanType = prop.type.replace(/undefined \\| /g, '').replace(/ \\| undefined/g, '');
                        code += \`  \${prop.name}\${optional}: \${cleanType};\\n\`;
                    });
                    code += \`}\\n\\n\`;
                    
                    // Add component usage example
                    code += \`// Usage Example:\\n\`;
                    code += \`<\${this.selectedComponentName}\\n\`;
                    exposedPropsDetails.slice(0, 3).forEach(prop => {
                        const exampleValue = this.getExampleValue(prop);
                        code += \`  \${prop.name}={\${exampleValue}}\\n\`;
                    });
                    code += \`/>\\n\\n\`;
                    
                    // Add statistics
                    code += \`/* API Statistics:\\n\`;
                    code += \` * Exposed props: \${exposedPropsList.length} / \${component.props.length}\\n\`;
                    code += \` * Core props: \${exposedPropsDetails.filter(p => p.priority === 'high').length}\\n\`;
                    code += \` * Styling props: \${exposedPropsDetails.filter(p => p.priority === 'medium').length}\\n\`;
                    code += \` * Advanced props: \${exposedPropsDetails.filter(p => p.priority === 'low').length}\\n\`;
                    code += \` */\`;
                    
                    this.exposedPropsCode = code;
                },
                
                getExampleValue(prop) {
                    if (prop.type.includes('boolean')) return 'true';
                    if (prop.type.includes('number')) return '42';
                    if (prop.type.includes('string')) return '"example"';
                    return '"value"';
                },
                
                getOverallPriority() {
                    const exposed = Object.keys(this.exposedProps).filter(prop => this.exposedProps[prop]);
                    const component = this.availableComponents.find(c => c.name === this.selectedComponentName);
                    if (!component) return 'None';
                    
                    const coreExposed = component.props.filter(p => p.priority === 'high' && this.exposedProps[p.name]).length;
                    const totalCore = component.props.filter(p => p.priority === 'high').length;
                    
                    if (exposed.length === 0) return 'None';
                    if (coreExposed === totalCore && exposed.length > totalCore) return 'Complete';
                    if (coreExposed === totalCore) return 'Core Complete';
                    if (coreExposed > 0) return 'Partial Core';
                    return 'Custom';
                },
                
                toggleGroup(priority) {
                    this.collapsedGroups[priority] = !this.collapsedGroups[priority];
                }
            }
        }).mount('#app');
    </script>
</body>
</html>`;
}

function main() {
  console.log('Generating comprehensive playground data...');
  
  const playgroundData = generatePlaygroundData();
  console.log(`Generated data for ${playgroundData.length} components`);
  
  // Generate the complete playground HTML
  const playgroundHTML = generateFullPlaygroundHTML(playgroundData);
  const outputPath = path.join(__dirname, '../primevue-prop-playground-complete.html');
  fs.writeFileSync(outputPath, playgroundHTML);
  
  console.log(`✅ Complete playground generated: ${outputPath}`);
  console.log('🎮 Open this file in your browser to start exploring!');
  
  // Also save just the data
  const dataPath = path.join(__dirname, '../playground-components.json');
  fs.writeFileSync(dataPath, JSON.stringify(playgroundData, null, 2));
  console.log(`💾 Component data saved: ${dataPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generatePlaygroundData, generateFullPlaygroundHTML };