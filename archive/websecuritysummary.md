
---

# 🔒 SilentStacks v2.0 – Security Explained Simply

SilentStacks was built to be **safe by design**. Here’s what that means in everyday terms:

---

## 🧹 Cleaning What People Type In

* When someone enters information (like a PubMed ID or a DOI), the system **scrubs it clean first**.
* This prevents sneaky tricks where someone tries to slip in hidden code.
* Think of it like washing your hands before handling food — only clean inputs are allowed.

---

## 🚧 Guard Rails Around Online Lookups

* When SilentStacks talks to external databases (PubMed, CrossRef, ClinicalTrials.gov), it **packages the request carefully** so only the right kind of information goes out.
* This stops attackers from “injecting” extra commands into those requests.
* It’s like sending a form in a sealed envelope instead of scribbling notes in the margins.

---

## 🛑 Blocking Dangerous Links

* If SilentStacks creates a link (like to a DOI), it makes sure it’s safe to click.
* **No hidden tricks** like “javascript:” or “data:” links that could hijack your browser.
* Only real, verified web addresses are allowed.

---

## 🧱 Strong Safety Net in the Browser

* The app tells your browser: *“Only run code from me, and only connect to these specific trusted sites.”*
* This is called a **Content Security Policy (CSP)**.
* Imagine if a restaurant’s kitchen only let in ingredients from approved suppliers — same idea.

---

## 📦 Safe Storage of Data

* SilentStacks saves information in your browser (like your requests).
* Before saving, it **cleans the data** so nothing harmful gets stored.
* It **never uses cookies** (which can leak data) — all info stays local, on your machine.

---

## ⏱️ Slow & Steady with External Databases

* To avoid overwhelming PubMed or CrossRef, SilentStacks only makes **2 lookups per second**.
* This is like having a speed limit — keeps traffic flowing smoothly without triggering alarms.

---

## 🛡️ What’s Missing (on Purpose)

* No passwords to steal (the app doesn’t use them).
* No databases to hack (it doesn’t run on a server).
* No sensitive cookies or hidden tracking.

By **not having these weak points at all**, SilentStacks is safer than most web apps by default.

---

## 🧪 How We Double-Check Safety

* SilentStacks comes with a built-in **security check**.
* Run it in the console, and it tests **9 different protections**.
* Current build: **all 9 passed** ✅.

---

### 🔑 The Big Picture

SilentStacks keeps things safe by:

* **Cleaning everything** people type.
* **Only talking** to trusted databases.
* **Blocking unsafe links**.
* **Locking down the browser** to its own code.
* **Storing data locally, cleanly, and safely**.

It’s like having a building with **locked doors, clean hallways, and guards at every entry point** — simple, strong, and no unnecessary weak spots.

---
