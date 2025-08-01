// SilentStacks Bulk Operations Module
// Handles import/export, bulk paste with API lookups, and batch operations
(() => {
  'use strict';

  // === Import/Export Functions ===
  function exportCSV() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      const headers = ['PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 'Status', 'Priority', 'Tags', 'Notes', 'Patron Email', 'Docline', 'Created'];
      
      const rows = requests.map(r => [
        r.pmid || '',
        r.doi || '',
        r.title || '',
        r.authors || '',
        r.journal || '',
        r.year || '',
        r.status || 'pending',
        r.priority || 'normal',
        (r.tags || []).join('; '),
        r.notes || '',
        r.patronEmail || '',
        r.docline || '',
        r.createdAt || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(blob, filename);
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Exported ${requests.length} requests to ${filename}`, 
        'success'
      );
      
    } catch (error) {
      console.error('CSV export error:', error);
      window.SilentStacks.modules.UIController.showNotification('Failed to export CSV', 'error');
    }
  }

  function exportJSON() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      const exportData = {
        version: window.SilentStacks.version,
        exportDate: new Date().toISOString(),
        totalRequests: requests.length,
        requests: requests
      };
