# Database Export/Import System

## Overview

The RAG Dashboard Database Export/Import system allows you to completely transfer your database between machines, including:

- 📄 **Documents & Files**: All uploaded documents and processed content
- 🔍 **Search History**: Your search queries and results
- 📊 **Analytics Data**: Usage statistics and performance metrics  
- ⚙️ **User Settings**: Preferences, configurations, and customizations
- 🗂️ **File Storage**: Large files stored in IndexedDB
- 🧠 **Vector Embeddings**: AI-generated document embeddings

## 🚀 Quick Start

### Export Your Database

1. **Open Dashboard**: Navigate to your RAG dashboard
2. **Go to Database Tab**: Click the "Database" button in the top navigation
3. **Configure Export**:
   - ✅ Check what data to include (Documents, Analytics, History, Settings)
   - 📦 Choose compression level (None/Standard/Maximum)
4. **Click Export**: Download will start automatically
5. **Save File**: Keep the exported JSON file safe

### Import to New Machine

1. **Setup Dashboard**: Install and run the dashboard on the new machine
2. **Go to Database Tab**: Navigate to Database management
3. **Configure Import**:
   - ✅ Choose import options (Overwrite/Skip duplicates/Preserve settings)
   - 🔍 Enable data validation (recommended)
4. **Select File**: Click the upload area and choose your export file
5. **Wait for Import**: Page will refresh when complete

## 📁 What Gets Exported

### LocalStorage Data
- `rag_documents`: Document metadata and small content
- `rag_search_history`: Search queries and results
- `rag_analytics`: Usage statistics and metrics
- `rag_settings`: User preferences and configurations
- `rag_visual_content`: Visual content processing data
- `enhanced-file-storage`: Enhanced file storage registry
- `batch_job_*`: Batch processing job data

### IndexedDB Data
- `RAGDatabase`: Main RAG database with embeddings
- `enhanced-file-storage`: Large file content storage
- `file-storage-db`: Additional file storage

### Configuration Data
- System settings and environment configuration
- Machine identification and metadata
- Export timestamp and version information

## 🔧 Export Options

### Include Data Types
- **Documents & Files**: All uploaded content and metadata
- **Analytics Data**: Usage statistics and performance metrics
- **Search History**: Previous searches and results
- **User Settings**: Preferences and configurations

### Compression Levels
- **None**: Fastest export, larger file size
- **Standard**: Balanced compression and speed (recommended)
- **Maximum**: Smallest file size, slower processing

## ⚙️ Import Options

### Data Handling
- **Overwrite Existing**: Replace existing data with imported data
- **Skip Duplicates**: Keep existing data, only add new items
- **Preserve Settings**: Keep current settings, don't import settings
- **Validate Data**: Check data integrity before import (recommended)

## 🛡️ Safety Features

### Automatic Backup
- Creates backup before import
- Restores on import failure
- Cleanup after successful import

### Data Validation
- Checks export file format
- Validates data structure
- Reports missing or corrupted data
- Version compatibility warnings

### Error Handling
- Graceful failure recovery
- Detailed error messages
- Import progress tracking
- Rollback on failure

## 📊 Database Management Tools

### Storage Overview
- **Local Storage**: Usage, available space, key count
- **IndexedDB**: Database list, estimated size
- **Data Summary**: Document, file, and analytics counts

### Maintenance Operations
- **Clear Documents**: Remove all document data
- **Clear Analytics**: Remove usage statistics
- **Clear History**: Remove search history
- **Clear All Data**: Complete database reset

## 🖥️ Command Line Usage

### Quick Export Template
```bash
node scripts/quick-export.js
```

This creates an export template showing the format, but actual data export requires the web interface due to browser storage security.

## 📋 File Format

### Export File Structure
```json
{
  "version": "1.0.0",
  "timestamp": "2025-08-16T18:30:00.000Z",
  "machine": "machine_identifier",
  "data": {
    "localStorage": {
      "key": "value"
    },
    "indexedDB": {
      "database": {
        "store": [{"data": "objects"}]
      }
    },
    "configuration": {
      "system": "config"
    }
  },
  "metadata": {
    "totalSize": 12345,
    "fileCount": 10,
    "documentCount": 5,
    "features": ["Analytics", "Search History"]
  }
}
```

## 🔍 Troubleshooting

### Export Issues
- **Large Database**: Use Maximum compression for very large databases
- **Memory Issues**: Close other browser tabs during export
- **Storage Full**: Clear some data before export

### Import Issues
- **Version Mismatch**: Check export version compatibility
- **Corrupted File**: Re-export from source machine
- **Import Fails**: Check browser console for detailed errors

### Network Transfer
- **Large Files**: Consider cloud storage for very large exports
- **File Corruption**: Verify file integrity after transfer
- **Network Issues**: Use reliable file transfer methods

## ⚡ Performance Tips

### For Large Databases
1. **Export during low usage**: Better performance when system is idle
2. **Use compression**: Reduces file size significantly
3. **Close other tabs**: Frees up browser memory
4. **Stable connection**: Ensure reliable internet for cloud transfers

### For Better Imports
1. **Fresh browser session**: Restart browser before large imports
2. **Disable extensions**: Temporary disable browser extensions
3. **Clear cache**: Clear browser cache before import
4. **Monitor progress**: Watch for error messages during import

## 🔐 Security Considerations

### Data Privacy
- Export files contain all your data
- Store export files securely
- Use encrypted storage for sensitive data
- Delete export files after use

### Transfer Security
- Use secure file transfer methods
- Verify file integrity after transfer
- Consider encryption for sensitive data
- Don't transfer over unsecured networks

## 🆘 Support

### Getting Help
1. **Check Console**: Browser developer console shows detailed errors
2. **Check Storage**: Database tab shows current storage status
3. **Test Export**: Try with smaller dataset first
4. **Network Debug**: Use network tab for debugging if included

### Common Solutions
- **Refresh Browser**: Restart browser and try again
- **Clear Cache**: Clear browser cache and cookies
- **Check Space**: Ensure sufficient storage space
- **Update Browser**: Use latest browser version

## 📈 Version History

### v1.0.0 (Current)
- Complete database export/import
- Multiple compression levels
- Data validation and backup
- Web-based management interface
- Safety features and error handling

---

**Note**: This system provides comprehensive database portability for your RAG dashboard. Always test with smaller datasets first and maintain regular backups of your important data.
