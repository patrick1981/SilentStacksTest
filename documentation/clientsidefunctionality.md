You’re exactly right — **SilentStacks is 100% client-side**. Let me reframe the security picture in that context, because it’s very different from a traditional server-based app.

---

# 🔒 SilentStacks Security in a Client-Side World

## 🌐 No Server = No Attack Surface

* SilentStacks doesn’t run on a remote server — it’s just an **HTML file + JS/CSS in your browser**.
* That means there’s **no database to hack**, **no user accounts to breach**, and **no passwords to steal**.

---

## 🛡️ What Actually Matters

### 1. Input Scrubbing

* Users can paste PMIDs, DOIs, NCT IDs, or even upload files.
* Every single one is **sanitized in the browser** before SilentStacks does anything with it.
* This stops cross-site scripting (XSS) and prevents malicious data from messing with the app.

### 2. Safe Output

* When SilentStacks shows results (titles, authors, links), it doesn’t just “dump” the raw text into the page.
* It uses **safe methods (like `textContent`)** so even if PubMed sent back weird text, it won’t execute as code.

### 3. Trusted Connections Only

* The app only connects out to:

  * **PubMed (NCBI)**
  * **CrossRef**
  * **ClinicalTrials.gov**
* Everything else is blocked by the browser’s **Content Security Policy (CSP)** — it literally tells your browser *“ignore any other source.”*

### 4. Local Storage

* Data never leaves your machine.
* SilentStacks saves requests **only in your browser’s local storage**.
* No cookies, no tracking, nothing phoning home.

### 5. Rate Limiting

* Even though it’s local, SilentStacks is polite when calling APIs — only **2 lookups per second**.
* Prevents you from being blocked by PubMed or CrossRef if you paste a giant list.

---

## 🧾 Why This Matters for You

Because SilentStacks is **static, client-side software**, the main risks are:

* **Bad input** → solved by sanitization.
* **Untrusted output** → solved by safe rendering.
* **Malicious links** → solved by CSP + validation.

Everything else (SQL injection, CSRF, server exploits) simply doesn’t exist here — there’s no backend to attack.

---

👉 So, in layman’s terms: SilentStacks is basically a **secure kiosk app** that runs in your browser.

* Nothing sensitive leaves your device.
* It only talks to 3 safe research databases.
* It scrubs everything before showing or saving it.

---

