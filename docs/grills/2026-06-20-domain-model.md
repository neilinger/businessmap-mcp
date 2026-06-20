# Grill: Domain Model — businessmap-mcp

**Goal:** Build CONTEXT.md from scratch. Pin down canonical terms for the core domain concepts before any further architecture work.

## Open flags

## Log

### Q1 — CONTEXT.md structure

**Decision:** Two sections — one for BusinessMap entities (upstream API concepts), one for MCP-layer concepts this project invents (Tool, Profile, Instance). Keeps invented vocabulary distinct from wrapped upstream concepts.

### Q2 — Central entity

**Discovery:** "Card" is the API/structural term, but semantic meaning depends on the workflow type the card lives in:

- Card in an **initiative-type workflow** → semantically an "Initiative"
- Card in a **task-type workflow** → semantically a "Task"

Two distinct workflow types; workflow type is a property of the workflow (not the card itself).

### Q3 — Semantic card types

**Decision:** Stay with **Card** as the single canonical term. The Initiative/Task distinction (workflow-type-based semantics) is real but too complex to canonize in a flat glossary entry. "Card" covers all cases.

_Avoid_: Initiative Card, Task Card, Task (as synonym for Card), Ticket, Item

### Q4 — Workflow

**Decision:** **Workflow** = the BusinessMap state machine that defines a board's columns and valid transitions. Reserved exclusively for this. Never use "workflow" to mean a sequence of steps or a process.

_Avoid_: Process, Flow, State machine (as synonyms)

### Q5 — Container hierarchy

**Decision:** Full hierarchy: **Workspace → Board → Workflow → Lane → Column → Card**

- Workspace: top-level organizational container
- Board: lives in a Workspace; contains one or more Workflows
- Workflow: state machine inside a Board; defines Lanes and Columns
- Lane: horizontal swimlane inside a Workflow
- Column: vertical stage/step inside a Workflow
- Card: work item; positioned at the intersection of a Lane × Column within a Workflow

All six are canonical terms.

### Q6 — Subtask term

**Decision:** **Acceptance Criterion** (plural: Acceptance Criteria) — not "Subtask", "Child Card", or "Task". Binary-testable end-state attached to a Card. The API calls these `subtasks` but the domain term is Acceptance Criterion.

_Avoid_: Subtask, Child card, Child ticket

### Q7 — Track

**Open flag:** `placement.track` appears once in createCardSchema but is absent from client code (which uses `lane_id` only). Could be a legacy API field, a sub-lane concept, or a cross-board tracking feature. Needs verification against BusinessMap API docs before canonizing.

**Owner:** Neil to verify against BusinessMap API documentation.

### Q8 — Profile term

**Decision:** **Tool Profile** — the named tier (`minimal`, `standard`, `full`) that controls which Tools are registered at server startup. Configured via `BUSINESSMAP_TOOL_PROFILE`.

_Avoid_: Profile (alone — ambiguous), Tier, Plan

### Q9 — Instance term

**Decision:** **Instance** — a single BusinessMap deployment fronted by the MCP server. Multi-instance mode allows one server to manage multiple Instances simultaneously, each with its own credentials.

_Avoid_: Connection, Deployment, Tenant

### Q10 — Tool term

**Decision:** **Tool** (capital T) = an MCP-callable function registered by this server and exposed to an LLM. Worth defining explicitly — the server's entire purpose is registering and exposing Tools.

_Avoid_: Function, Endpoint, Action, Command

### Q11 — Remaining BusinessMap terms

**Decision:** Block, Card Link, Custom Field, Tag, Milestone are self-evident from context. No glossary entries needed.

### Final pass

**Decision:** CONTEXT.md is complete. Flight Level and Mutation not added — user confirmed nothing to add.

## Summary

CONTEXT.md created at repo root with 11 terms across two sections:

- **BusinessMap domain**: Card, Workspace, Board, Workflow, Lane, Column, Acceptance Criterion
- **MCP layer**: Tool, Tool Profile, Instance

**Open flags:** Track (needs API docs verification — owner: Neil)
