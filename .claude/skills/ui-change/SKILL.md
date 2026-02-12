---
name: ui-change
description: "Front-load design alignment before implementing UI changes. Use when modifying existing components, redesigning pages, or refining visual styles. Auto-invoke when the user mentions 'redesign', 'restyle', 'refine the UI', 'update the layout', 'make it look', or 'visual changes'."
---

# UI Change Alignment Skill

Before writing ANY code for a UI change, you MUST complete this alignment step.

## Step 1: Read Current State
- Read the target component and all related style/layout files
- Identify the current visual structure, layout paradigm, and design patterns

## Step 2: Propose Changes
Present a structured proposal to the user:

**KEEPING UNCHANGED:**
- [List every existing UI/layout element that will remain as-is]
- [Be specific: "vertical sidebar navigation", "text-based logo at 24px", "ambient glass-morphism background"]

**MODIFYING:**
- [List specific elements being changed and how]
- [Example: "Increasing logo font-size from 18px to 24px"]

**ADDING:**
- [List any new elements]

**STRUCTURAL CHANGES:**
- [Any changes to component hierarchy, layout direction, or positioning]
- [If none: "No structural changes — layout paradigm stays the same"]

## Step 3: STOP
**Wait for the user's explicit approval before writing any code.**

## Step 4: Implement
After approval, implement only the approved changes. If you find yourself wanting to change something not in the approved list, STOP and ask first.

## Critical Rules
- NEVER replace existing layout paradigms without explicit approval
- NEVER swap text logos for image logos unless specifically asked
- NEVER change background transparency/opacity approaches unless specifically asked
- NEVER convert vertical layouts to horizontal (or vice versa) unless specifically asked
- When in doubt about a visual direction, ASK rather than guess
