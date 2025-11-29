import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import documentsReducer from './slices/documentsSlice'
import uiReducer from './slices/uiSlice'
import searchReducer from './slices/searchSlice'
import visualContentReducer from './slices/visualContentSlice'

// Configure the Redux store with all slices
export const store = configureStore({
  reducer: {
    documents: documentsReducer,
    ui: uiReducer,
    search: searchReducer,
    visualContent: visualContentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific action types that contain non-serializable data
        ignoredActions: [
          'documents/addDocument',
          'documents/updateDocument',
          'visualContent/addVisualContent',
        ],
        // Ignore specific paths in the state
        ignoredActionsPaths: ['payload.file', 'payload.data'],
        ignoredPaths: ['documents.items.file', 'visualContent.items.data'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Create typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Export store as default
export default store
