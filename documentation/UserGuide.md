# SilentStacks v2.0 - User Guide

## Quick Start

### Installation
1. Download the SilentStacks v2.0 package
2. Extract to your preferred location (thumbdrive, local folder, etc.)
3. Open `index.html` in any modern browser
4. No internet required for basic functionality!

### First Steps
1. **Dashboard**: View your request statistics and recent activity
2. **Add Request**: Create new ILL requests with research intelligence
3. **Manage Requests**: View, edit, and track all requests
4. **Bulk Operations**: Import/export multiple requests at once

## Core Features

### Research Intelligence Lookup
Automatically populate citation details using:
- **PMID** (PubMed ID): 6-9 digit numbers
- **DOI**: Digital Object Identifiers (format: 10.xxxx/xxxxx)
- **NCT**: Clinical trial numbers (format: NCT00000000)

**Demo Data Available:**
- PMID: `18539917` - Hepatocellular carcinoma trial
- PMID: `23842776` - Single-cell RNA sequencing
- DOI: `10.1056/NEJMoa0803399`
- NCT: `NCT00048516`

### Adding Individual Requests

1. Navigate to **Add Request** tab
2. Enter any known identifier (PMID, DOI, or NCT)
3. Click **Lookup** to auto-populate fields
4. Fill in patron email and DOCLINE number
5. Set urgency level and fill status
6. Add any additional notes or tags
7. Click **Save Request**

### Managing Requests

**Table View:**
- Sort by any column (click column headers)
- Search across all fields
- Filter by status or urgency
- Bulk select for mass operations

**Card View:**
- Visual card layout for easier browsing
- All essential information at a glance
- Quick edit/delete actions

### Bulk Operations

**Import Methods:**
1. **Paste**: Copy/paste lists of PMIDs, DOIs, or NCTs
2. **File Upload**: Support for CSV, JSON, and TXT files

**CSV Import Features:**
- Automatic column detection
- Pre-populated bibliographic data support
- Smart data cleaning and validation
- Handles "dirty" data with value mapping

**Export Options:**
- **CSV**: Standard spreadsheet format
- **JSON**: Structured data export
- **NLM Citations**: Formatted citation export

### Workflow Management

Track requests through 4 stages:
1. **Order** - Initial request submitted
2. **Received** - Request acknowledged
3. **Processing** - Being fulfilled
4. **Completed** - Request fulfilled

### Search and Filtering

**Fuzzy Search:**
- Search across titles, authors, journals, patron emails
- Intelligent matching with scoring
- Real-time results as you type

**Advanced Filters:**
- Fill Status (Order, Received, Processing, Completed, Cancelled)
- Urgency Level (Low, Normal, High, Urgent)
- Date ranges
- Combine multiple filters

## Data Management

### DOCLINE Validation
- Real-time uniqueness checking
- Visual feedback (green = available, red = duplicate)
- Prevents duplicate DOCLINE numbers

### Data Quality
- Automatic validation of emails, PMIDs, DOIs, NCTs
- Data cleaning for author formatting
- Year range validation (1900-2030)
- Security checks for potentially malicious input

### Export and Backup
- **Backup Data**: Complete system backup as JSON
- **Export CSV**: Standard format for spreadsheets
- **Export JSON**: Technical data export
- **NLM Citations**: Formatted bibliography

## Customization

### Themes
- **Light**: Default bright theme
- **Dark**: Reduced eye strain for low-light environments
- **High Contrast**: Enhanced accessibility

### Settings
- API configuration for enhanced rate limits
- Email preferences for CrossRef integration
- Theme and display preferences

## Troubleshooting

### Common Issues

**"No valid identifiers found"**
- Check identifier format (PMID: 6-9 digits, DOI: starts with 10., NCT: starts with NCT)
- Ensure data is in correct format

**"Rate limit exceeded"**
- Wait 60 seconds before making more requests
- Consider adding NCBI API key in settings for higher limits

**"DOCLINE number already exists"**
- Each DOCLINE number must be unique
- Check existing requests or modify the number

**CSV Upload Issues**
- Ensure file is under 10MB
- Supported formats: .csv, .json, .txt
- Check for proper column headers

### Browser Compatibility
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required**: JavaScript enabled, LocalStorage available
- **Storage**: ~10MB recommended for optimal performance

### Performance Tips
- Clear browser cache if experiencing slowdowns
- Use "Validate Data Quality" to check for issues
- Limit bulk operations to under 500 items at once
- Export data regularly for backup

## Keyboard Shortcuts

- **Tab/Shift+Tab**: Navigate between fields
- **Enter**: Submit forms
- **Escape**: Cancel operations or close dialogs
- **Arrow Keys**: Navigate table rows (when table focused)

## Privacy and Security

- **Local Storage**: All data stored locally in your browser
- **No Cloud**: No data transmitted to external servers (except API lookups)
- **Input Validation**: All data sanitized and validated
- **Export Control**: You control all data exports and backups

## Support

For technical issues or questions:
1. Check this user guide
2. Review the troubleshooting section
3. Export your data as backup before making changes
4. Contact your system administrator

---

*SilentStacks v2.0 - Professional ILL Management System*
