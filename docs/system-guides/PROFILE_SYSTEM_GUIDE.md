# 🎭 User Profile System

## Overview

The Profile System allows users to create multiple personalized AI assistant configurations, each with unique personalities, behaviors, and specializations. This enables tailored experiences for different use cases like business analysis, technical support, creative assistance, etc.

## 🚀 Features

### Multi-Profile Management
- **Create Multiple Profiles**: Set up different AI assistants for various purposes
- **Profile Templates**: Quick start with predefined templates (Business, Technical, Creative, Educational, Support)
- **Profile Switching**: Easily switch between profiles from the header
- **Profile Cloning**: Duplicate existing profiles for variations

### Customization Options
- **Basic Information**: Name, display name, description, chatbot name
- **Personality & Behavior**: Define AI personality traits and communication style
- **AI Prompts**: Custom system and context prompts for specific behaviors
- **Visual Identity**: Upload custom profile images
- **Specializations**: Tag profiles with specific expertise areas
- **Domains**: Categorize profiles by industry or use case

### Profile Analytics
- **Usage Tracking**: Messages sent, documents processed, last used
- **Performance Metrics**: Response times and interaction statistics
- **Profile Statistics**: Overview of all profiles and usage patterns

## 📁 File Structure

```
src/
├── types/
│   └── profile.ts                    # Profile type definitions and templates
├── utils/
│   └── profile-manager.ts            # Profile CRUD operations and management
├── components/
│   └── profile/
│       ├── ProfileLanding.tsx        # Profile selection interface
│       └── ProfileCreator.tsx        # Profile creation/editing form
├── app/
│   └── profiles/
│       └── page.tsx                  # Profile management page
└── components/
    └── header.tsx                    # Updated header with profile display
```

## 🎨 Profile Templates

### Built-in Templates

1. **Business Analyst** 📊
   - Professional, analytical, strategic
   - Focus: Business metrics, KPIs, market analysis
   - Specializations: Business Analysis, Market Research, Strategic Planning

2. **Technical Expert** ⚙️
   - Technical, precise, helpful
   - Focus: Code solutions, technical explanations, best practices
   - Specializations: Software Development, System Architecture, Code Review

3. **Creative Assistant** 🎨
   - Creative, inspiring, imaginative
   - Focus: Content creation, design, artistic expression
   - Specializations: Content Creation, Design Concepts, Creative Writing

4. **Research Scholar** 🎓
   - Academic, thorough, educational
   - Focus: Research assistance, educational content, citations
   - Specializations: Academic Research, Literature Review, Data Analysis

5. **Customer Support** 🤝
   - Friendly, helpful, empathetic
   - Focus: Customer service, issue resolution, user guidance
   - Specializations: Customer Service, Issue Resolution, Product Support

## 🔧 Usage Guide

### First Time Setup

1. **Access Profile System**
   - Navigate to `/profiles` or click "Switch Profile" in header
   - New users are automatically redirected to profile selection

2. **Create Your First Profile**
   - Click "Create New" button
   - Choose a template or start from scratch
   - Fill in basic information (name, display name, chatbot name)
   - Define personality and behavior
   - Set system and context prompts
   - Add specializations and domains
   - Save your profile

3. **Start Using Your Profile**
   - Profile is automatically activated upon creation
   - Dashboard updates to show your active profile
   - AI responses will follow your profile's configuration

### Managing Profiles

#### Creating New Profiles
```javascript
// Via Profile Manager
const newProfile = profileManager.createProfile({
  name: 'my-assistant',
  displayName: 'My Assistant',
  chatbotName: 'Alex',
  personality: 'Friendly and helpful',
  behavior: 'Provides detailed assistance',
  systemPrompt: 'You are a helpful AI assistant...',
  contextPrompt: 'Focus on being clear and concise...'
})
```

#### Switching Profiles
```javascript
// Set active profile
profileManager.setActiveProfile(profileId)

// Get active profile
const activeProfile = profileManager.getActiveProfile()
```

#### Updating Profiles
```javascript
// Update profile settings
profileManager.updateProfile(profileId, {
  personality: 'More analytical and data-driven',
  specializations: ['Data Analysis', 'Machine Learning']
})
```

### Profile Configuration

#### System Prompts
The system prompt defines the AI's core identity and behavior:
```
You are a professional business analyst AI assistant. You excel at analyzing business data, market trends, and providing strategic recommendations. Always provide well-structured, professional responses with actionable insights.
```

#### Context Prompts
The context prompt provides additional guidance for specific scenarios:
```
Focus on business metrics, KPIs, market analysis, and strategic planning. Use business terminology and provide concrete recommendations.
```

#### Personality Examples
- **Professional**: "Analytical, strategic, and results-oriented"
- **Friendly**: "Warm, approachable, and encouraging"
- **Technical**: "Precise, methodical, and detail-oriented"
- **Creative**: "Imaginative, innovative, and inspiring"

## 🛠️ Technical Implementation

