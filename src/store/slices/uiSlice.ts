import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// UI State Types
export interface UIState {
  // Navigation and layout
  activeTab: string
  sidebarCollapsed: boolean
  sidebarWidth: number
  
  // Modals and overlays
  modals: {
    documentUpload: boolean
    settings: boolean
    help: boolean
    confirmation: boolean
  }
  
  // Loading states
  globalLoading: boolean
  componentLoading: { [key: string]: boolean }
  
  // Notifications
  notifications: Notification[]
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  
  // Layout preferences
  layout: {
    showPreview: boolean
    previewPosition: 'right' | 'bottom'
    gridView: boolean
    compactMode: boolean
  }
  
  // Quick actions
  quickActions: {
    dragAndDrop: boolean
    bulkSelection: boolean
    quickSearch: boolean
  }
  
  // Error and confirmation states
  confirmationDialog: {
    open: boolean
    title: string
    message: string
    onConfirm: string | null // action type to dispatch
    onCancel: string | null // action type to dispatch
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  duration?: number // ms, null for persistent
  actions?: {
    label: string
    action: string // action type to dispatch
  }[]
}

const initialState: UIState = {
  // Navigation and layout
  activeTab: 'documents',
  sidebarCollapsed: false,
  sidebarWidth: 280,
  
  // Modals and overlays
  modals: {
    documentUpload: false,
    settings: false,
    help: false,
    confirmation: false
  },
  
  // Loading states
  globalLoading: false,
  componentLoading: {},
  
  // Notifications
  notifications: [],
  
  // Theme and appearance
  theme: 'system',
  fontSize: 'medium',
  
  // Layout preferences
  layout: {
    showPreview: true,
    previewPosition: 'right',
    gridView: false,
    compactMode: false
  },
  
  // Quick actions
  quickActions: {
    dragAndDrop: true,
    bulkSelection: true,
    quickSearch: true
  },
  
  // Error and confirmation states
  confirmationDialog: {
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  }
}

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation and tabs
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload
    },
    
    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = Math.max(200, Math.min(400, action.payload))
    },
    
    // Modal management
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true
    },
    
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false
      })
    },
    
    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload
    },
    
    setComponentLoading: (state, action: PayloadAction<{ component: string; loading: boolean }>) => {
      state.componentLoading[action.payload.component] = action.payload.loading
    },
    
    clearComponentLoading: (state, action: PayloadAction<string>) => {
      delete state.componentLoading[action.payload]
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString()
      }
      state.notifications.push(notification)
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    
    clearAllNotifications: (state) => {
      state.notifications = []
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload
    },
    
    setFontSize: (state, action: PayloadAction<UIState['fontSize']>) => {
      state.fontSize = action.payload
    },
    
    // Layout preferences
    setLayout: (state, action: PayloadAction<Partial<UIState['layout']>>) => {
      state.layout = { ...state.layout, ...action.payload }
    },
    
    togglePreview: (state) => {
      state.layout.showPreview = !state.layout.showPreview
    },
    
    toggleGridView: (state) => {
      state.layout.gridView = !state.layout.gridView
    },
    
    toggleCompactMode: (state) => {
      state.layout.compactMode = !state.layout.compactMode
    },
    
    // Quick actions
    setQuickActions: (state, action: PayloadAction<Partial<UIState['quickActions']>>) => {
      state.quickActions = { ...state.quickActions, ...action.payload }
    },
    
    // Confirmation dialog
    showConfirmationDialog: (state, action: PayloadAction<{
      title: string
      message: string
      onConfirm?: string
      onCancel?: string
    }>) => {
      state.confirmationDialog = {
        open: true,
        title: action.payload.title,
        message: action.payload.message,
        onConfirm: action.payload.onConfirm || null,
        onCancel: action.payload.onCancel || null
      }
    },
    
    hideConfirmationDialog: (state) => {
      state.confirmationDialog.open = false
    },
    
    // Bulk UI updates for performance
    updateUIState: (state, action: PayloadAction<Partial<UIState>>) => {
      return { ...state, ...action.payload }
    },
    
    // Reset to defaults
    resetUIToDefaults: () => initialState
  }
})

// Export actions
export const {
  setActiveTab,
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarWidth,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalLoading,
  setComponentLoading,
  clearComponentLoading,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  setFontSize,
  setLayout,
  togglePreview,
  toggleGridView,
  toggleCompactMode,
  setQuickActions,
  showConfirmationDialog,
  hideConfirmationDialog,
  updateUIState,
  resetUIToDefaults
} = uiSlice.actions

// Selectors
export const selectActiveTab = (state: { ui: UIState }) => state.ui.activeTab
export const selectSidebarState = (state: { ui: UIState }) => ({
  collapsed: state.ui.sidebarCollapsed,
  width: state.ui.sidebarWidth
})
export const selectModals = (state: { ui: UIState }) => state.ui.modals
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading
export const selectComponentLoading = (state: { ui: UIState }) => state.ui.componentLoading
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications
export const selectTheme = (state: { ui: UIState }) => state.ui.theme
export const selectLayout = (state: { ui: UIState }) => state.ui.layout
export const selectQuickActions = (state: { ui: UIState }) => state.ui.quickActions
export const selectConfirmationDialog = (state: { ui: UIState }) => state.ui.confirmationDialog

// Export reducer
export default uiSlice.reducer
