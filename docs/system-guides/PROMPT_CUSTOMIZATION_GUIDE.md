# 🎯 **LLM Summarization Prompt Customization Guide**

## 📍 **Where to Customize LLM Prompts**

### **1. Main Prompt Template System** ⭐ *PRIMARY LOCATION*

#### **📄 File Location**: `src/contexts/PromptTemplateContext.tsx`
- **Purpose**: Complete prompt template management system
- **Features**: Create, edit, delete, and manage custom prompts
- **Domains**: Appliance, Business, Technical, and Custom domains

#### **🔧 How to Access & Customize**:

```typescript
// 1. Import the context
import { usePromptTemplates } from '../contexts/PromptTemplateContext'

// 2. Use in component
const { templates, createTemplate, updateTemplate } = usePromptTemplates()

// 3. Create new template
createTemplate({
  name: "Custom Document Analysis",
  domain: "business",
  systemPrompt: "You are an expert business analyst...",
  userPrompt: "Analyze this document: {content}",
  description: "Custom business document analysis",
  variables: ['{content}', '{filename}', '{domain}'],
  isDefault: false,
  isActive: true
})
```

### **2. Default Prompt Templates** 

#### **📍 Location**: `src/contexts/PromptTemplateContext.tsx` (lines 44-200)

```typescript
const defaultTemplates: PromptTemplate[] = [
  {
    id: 'business-analysis',
    name: 'Business Document Analysis',
    domain: 'business',
    systemPrompt: `You are an expert business analyst with deep knowledge of:
- Strategic planning and market analysis
- Financial reporting and KPIs
- Operational efficiency and process optimization
- Risk management and compliance
- Competitive intelligence and benchmarking

Analyze business documents with focus on actionable insights, strategic implications, and key performance indicators.`,

    userPrompt: `Analyze this business document: "{filename}"

Content to analyze:
{content}

Domain: {domain}
Document Type: {documentType}
Word Count: {wordCount}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Business Insights
3. Strategic Implications  
4. Actionable Recommendations
5. Risk Factors & Considerations
6. Key Performance Indicators mentioned
7. Competitive/Market Intelligence

Focus on practical business value and strategic decision-making support.`,

    description: 'Comprehensive business document analysis with strategic focus',
    variables: ['{content}', '{filename}', '{domain}', '{documentType}', '{wordCount}'],
    isDefault: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  }
  // ... more templates
]
```

### **3. Enhanced Document Processing** 

#### **📄 File Location**: `src/rag/utils/enhanced-document-processing.ts`
- **Purpose**: AI-powered document analysis with custom prompts
- **Integration**: Uses prompt templates from PromptTemplateContext

#### **🎯 Current Implementation**:
```typescript
// Uses prompt templates for analysis
const { renderPrompt } = usePromptTemplates()
const template = getTemplate('business') // or 'appliance', 'technical'
const { systemPrompt, userPrompt } = renderPrompt(template, variables)
```

### **4. Prompt Template Types & Variables**

#### **📊 Available Template Domains**:
1. **`business`** - Strategic business analysis
2. **`appliance`** - Miele-specific appliance analysis  
3. **`technical`** - Technical documentation analysis
4. **`custom`** - User-defined templates

#### **🔤 Available Variables**:
```typescript
interface PromptTemplateVariables {
  content: string        // Document content
  filename: string       // Original filename
  domain: string         // business|appliance|technical
  documentType: string   // pdf|docx|txt|etc
  wordCount: number      // Document word count
  [key: string]: string | number // Custom variables
}
```

## 🛠️ **How to Customize Prompts**

### **Option 1: UI-Based Customization** ⭐ *RECOMMENDED*

#### **Access through RAG Interface**:
1. **Navigate**: RAG Dashboard → Settings Tab → Prompt Templates
2. **Actions Available**:
   - ✏️ **Edit Existing**: Modify system/user prompts
   - ➕ **Create New**: Add custom templates
   - 🔄 **Duplicate**: Clone and modify existing templates
   - 🗑️ **Delete**: Remove custom templates
   - 📤 **Export/Import**: Save and share template sets

#### **Template Editor Features**:
```typescript
// Template structure for editing
{
  name: "Custom Analysis Template",
  domain: "business", 
  systemPrompt: `Custom system instructions...`,
  userPrompt: `Custom analysis request with {variables}...`,
  description: "What this template does",
  variables: ['{content}', '{filename}', '{custom}'],
  isActive: true
}
```

### **Option 2: Programmatic Customization**

#### **Direct Code Modification**:
```typescript
// In your component:
const customTemplate = {
  name: "Miele Strategic Analysis",
  domain: "appliance",
  systemPrompt: `You are a Miele business strategist with expertise in:
- Premium appliance market positioning
- European kitchen appliance trends  
- Sustainability and innovation leadership
- Customer experience optimization
- Service excellence and reliability

Analyze documents with Miele-specific strategic context.`,
  
  userPrompt: `Analyze this document for Miele strategic insights:

Document: {filename}
Content: {content}

Focus on:
1. Miele brand positioning opportunities
2. Premium market segment analysis
3. Innovation and technology trends
4. Customer experience implications
5. Competitive landscape insights
6. Sustainability and ESG factors
7. Service and quality excellence markers

