Perfect — here’s the ready-to-drop **Prompt Card** in Markdown. Save this as

```
docs/utilities/Prompt_Failure_Extraction.md
```

and you’ll always have it at hand.

---

# SilentStacks — Prompt Card for Failure Extraction

> **Purpose:** Use this prompt whenever uploading multiple chat transcripts. It will extract **P0 Failures, Canonical Updates, Major Decisions, and Systemic Events** into one clean `.md` file.

---

## 📌 Prompt

**Instruction:**
You are an auditor for SilentStacks. Given the following chat transcripts, extract *all relevant P0 failures, corrective actions, canonical updates, and key decisions*. Normalize them into a single Markdown file with the following structure:

---

### SilentStacks Failure Records (Session Extraction)

#### 1. Major Decisions Made

* List each decision with timestamp, description, and context.

#### 2. P0 Failures

* Present in a table:

\| Timestamp | Failure | Root Cause | Corrective Action | Evidence Snippet |

#### 3. Canonical Updates

* Present in a table:

\| Timestamp | Canonical Update | Trigger/Context | Evidence Snippet |

#### 4. Catastrophic / Systemic Events (if any)

* Timeline format:

\| Time/Phase | Event | Impact | Action Taken |

#### 5. Summary

* 2–3 paragraphs summarizing:

  * Nature of failures (production vs. modeling).
  * Impact on v2.0 vs v2.1.
  * Outcomes (policy changes, canon updates, recovery actions).

---

## ⚖️ Rules

1. **Always datestamp entries** if explicit, or approximate from chat metadata.
2. If failure data is incomplete, explicitly note: *“Unrecoverable due to deleted chat.”*
3. Keep canonical updates separate from failure logs.
4. Final output must be **one coherent `.md` file** with proper headings.
5. No placeholders — always include **evidence snippets** where possible.
6. Designed to handle **4–5 chat transcripts in one pass**.

---

✅ **Usage:**

1. Upload your chat transcripts (`Chat1.txt`, `Chat2.txt`, …).
2. Paste the **Prompt Card text** into ChatGPT along with the files.
3. Output will be a consolidated `SilentStacks_Failure_Records.md`.
4. Store in `docs/failures/`.

---

Would you like me to also prepare a **companion Prompt Card for Canonical Updates only** (so you can run that in parallel and maintain `Canon_Updates.md` cleanly)?

