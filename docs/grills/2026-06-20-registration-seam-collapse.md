# Grill: Collapse the Registration Seam into One Module

**Topic:** Candidate 1 from architecture review — replace 84 scattered `shouldRegisterTool()` guards with a `ToolRegistrar` module  
**Goal:** Reach a shared, contradiction-free design for the deepened module — interface, seam placement, how handlers change, test strategy  
**Context:** The businessmap-mcp server registers 65 MCP tools across 10 handler files; each handler manually gates every tool with `shouldRegisterTool(name, enabledTools?)` and a separate `!readOnlyMode` check; these 84 guards + 41 read-only checks are spread across 10 files

## Open flags

_(none yet)_

## Log

### Q1 — Registrar placement

**Decision:** Option A — `ToolRegistrar` wraps `McpServer.registerTool()`. Handlers receive a `ToolRegistrar` instead of `(server, clientOrFactory, readOnlyMode, enabledTools)` and call `registrar.register(name, schema, impl)`. Filtering (profile gate + read-only gate) happens transparently inside the registrar.

### Q2 — Mutation knowledge source

**Decision:** A2 — central mutation set in `tool-profiles.ts` alongside the profile arrays. A `MUTATIONS: Set<ToolName>` (or similar) lists all write tools. The registrar checks this set internally; handlers never mention `readOnlyMode` at all.

### Q3 — ToolRegistrar constructor input

**Decision:** B1 — `new ToolRegistrar(server: McpServer, enabledTools: string[], readOnly: boolean)`. Profile resolution (`getToolsForProfile()`) stays in `mcp-server.ts`. The registrar receives an already-resolved tool name list. It imports only the mutation set from `tool-profiles.ts`.

### Q4 — Scope boundary with Candidate 2

**Decision:** C1 — strict scope. `registerTools(registrar: ToolRegistrar, clientOrFactory: BM | BMF)`. The union type stays in the method signature; Candidate 2 will fix it properly with a `clientResolver` closure. Moving `clientOrFactory` to the constructor now would create an intermediate state that doesn't fully solve Candidate 2.

### Q5 — Empty enabledTools semantics

**Decision:** D2 — kill the `enabledTools = []` invariant at source. The error fallback in `mcp-server.ts` becomes `getToolsForProfile('full')`. The registrar receives a non-empty list; empty array means "no tools" (natural semantics). The `shouldRegisterTool()` undefined/empty-array compat hack is eliminated.

### Q5 — Empty enabledTools semantics

**Decision:** D2 — kill the `enabledTools = []` invariant at source. The error fallback in `mcp-server.ts` becomes `getToolsForProfile('full')`. The registrar receives a non-empty list; empty array means "no tools" (natural semantics). The `shouldRegisterTool()` undefined/empty-array compat hack is eliminated.

### Q6 — ToolRegistrar method name

**Decision:** E1 — same name as McpServer: `registrar.registerTool(name, config, handler)`. Migration in handlers is purely mechanical (swap type annotation, remove if-guards). No new method-name vocabulary.

### Q7 — shouldRegisterTool() fate

**Decision:** F1 — delete from `base-tool.ts` in this PR. It's dead code after the migration; leaving it misleads future readers and Candidate 3 is about dissolving the module, not cleaning dead exports.

### Q8 — ToolRegistrar file location

**Decision:** G2 — `src/server/tool-registrar.ts`. Server-level concern (wraps McpServer); handlers receive it as a dependency, don't own it. Same tier as `mcp-server.ts`.

### Q9 — Test strategy

**Decision:** H1 — write `ToolRegistrar` unit tests in this PR. Mock `McpServer`, construct registrar with profile + readOnly combinations, assert which `registerTool()` calls pass through vs. filter. This is the first unit test in the codebase; the registrar's pure filtering logic is ideal for it.

### Q10 — Migration scope

**Decision:** I1 — all 10 handlers in one PR. The `BaseToolHandler` interface change is a breaking change; TypeScript flags every non-conforming handler at compile time. Incremental migration requires keeping two signatures in flight. One atomic PR is cleaner.

### Q11 — Instance-mode gating

**Decision:** J1 — `InstanceToolHandler` retains its own `isMultiInstanceMode()` check before calling `registrar.registerTool()`. Instance-mode is not a universal gate; it's specific to one handler. The registrar handles only the two universal concerns (profile + read-only).

---

## Final Decisions Recap

| #   | Question               | Decision                                                                                                                                          |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Registrar placement    | `ToolRegistrar` wraps `McpServer.registerTool()`; handlers receive `registrar` instead of `(server, clientOrFactory, readOnlyMode, enabledTools)` |
| Q2  | Mutation knowledge     | `WRITE_TOOLS: Set<ToolName>` in `tool-profiles.ts`; registrar checks internally                                                                   |
| Q3  | Constructor input      | `new ToolRegistrar(server: McpServer, enabledTools: string[], readOnly: boolean)` — pre-resolved list                                             |
| Q4  | Candidate 2 boundary   | Strict scope — `clientOrFactory` stays in `registerTools()` signature; Candidate 2 fixes it with a resolver closure                               |
| Q5  | Empty-array semantics  | Kill `[] = all-tools` invariant; error fallback in `mcp-server.ts` → `getToolsForProfile('full')`                                                 |
| Q6  | Method name            | `registrar.registerTool()` — mirrors McpServer for mechanical migration                                                                           |
| Q7  | `shouldRegisterTool()` | Delete from `base-tool.ts` in this PR (dead code)                                                                                                 |
| Q8  | File location          | `src/server/tool-registrar.ts` (server-level, same tier as `mcp-server.ts`)                                                                       |
| Q9  | Tests                  | Unit tests for `ToolRegistrar` in this PR — first tests in codebase; mock McpServer, assert filtering                                             |
| Q10 | Migration scope        | All 10 handlers in one PR (BaseToolHandler interface change forces it)                                                                            |
| Q11 | Instance-mode gate     | `InstanceToolHandler` retains its own `isMultiInstanceMode()` check before calling `registrar.registerTool()`                                     |

## Implementation sketch

**New file: `src/server/tool-registrar.ts`**

```typescript
export class ToolRegistrar {
  constructor(
    private server: McpServer,
    private enabledTools: string[],
    private readOnly: boolean
  ) {}

  registerTool(name: ToolName, config: ToolConfig, handler: ToolHandler): void {
    if (!this.enabledTools.includes(name)) return;
    if (WRITE_TOOLS.has(name) && this.readOnly) return;
    this.server.registerTool(name, config, handler);
  }
}
```

**`tool-profiles.ts` addition:** `export const WRITE_TOOLS = new Set<ToolName>([...all mutation tools...])`

**`mcp-server.ts` changes:**

- Error fallback: `getToolsForProfile('full')` instead of `[]`
- Construct `new ToolRegistrar(server, enabledTools, readOnlyMode)`
- Call `handler.registerTools(registrar, clientOrFactory)` (drop `readOnlyMode`, `enabledTools` params)

**`BaseToolHandler` interface:** `registerTools(registrar: ToolRegistrar, clientOrFactory: BM | BMF): void`

**Each handler:** Remove all `if (shouldRegisterTool(...))` guards and `if (!readOnlyMode)` blocks; call `registrar.registerTool()` unconditionally in private methods.

**`base-tool.ts`:** Delete `shouldRegisterTool()`.

**Open flags:** None.