Provide strategic recommendations aligned with Miele's premium positioning.`,

  variables: ['{content}', '{filename}', '{domain}'],
  isDefault: false,
  isActive: true
}

// Add to templates
createTemplate(customTemplate)
```

### **Option 3: Domain-Specific Templates**

#### **Create Specialized Templates**:
```typescript
// Financial Analysis Template
const financialTemplate = {
  name: "Financial Document Analysis",
  domain: "business",
  systemPrompt: `You are a senior financial analyst specializing in:
- Financial statement analysis and ratio interpretation
- Cash flow and liquidity assessment  
- Profitability and efficiency metrics
- Risk assessment and credit analysis
- Investment valuation and ROI calculations`,
  
  userPrompt: `Perform detailed financial analysis on: {filename}

Financial Data:
{content}

Provide:
1. Key Financial Metrics Summary
2. Profitability Analysis
3. Liquidity and Solvency Assessment
4. Efficiency Ratios
5. Growth Trends and Patterns
6. Risk Indicators
7. Investment Recommendations
8. Comparative Benchmarks

Include specific numbers and ratios where available.`
}

// Technical Documentation Template  
const technicalTemplate = {
  name: "Technical Documentation Analysis",
  domain: "technical",
  systemPrompt: `You are a technical documentation specialist with expertise in:
- API documentation and integration guides
- System architecture and design patterns
- Code quality and best practices assessment
- Security and compliance requirements
- Performance optimization strategies`,
  
  userPrompt: `Analyze this technical document: {filename}

Technical Content:
{content}

Extract:
1. Technical Architecture Overview
2. API Endpoints and Methods
3. Integration Requirements
4. Security Considerations
5. Performance Specifications
6. Dependencies and Prerequisites
7. Implementation Guidelines
8. Troubleshooting and Error Handling

Focus on actionable technical insights for developers.`
}
```

## 🎨 **Advanced Customization Features**

### **1. Variable Substitution System**
```typescript
// Custom variables in prompts
userPrompt: `Analyze {filename} for {domain} insights.
Content: {content}
Custom focus: {customFocus}
Target audience: {targetAudience}`

// Variables filled automatically:
const variables = {
  content: "Document content...",
  filename: "Strategic Plan.pdf", 
  domain: "business",
  customFocus: "Market expansion",
  targetAudience: "Executive team"
}
```

### **2. Conditional Prompt Logic**
```typescript
// Template with conditional sections
userPrompt: `Analyze this {documentType} document: {filename}

${documentType === 'pdf' ? 'Focus on structured content analysis.' : ''}
${wordCount > 5000 ? 'Provide executive summary for lengthy document.' : ''}
${domain === 'appliance' ? 'Include Miele-specific market context.' : ''}

Content: {content}

Provide analysis appropriate for {domain} domain.`
```

### **3. Multi-Language Support**
```typescript
// Language-specific templates
const templates = {
  'en': {
    systemPrompt: "You are an expert analyst...",
    userPrompt: "Analyze this document..."
  },
  'de': {
    systemPrompt: "Sie sind ein Experte für Analyse...", 
    userPrompt: "Analysieren Sie dieses Dokument..."
  }
}
```

## 🔄 **Testing Custom Prompts**

### **1. Upload Test Document**
1. Upload a sample document to RAG system
2. Select your custom template from dropdown
3. Review AI analysis results
4. Iterate on prompt based on output quality

### **2. A/B Testing**
```typescript
// Compare different prompts
const promptA = "Analyze this document for business insights..."
const promptB = "Provide strategic analysis of this document..."

// Test both and measure:
// - Response relevance
// - Insight quality  
// - Actionability of recommendations
```

### **3. Prompt Performance Metrics**
```typescript
// Track prompt effectiveness
{
  templateId: "custom-business-analysis",
  avgConfidence: 0.92,
  insightQuality: "high",
  userSatisfaction: 4.5,
  responseTime: 3.2
}
```

## 📍 **File Locations Summary**

| Component | File Location | Purpose |
|-----------|---------------|---------|
| **Main Templates** | `src/contexts/PromptTemplateContext.tsx` | Primary template management |
| **Enhanced Processing** | `src/rag/utils/enhanced-document-processing.ts` | AI analysis integration |
| **UI Settings** | `src/rag/components/rag-view.tsx` | Settings tab interface |
| **Template Types** | `src/rag/types/index.ts` | TypeScript interfaces |
| **Default Templates** | `src/contexts/PromptTemplateContext.tsx` (lines 44-200) | Built-in templates |

## 🚀 **Quick Start: Custom Prompt Creation**

```typescript
// 1. Access prompt templates
const { createTemplate } = usePromptTemplates()

// 2. Define your custom template
const myTemplate = {
  name: "My Custom Analysis",
  domain: "business",
  systemPrompt: "You are a specialist in...",
  userPrompt: "Analyze {content} focusing on...",
  description: "Custom analysis for specific needs",
  variables: ['{content}', '{filename}'],
  isDefault: false,
  isActive: true
}

// 3. Create the template
createTemplate(myTemplate)

// 4. Use in document processing
// Template will appear in domain dropdown automatically
```

The prompt customization system is fully functional and ready for use! 🎉
