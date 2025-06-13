import { createApp } from 'vue'
import App from './App.vue'

// Import PrimeVue with new theme system
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'

// Import Tailwind CSS
import './style.css'

// Components
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

const PlaygroundPreset = definePreset(Aura, {
  semantic: {
    primary: Aura['primitive'].blue
  }
})

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: PlaygroundPreset,
    options: {
      prefix: 'p',
      cssLayer: {
        name: 'primevue',
        order: 'primevue'
      }
    }
  }
})

// Register components globally
app.component('Button', Button)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('Select', Select)
app.component('MultiSelect', MultiSelect)
app.component('SelectButton', SelectButton)
app.component('ColorPicker', ColorPicker)
app.component('ToggleSwitch', ToggleSwitch)
app.component('Slider', Slider)
app.component('Textarea', Textarea)

app.mount('#app')