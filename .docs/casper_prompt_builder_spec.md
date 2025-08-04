# 📄 Casper Prompt Builder — Functional Specification

## 🛍 Overview

The Prompt Builder is a new full-page experience within the Casper application that allows users to generate high-quality prompts using OpenAI's API. Users can describe their goal, choose output formatting, answer clarifying questions, and generate a ready-to-use AI prompt which can be saved directly into the Prompt Library.

---

## 🌟 Core Goals

- Help users generate high-quality, reusable prompts by simply describing what they want.
- Guide users through a structured, low-friction wizard with optional AI follow-up questions.
- Provide clear, formatted output with options to edit, regenerate, or save.
- Integrate seamlessly with the existing Prompt Library infrastructure.
- Use progressive disclosure and animation to make the process feel dynamic, transparent, and collaborative.

---

## 🧱 Page Structure

### Route

`/prompt-builder`

### Initial Layout (Landing State)

- Centered, **ChatGPT-style input box** (not full-width)
- Below the input box:
  - Example pills (click-to-fill suggestions)
  - Dropdown multi-selects for:
    - Input Type
    - Output Format
    - Constraints
    - Tone
- Overall layout is minimal and balanced to avoid visual clutter

### Active Layout (Prompt Building State)

| Left (Wizard Panel)                         | Right (Output Panel)                    |
| ------------------------------------------- | --------------------------------------- |
| Summary of user-defined intent and settings | Live preview of prompt output           |
| Follow-up questions modal (if needed)       | Controls (Edit, Copy, Regenerate, Save) |

**Transition:** On form submission, animate from centered landing UI to a split-pane layout with fade/slide. Add a sense of active progress and flow.

---

## 🧹 UI Flow

### 1. Goal Entry

- **Input**: Freeform text: *"What do you want this prompt to help you do?"*
- **Examples**: Click-to-fill suggestions: *"Summarize a blog post"*, *"Rewrite an email"*
- Stored as `goal`

### 2. Input Details

- **Input Type** (dropdown multi-select):
  - Pasted Text, Code File, Screenshot, JSON, Spreadsheet, None
- **Optional Input Description**: Freeform text (e.g., *"\~1000 word blog post"*)

### 3. Output Format

- **Output Type** (dropdown multi-select): Markdown, JSON, Plain Text, Table, Bullet Points
- **Optional Output Description**: Freeform text (e.g., *"Summary with 3 bullet points"*)

### 4. Optional Enhancements

- **Constraints** (dropdown multi-select): Max word count, Avoid phrases, Include examples, Use headers, etc.
- **Tone** (dropdown): Friendly, Formal, Instructional, Creative, etc.
- **Tags** (optional): Writing, Debugging, Planning, etc.

### 5. AI Follow-Up (Conditional)

- After user inputs all metadata, API sends initial request to LLM to assess sufficiency.
- If vague, LLM returns up to 5 follow-up questions.

#### Follow-Up UI

- Displayed in a stylized modal or container component **below the summary**
- All follow-up questions shown at once
- Each question has a textarea input underneath
- Final button: `Submit Answers`
- After submission:
  - Modal closes
  - Live preview panel shows loading shimmer
  - Regenerates prompt using all metadata + follow-up answers

### 6. Final Prompt Output

- Result shown in live preview panel
- Actions:
  - **Edit**: Opens inline editor
  - **Regenerate**: Re-submits all data + answers
  - **Improve**: Kicks off new follow-up loop
  - **Copy to clipboard**
  - **Save to Library**: Triggers Save Prompt modal

---

## ⚙️ Backend & API Integration

### System Prompt (for OpenAI)

You are a world-class AI prompt engineer helping users write effective prompts. Based on the provided goal and formatting options, generate a clean, usable prompt. Ask clarifying questions if needed (up to 5 max). Always return only the prompt text.

### API Flow

#### Endpoint: `POST /api/prompt-builder/generate`

- Input payload:

```json
{
  "goal": "...",
  "input_type": ["..."],
  "input_description": "...",
  "output_format": "...",
  "output_description": "...",
  "constraints": ["..."],
  "tone": "...",
  "clarifications": ["..."]
}
```

- Output:

```json
{
  "prompt": "Final generated prompt string"
}
```

#### Endpoint: `POST /api/prompt-builder/followups`

- Same input as above (minus clarifications)
- Output:

```json
{
  "followup_questions": ["What is the expected structure?", "Who is the end user?", ...]
}
```

---

## 🛠️ Database Updates

No schema changes needed. All saved prompts will use existing `prompts` table with:

- `title`, `description`, `body`, `tags[]`, `created_by`

Clarifications and builder metadata are ephemeral — used only for generation, not persisted unless saved by user.

---

## 🎨 UX Considerations

- **Landing state** uses a centered, minimal ChatGPT-like layout with floating textarea
- **Dropdown multi-selects** keep the UI compact and clean
- **Smooth transition** (Framer Motion) to wizard layout after prompt submission
- **Follow-up modal** appears below summary, animating in with context
- **Live preview** shimmer while loading
- **Progressively disclose** steps to make user feel guided but in control
- **Display summary of intent/settings** in left pane for transparency
- **Error handling** for API failures
- **Toast feedback** for save success/failure

---

## 🚀 Implementation Plan

### Phase 1: Setup & Routing

-

### Phase 2: Wizard UI

-

### Phase 3: API & Edge Functions

-

### Phase 4: Prompt Library Integration

-

### Phase 5: Polish & QA

-

---

## 🧠 Future Enhancements

- Prompt testing + simulation inline
- GitHub sync for saved prompts
- Share/collaborate on prompt templates
- Prompt version history / changelog
- AI-assist for editing or combining prompts

---

Let me know when you’re ready to move into the implementation phase and I can help scaffold the code or generate Lovable prompts for each section.

