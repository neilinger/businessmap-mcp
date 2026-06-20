# businessmap-mcp

An MCP server that wraps the BusinessMap/Kanbanize REST API and exposes its capabilities as callable Tools for LLMs.

## Language

### BusinessMap domain

**Card**:
The unit of work. The structural, API-level term for any item on a Board, regardless of its semantic role (initiative-type or task-type workflow). Use "Card" in all contexts.
_Avoid_: Task, Ticket, Item, Initiative Card, Task Card

**Workspace**:
Top-level organizational container. Holds one or more Boards.

**Board**:
Lives inside a Workspace. Contains one or more Workflows.

**Workflow**:
The state machine inside a Board that defines its Lanes, Columns, and valid transitions between them. Not a synonym for "process" or "sequence of steps".
_Avoid_: Process, Flow, State machine

**Lane**:
Horizontal swimlane inside a Workflow. Cards are placed in a Lane × Column position.
_Avoid_: Swimlane, Row, Track (unverified synonym — see open flags)

**Column**:
Vertical stage or step inside a Workflow.
_Avoid_: Stage, Step, State

**Acceptance Criterion** (plural: Acceptance Criteria):
A binary-testable end-state attached to a Card. The API calls these `subtasks`; the domain term is Acceptance Criterion.
_Avoid_: Subtask, Child card, Child ticket, Task

### MCP layer

**Tool**:
An MCP-callable function registered by this server and exposed to an LLM. The server's purpose is registering and exposing Tools.
_Avoid_: Function, Endpoint, Action, Command

**Tool Profile**:
The named tier (`minimal`, `standard`, `full`) that controls which Tools are registered at server startup. Configured via `BUSINESSMAP_TOOL_PROFILE`.
_Avoid_: Profile (alone — ambiguous), Tier, Plan

**Instance**:
A single BusinessMap deployment fronted by the MCP server. Multi-instance mode allows one server to manage multiple Instances simultaneously, each with its own credentials.
_Avoid_: Connection, Deployment, Tenant

## Open flags

- **Track**: `placement.track` appears in the card creation schema but is absent from client code (which uses `lane_id`). May be a legacy field, a sub-lane concept, or a cross-board feature. Needs verification against BusinessMap API documentation before canonizing.
