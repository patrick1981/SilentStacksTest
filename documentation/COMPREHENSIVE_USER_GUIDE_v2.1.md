# SilentStacks Comprehensive User Guide v2.1
**Run date:** 2025-08-20  
**Status:** Living Document — simplified for all users (ages 8–80).

---

# Table of Contents
1. [What SilentStacks Is](#what-silentstacks-is)  
2. [Before You Start](#before-you-start)  
3. [How to Set Up](#how-to-set-up)  
   - GitHub Pages  
   - Thumbdrive  
   - Desktop  
4. [How to Add Requests](#how-to-add-requests)  
5. [How to Use Bulk Operations](#how-to-use-bulk-operations)  
6. [How to Export and Re-Import](#how-to-export-and-re-import)  
7. [Accessibility Notes](#accessibility-notes)  
8. [Safety & Security](#safety--security)  
9. [Worst-Case Scenarios](#worst-case-scenarios)  
10. [Help & Support](#help--support)  

---

## What SilentStacks Is
SilentStacks is a librarian tool for tracking articles, books, and clinical trials.  
It works **without internet** and runs from a webpage — anywhere.  

---

## Before You Start
- You need a **web browser** (Chrome, Edge, Firefox, Safari).  
- You do **not** need Python, command line, or coding.  
- Choose where to run: GitHub Pages, thumbdrive, or desktop.  

---

## How to Set Up
### GitHub Pages
1. Create a GitHub account at [github.com](https://github.com).  
2. Click **New Repository** → name it `silentstacks`.  
3. Upload all SilentStacks files into the repository.  
4. Go to **Settings → Pages**.  
5. Under “Build and deployment”, pick `main` branch and `/ (root)`.  
6. Save. Your site will appear at `https://yourname.github.io/silentstacks`.

### Thumbdrive
1. Copy the `SilentStacks` folder to a USB stick.  
2. Plug into any computer.  
3. Double-click `index.html`. SilentStacks opens in your browser.

### Desktop
1. Download the `SilentStacks` folder to your computer.  
2. Double-click `index.html`.  

---

## How to Add Requests
1. Open SilentStacks.  
2. Type or paste a **PMID, DOI, or title** into the Add Request form.  
3. Click **Look Up**.  
4. SilentStacks fills in details for you.  

---

## How to Use Bulk Operations
1. Go to **Bulk Upload**.  
2. Paste a list (PMIDs, DOIs, NCTs) **or** upload a CSV/TXT/JSON file.  
3. Click **Start**.  
4. Progress shows as rows are added.  
5. Errors are highlighted in red.  
6. Export “dirty only” to fix them later.

---

## How to Export and Re-Import
- Click **Export**. Choose:  
  - Clean Only (valid rows).  
  - Full (everything, errors marked “n/a”).  
- Save file.  
- To re-import: go back to Bulk Upload and select the file.

---

## Accessibility Notes
SilentStacks meets **WCAG 2.2 AAA**:  
- High-contrast text.  
- Fully keyboard usable.  
- Large, clear focus outlines.  
- Screen reader support.  

---

## Safety & Security
- SilentStacks **never uploads data** — stays on your device.  
- Protects against malicious inputs.  
- No accounts, no passwords, no timeouts.  

---

## Worst-Case Scenarios
- **Too many records:** >50k → rejected.  
- **No internet:** app keeps running; resumes later.  
- **Bad IDs:** errors highlighted; you can fix or export.  

---

## Help & Support
- Check the **Help button** in SilentStacks.  
- Read this guide.  
- Ask your librarian team lead if you need help.  
