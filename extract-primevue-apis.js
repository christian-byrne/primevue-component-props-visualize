#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Components from the Figma design
const components = [
  'InputNumber',
  'InputText', 
  'Select',
  'CascadeSelect',
  'ColorPicker',
  'FloatLabel',
  'IconField',
  'InputGroup',
  'MultiSelect',
  'SelectButton',
  'Slider',
  'TextArea',
  'ToggleSwitch',
  'TreeSelect',
  'Button',
  'Chart',
  'Image',
  'ImageCompare',
  'Accordion'
];

// Map component names to their URL paths (some have different casing)
const componentUrlMap = {
  'InputNumber': 'inputnumber',
  'InputText': 'inputtext',
  'Select': 'select',
  'CascadeSelect': 'cascadeselect',
  'ColorPicker': 'colorpicker',
  'FloatLabel': 'floatlabel',
  'IconField': 'iconfield',
  'InputGroup': 'inputgroup',
  'MultiSelect': 'multiselect',
  'SelectButton': 'selectbutton',
  'Slider': 'slider',
  'TextArea': 'textarea',
  'ToggleSwitch': 'toggleswitch',
  'TreeSelect': 'treeselect',
  'Button': 'button',
  'Chart': 'chart',
  'Image': 'image',
  'ImageCompare': 'imagecompare',
  'Accordion': 'accordion'
};

async function extractComponentAPI(browser, componentName) {
  const page = await browser.newPage();
  const urlPath = componentUrlMap[componentName];
  const url = `https://primevue.org/${urlPath}/`;
  
  try {
    console.log(`Extracting API for ${componentName} from ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the page to load and try to find the API tab
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Try to click the API tab
    try {
      const apiTabSelector = 'button[role="tab"]:has-text("API"), .p-tabview-nav button:has-text("API"), [data-pc-name="tab"]:has-text("API")';
      await page.waitForSelector('button', { timeout: 5000 });
      
      // Look for API tab with different possible selectors
      const apiTab = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.trim().includes('API'));
      });
      
      if (apiTab) {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const apiBtn = buttons.find(btn => btn.textContent.trim().includes('API'));
          if (apiBtn) apiBtn.click();
        });
        
        // Wait for API content to load
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log(`Could not find API tab for ${componentName}, extracting from main content`);
    }
    
    // Extract the API information
    const apiData = await page.evaluate((compName) => {
      const result = {
        componentName: compName,
        description: '',
        props: [],
        events: [],
        slots: []
      };
      
      // Try to find component description
      const descElements = document.querySelectorAll('p, .description, [class*="description"]');
      for (const elem of descElements) {
        if (elem.textContent.includes('extension') || elem.textContent.includes('component')) {
          result.description = elem.textContent.trim();
          break;
        }
      }
      
      // Look for props table
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
        
        // Check if this looks like a props table
        if (headers.includes('name') && headers.includes('type')) {
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length >= 3) {
              result.props.push({
                name: cells[0]?.textContent?.trim() || '',
                type: cells[1]?.textContent?.trim() || '',
                default: cells[2]?.textContent?.trim() || '',
                description: cells[3]?.textContent?.trim() || ''
              });
            }
          });
        }
      }
      
      // If no table found, try to extract from text content
      if (result.props.length === 0) {
        const textContent = document.body.textContent;
        if (textContent.includes('Props') || textContent.includes('API')) {
          result.description = `API content found but could not parse table structure for ${compName}`;
        }
      }
      
      return result;
    }, componentName);
    
    await page.close();
    return apiData;
    
  } catch (error) {
    console.error(`Error extracting API for ${componentName}:`, error.message);
    await page.close();
    return {
      componentName,
      description: `Error extracting API: ${error.message}`,
      props: [],
      events: [],
      slots: []
    };
  }
}

async function generateMarkdownReport(apiData) {
  let markdown = `# PrimeVue Component API Report

This report contains the API information for PrimeVue components that we're considering for our custom component library. 

**Instructions for Designer:**
- Review each component's props below
- Check the boxes next to props you want to include in our custom API
- Consider which props are essential vs. nice-to-have
- Note any missing props that might be needed

---

`;

  for (const data of apiData) {
    const urlPath = componentUrlMap[data.componentName];
    
    markdown += `## ${data.componentName}

**Documentation:** [https://primevue.org/${urlPath}/](https://primevue.org/${urlPath}/)  
**Node Modules:** \`node_modules/primevue/dist/${urlPath}/${urlPath}.d.ts\`

${data.description}

### Props Selection

`;

    if (data.props.length > 0) {
      markdown += `| Include | Name | Type | Default | Description |
|---------|------|------|---------|-------------|
`;
      
      data.props.forEach(prop => {
        const name = prop.name.replace(/\|/g, '\\|');
        const type = prop.type.replace(/\|/g, '\\|');
        const defaultVal = prop.default.replace(/\|/g, '\\|');
        const desc = prop.description.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        
        markdown += `| ☐ | \`${name}\` | \`${type}\` | \`${defaultVal}\` | ${desc} |\n`;
      });
    } else {
      markdown += `*No props found or could not parse API table. Please check the documentation manually.*

**Action needed:** Visit [https://primevue.org/${urlPath}/](https://primevue.org/${urlPath}/) and click the API tab to review props manually.
`;
    }
    
    markdown += `\n### Notes
<!-- Add any specific notes about this component -->

---

`;
  }
  
  markdown += `## Summary

**Total Components:** ${apiData.length}  
**Components with extracted props:** ${apiData.filter(d => d.props.length > 0).length}  
**Components needing manual review:** ${apiData.filter(d => d.props.length === 0).length}  

### Next Steps
1. Review each component's props and check the ones to include
2. Consider grouping props by priority (essential, nice-to-have, optional)
3. Identify any custom props we might need that aren't in PrimeVue
4. Plan the implementation phases based on selected props

---

*Generated on ${new Date().toISOString()}*
`;

  return markdown;
}

async function main() {
  console.log('Starting PrimeVue API extraction...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const allApiData = [];
  
  // Process components in batches to avoid overwhelming the server
  const batchSize = 3;
  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
    
    const batchPromises = batch.map(component => extractComponentAPI(browser, component));
    const batchResults = await Promise.all(batchPromises);
    allApiData.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < components.length) {
      console.log('Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  await browser.close();
  
  console.log('\nGenerating markdown report...');
  const markdown = await generateMarkdownReport(allApiData);
  
  const outputPath = path.join(__dirname, '../primevue-component-api-report.md');
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`\n✅ Report generated: ${outputPath}`);
  console.log(`📊 Processed ${allApiData.length} components`);
  console.log(`📋 Components with props: ${allApiData.filter(d => d.props.length > 0).length}`);
  
  // Also save raw data as JSON for further processing
  const jsonPath = path.join(__dirname, '../primevue-api-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allApiData, null, 2));
  console.log(`💾 Raw data saved: ${jsonPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractComponentAPI, generateMarkdownReport };