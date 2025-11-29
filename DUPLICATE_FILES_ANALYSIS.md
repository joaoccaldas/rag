# 🗂️ DUPLICATE FILE CLEANUP ANALYSIS

## **CRITICAL FINDING: Dual App Structure**

**Problem**: Next.js 13+ App Router is using `app/` directory, but we also have `src/app/` directory with duplicate implementations.

**Active Directory**: `app/` (✅ Being used by Next.js)
**Duplicate Directory**: `src/app/` (❌ Not being used, contains duplicates)

## **FILES SAFE TO DELETE:**

### **1. Main Page Duplicates**
- ✅ **KEEP**: `app/page.tsx` (has profile integration)
- ❌ **DELETE**: `src/app/page.tsx` (duplicate, not being used)

### **2. Route Duplicates**
- ❌ **DELETE**: `src/app/test/page.tsx` (duplicate of `app/test/page.tsx`)
- ❌ **DELETE**: `src/app/upload-demo/page.tsx` (duplicate of `app/upload-demo/page.tsx`)
- ❌ **DELETE**: `src/app/analytics-demo/page.tsx` (duplicate of `app/analytics-demo/page.tsx`)

### **3. Specialized Pages (Keep - No Duplicates)**
- ✅ **KEEP**: `src/app/database/page.tsx` (unique functionality)
- ✅ **KEEP**: `src/app/profiles/page.tsx` (unique functionality)
- ✅ **KEEP**: `src/app/financial-modeling/page.tsx` (unique functionality)
- ✅ **KEEP**: `src/app/enhanced-*/page.tsx` (unique demos)

## **CONTEXT DUPLICATES ANALYSIS:**

### **Multiple Instances Found:**
```
src/contexts/SettingsContext.tsx (appears 2x in search)
src/contexts/PromptTemplateContext.tsx (appears 2x in search)
src/contexts/ErrorContext.tsx (appears 2x in search)
src/rag/contexts/*.tsx (multiple appears 2x in search)
```

**Investigation Needed**: These might be search artifacts or actual duplicates.

## **RECOMMENDED ACTION PLAN:**

### **Phase 1: Remove Confirmed Duplicates** ✅ SAFE
1. Delete `src/app/page.tsx` (main page duplicate)
2. Delete `src/app/test/page.tsx` (test route duplicate)
3. Delete `src/app/upload-demo/page.tsx` (demo route duplicate)
4. Delete `src/app/analytics-demo/page.tsx` (demo route duplicate)

### **Phase 2: Profile System Consolidation** ⚠️ CAREFUL
- **Keep**: All profile files in `src/components/profile/` (active implementation)
- **Keep**: All profile utilities in `src/utils/profile*` (active implementation)
- **Keep**: All profile types in `src/types/profile.ts` (active implementation)

### **Phase 3: Context Investigation** 🔍 INVESTIGATE
- Check for actual duplicate context files
- Verify no circular imports or conflicts

## **CURRENT STATUS:**
- ✅ **Main Issues Resolved**: Header branding + Profile system working
- ✅ **API Routes**: Created ollama-proxy and profiles routes
- 🔄 **In Progress**: Duplicate cleanup and styling improvements
- ⚠️ **Next**: Ollama service configuration

**SAFETY**: All recommended deletions are confirmed safe as they're not in the active `app/` directory being used by Next.js.