### Profile Data Structure
```typescript
interface ChatbotProfile {
  id: string
  name: string                    // Internal identifier
  displayName: string             // User-friendly name
  description?: string            // Profile description
  createdAt: string
  lastModified: string
  
  // Chatbot Configuration
  chatbotName: string            // AI assistant name
  personality: string            // Personality description
  behavior: string               // Behavior guidelines
  systemPrompt: string           // Core AI instructions
  contextPrompt: string          // Additional context
  image?: string                 // Profile image (base64)
  
  // AI Settings
  temperature?: number           // Response creativity
  maxTokens?: number            // Response length limit
  model?: string                // AI model to use
  
  // Organization
  domains?: string[]            // Industry/domain tags
  specializations?: string[]    // Expertise areas
  
  // Analytics
  analytics?: {
    messagesCount: number
    documentsProcessed: number
    lastUsed: string
    averageResponseTime: number
  }
}
```

### Storage
- **LocalStorage**: Profile data stored in `rag_user_profiles` key
- **Active Profile**: Tracked in `rag_active_profile` key
- **Export/Import**: Profiles included in database export system

### Integration Points

#### Chat System
The active profile's configuration is automatically applied to:
- AI model selection
- System and context prompts
- Temperature and response settings
- Personality-based response styling

#### RAG Settings
Profile settings can influence:
- Search result prioritization
- Document processing preferences
- Analytics categorization
- Domain-specific keyword weighting

## 🎯 Use Cases

### Business Teams
- **Sales Profile**: Focused on lead generation and customer insights
- **Marketing Profile**: Creative content and campaign analysis
- **Finance Profile**: Financial modeling and budget analysis
- **HR Profile**: Employee relations and policy guidance

### Technical Teams
- **Developer Profile**: Code review and debugging assistance
- **DevOps Profile**: Infrastructure and deployment guidance
- **QA Profile**: Testing strategies and quality assurance
- **Security Profile**: Security analysis and threat assessment

### Personal Use
- **Learning Profile**: Educational content and skill development
- **Research Profile**: Academic research and citation help
- **Creative Profile**: Writing and creative project assistance
- **General Profile**: Daily tasks and general assistance

## 🔄 Profile Lifecycle

1. **Creation**
   - User selects template or creates custom profile
   - Required fields validated
   - Profile saved to localStorage
   - Analytics initialized

2. **Activation**
   - Profile set as active
   - Dashboard updates with profile branding
   - AI system loads profile configuration
   - Usage tracking begins

3. **Usage**
   - Chat interactions use profile prompts
   - Analytics updated with each interaction
   - Profile preferences applied to RAG searches
   - Document processing reflects profile focus

4. **Maintenance**
   - Users can edit profile settings
   - Analytics provide usage insights
   - Profiles can be cloned for variations
   - Export/import for backup and sharing

5. **Switching**
   - Users can switch between profiles
   - Previous profile deactivated
   - New profile configuration loaded
   - Context preserved where appropriate

## 🔐 Security & Privacy

- **Local Storage**: All profile data stored locally in browser
- **No Server Sync**: Profiles not transmitted to external servers
- **Export Control**: Users control data export and sharing
- **Image Handling**: Profile images stored as base64 strings locally

## 🚀 Future Enhancements

### Planned Features
- **Team Profiles**: Shared profiles for team collaboration
- **Profile Scheduling**: Automatic profile switching based on time/context
- **Advanced Analytics**: Detailed performance and usage insights
- **Profile Marketplace**: Community-shared profile templates
- **Voice Personalities**: Audio characteristics for voice interactions
- **Integration APIs**: External system profile synchronization

### Enhancement Ideas
- **Smart Suggestions**: AI-recommended profile optimizations
- **Usage Patterns**: Automatic profile switching based on patterns
- **Performance Tuning**: Auto-optimization based on user feedback
- **Multi-Modal**: Support for different interaction modalities
- **Collaboration**: Real-time profile sharing and editing

## 📋 Troubleshooting

### Common Issues

**Profile Not Loading**
- Check browser localStorage permissions
- Verify profile data integrity
- Clear and recreate profile if corrupted

**Settings Not Applied**
- Ensure profile is set as active
- Restart application to reload configuration
- Check for JavaScript console errors

**Performance Issues**
- Limit number of profiles (recommended < 20)
- Compress or remove large profile images
- Clean up unused profiles regularly

**Export/Import Problems**
- Verify JSON format integrity
- Check for special characters in profile data
- Ensure sufficient storage space

## 🆘 Support

For issues with the Profile System:

1. **Check Documentation**: Review this guide and inline help
2. **Browser Console**: Check for JavaScript errors
3. **Export Backup**: Create profile export before troubleshooting
4. **Reset Profiles**: Clear localStorage if data becomes corrupted
5. **Contact Support**: Report persistent issues with error details

---

*The Profile System enables personalized AI experiences tailored to your specific needs and workflows. Create profiles that match your working style and watch your AI assistant become more effective and aligned with your goals.*
