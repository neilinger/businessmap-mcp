# Comprehensive PR Review Framework
## LLM-as-Judge Approach for Multi-Agent Code Review

**Version**: 1.0
**Date**: 2025-11-01
**Status**: Design Complete - Implementation Ready

---

## Executive Summary

This framework defines a comprehensive, multi-dimensional approach to PR review that combines:
- **Existing agent capabilities** (code-reviewer, architect-review, security-auditor, etc.)
- **LLM-as-judge evaluation** (SWE-Judge ensemble scoring)
- **Automated validation** (breaking changes, performance, visual regression)
- **Continuous learning** (ACE pattern integration)

**Key Insight**: We have 80% of required capabilities TODAY. Start immediately with existing tools, iteratively add missing validations.

---

## What Makes a "Good" Review?

### Core Dimensions

1. **COMPLETENESS** - All dimensions covered (security, performance, architecture, tests, docs)
2. **ACTIONABILITY** - Specific, prioritized feedback with code examples
3. **CONTEXT-AWARENESS** - Understands business requirements and technical constraints
4. **EDUCATIONAL** - Teaches best practices and patterns, not just finds issues
5. **PROACTIVE** - Catches issues before production
6. **BALANCED** - Optimizes speed vs thoroughness trade-off
7. **AUTOMATED** - Leverages tools for repetitive checks
8. **HUMAN-AUGMENTED** - AI handles scale, humans handle judgment
9. **MEASURABLE** - Clear pass/fail criteria and metrics
10. **CONTINUOUS** - Learns from past reviews (ACE pattern storage)

### Quality Metrics

- **Review Turnaround**: 24-48 hours
- **PR Size**: <400 LOC (ideal), split if >1000 LOC
- **Critical Path Focus**: Auth, APIs, shared components
- **Test Coverage Delta**: +/- 5% acceptable, track trends
- **Security Scan**: 0 Critical/High vulnerabilities before merge
- **Performance Impact**: No >10% regression without justification

---

## Current Capabilities Inventory

### ✅ Available Agents (claude-code-workflows plugin)

#### Comprehensive Review Plugin
- **code-reviewer**: Elite code quality, security, performance analysis
  - AI-powered tools (Trag, Bito, Codiga, GitHub Copilot)
  - Static analysis (SonarQube, CodeQL, Semgrep)
  - Security (OWASP Top 10, Snyk, Bandit)
  - Performance profiling, dependency scanning

- **architect-review**: Architecture patterns, DDD, microservices
  - Clean Architecture, Hexagonal Architecture
  - Event-driven architecture, CQRS
  - Distributed systems patterns
  - SOLID principles validation

#### Other Specialist Agents
- **security-auditor**: DevSecOps, compliance (GDPR/HIPAA/SOC2)
- **performance-engineer**: OpenTelemetry, distributed tracing, load testing
- **test-automator**: AI-powered test automation, self-healing tests
- **docs-architect**: Technical documentation, architecture guides
- **deployment-engineer**: CI/CD pipelines, GitOps, progressive delivery
- **backend-architect**: REST/GraphQL/gRPC API design
- **frontend-developer**: React 19, Next.js 15, accessibility

### ✅ Available Commands

- **/full-review**: 4-phase multi-agent review orchestration
- **/pr-enhance**: PR description/checklist generation, risk assessment

### ✅ Available MCP Servers

- **serena**: Symbolic code analysis (semantic navigation)
- **Ref**: Documentation search (public/private)
- **sequential-thinking**: Deep analysis (ULTRATHINK mode)
- **businessmap-fimancia**: Project management integration
- **IDE**: Language diagnostics from VS Code

### ✅ Available External MCP Servers (not installed)

- **Code Analysis MCP**: Code review, static analysis, refactoring
- **Joern MCP**: Vulnerability identification via Code Property Graphs
- **TypeScript MCP Worker**: ESLint, TSQuery, automated patches
- **Semgrep MCP**: Static analysis rules management
- **Frontend Testing MCP**: Jest, Cypress frameworks

---

## Critical Gaps & Missing Capabilities

### ❌ Runtime Validation
- **Breaking Change Detection**: No oasdiff/OpenAPI comparison
- **Performance Benchmarking**: No K6/JMeter with historical comparison
- **API Contract Validation**: No runtime contract testing
- **Visual Regression**: No screenshot diffing for UI changes

### ❌ Orchestration & Scoring
- **PR Orchestrator Agent**: No workflow coordinator for multi-phase review
- **LLM-as-Judge Evaluator**: No SWE-Judge ensemble scoring implementation
- **Validation Execution Agent**: No automated test/benchmark runner

### ❌ Advanced Analysis
- **Dependency Impact Analyzer**: No downstream effect tracing
- **Rollback Safety Validator**: No revert safety checking
- **User Impact Assessor**: No UX/accessibility validation

---

## Identified Biases & Blind Spots

### 1. CODE-CENTRIC BIAS
**Problem**: Focus on code quality, ignore PR process quality
**Impact**: Missing metadata, poor descriptions, incomplete documentation
**Mitigation**: Use pr-enhance command for PR metadata validation

### 2. STATIC-ONLY BIAS
**Problem**: Only analyze static code, no runtime validation
**Impact**: Missing performance regressions, breaking changes, contract violations
**Mitigation**: Add performance benchmarking, API contract testing, load testing

### 3. SINGLE-AGENT BIAS
**Problem**: No multi-agent orchestration pattern for comprehensive review
**Impact**: Siloed reviews, missed cross-cutting concerns
**Mitigation**: Use full-review command with 4-phase parallel execution

### 4. POST-HOC BIAS
**Problem**: Review after PR creation, not during development
**Impact**: Expensive rework, slower velocity
**Mitigation**: Shift-left testing, pre-commit hooks, IDE integration

### 5. TOOL-AVAILABILITY BIAS
**Problem**: Use what we have, not what we need
**Impact**: Incomplete validation, false confidence
**Mitigation**: Document gaps, prioritize MCP/agent development

### 6. HUMAN-JUDGMENT BIAS
**Problem**: Assume human will catch what agents miss
**Impact**: Overreliance on manual review, inconsistent quality
**Mitigation**: Explicit LLM-as-judge scoring, clear pass/fail gates

### 7. POSITIVE-PATH BIAS
**Problem**: Test happy path, ignore edge cases and failures
**Impact**: Production incidents from unhandled errors
**Mitigation**: Chaos engineering, error injection, negative testing

### 8. SILOED-REVIEW BIAS
**Problem**: Security separate from performance separate from architecture
**Impact**: Missed interactions, system-level issues
**Mitigation**: Cross-phase context sharing, consolidated reporting

---

## LLM-as-Judge Evaluation Framework

### Evaluation Architecture (SWE-Judge Ensemble)

**Model**: Multi-evaluator ensemble inspired by academic peer-review
**Approach**: Combine direct scoring (objective) + pairwise comparison (subjective)

### Evaluation Dimensions

#### 1. CODE QUALITY (Weight: 15%)
- **Metric**: Maintainability Index (0-100)
- **Scoring**: Direct scoring via static analysis
- **Tools**: SonarQube, CodeQL cyclomatic complexity
- **Pass Threshold**: >60 (maintainable)

#### 2. SECURITY POSTURE (Weight: 25%)
- **Metric**: CVE Severity Score
- **Scoring**: Direct scoring with CVSS mapping
- **Tools**: Snyk, Bandit, GitLeaks, Semgrep
- **Pass Threshold**: 0 Critical/High vulnerabilities

#### 3. PERFORMANCE IMPACT (Weight: 15%)
- **Metric**: Regression % vs baseline
- **Scoring**: Requires benchmark comparison
- **Tools**: K6, JMeter, Google Benchmark
- **Pass Threshold**: <10% regression OR justified

#### 4. TEST COVERAGE (Weight: 15%)
- **Metric**: Line/Branch/Function coverage %
- **Scoring**: Direct scoring with delta tracking
- **Tools**: Jest, pytest, coverage.py
- **Pass Threshold**: >80% overall, no drop >5%

#### 5. ARCHITECTURE INTEGRITY (Weight: 15%)
- **Metric**: Pattern compliance, coupling metrics
- **Scoring**: Pairwise comparison with alternatives
- **Tools**: Architect-review agent analysis
- **Pass Threshold**: No architectural anti-patterns

#### 6. PR METADATA QUALITY (Weight: 5%)
- **Metric**: Description completeness, checklist items
- **Scoring**: Direct scoring via template matching
- **Tools**: pr-enhance command
- **Pass Threshold**: All required fields populated

#### 7. BREAKING CHANGES (Weight: 5%)
- **Metric**: API contract violations count
- **Scoring**: Binary (breaking/non-breaking) + severity
- **Tools**: oasdiff, OpenAPI Comparator
- **Pass Threshold**: 0 unintentional breaking changes

#### 8. USER IMPACT (Weight: 5%)
- **Metric**: Visual regression, accessibility score
- **Scoring**: Requires screenshot/audit comparison
- **Tools**: Percy, axe-core, Lighthouse
- **Pass Threshold**: 0 visual regressions, WCAG 2.1 AA

### Scoring Formula

```
Overall_Score = Σ(Dimension_Score × Weight)
Pass_Gate = Overall_Score ≥ 70 AND All_Critical_Checks_Pass
```

### Judge Models

- **Primary Judge**: Claude Sonnet 4 (semantic understanding, context-aware)
- **Consistency Judge**: Claude Haiku 4.5 (fast, cost-effective validation)
- **Specialist Judges**: Domain-specific agents (security-auditor for CVE scoring)

---

## Comprehensive PR Review Workflow

### Phase 0: Pre-Review (Automated)

**Triggers**: PR creation or update

1. **PR Metadata Enhancement**
   - Command: `/pr-enhance`
   - Generate description, checklist, risk assessment
   - Validate PR size (<400 LOC ideal)
   - Output: Enhanced PR description with metadata

2. **Automated Linting/Formatting**
   - Run ESLint, Prettier, Black, gofmt (language-specific)
   - Auto-fix trivial issues
   - Fail fast on critical syntax errors

3. **Pre-Flight Test Execution**
   - Run unit tests, integration tests
   - Generate coverage delta report
   - Block review if tests fail

**Duration**: 2-5 minutes
**Automation**: 100% (CI/CD pipeline)

---

### Phase 1: Code Quality & Architecture Review (Parallel)

**Goal**: Establish code quality baseline and architectural soundness

#### 1A. Code Quality Analysis
- **Agent**: `code-reviewer`
- **Scope**: Complexity, maintainability, tech debt, SOLID principles
- **Tools**: SonarQube, CodeQL, Semgrep
- **Output**: Quality metrics, code smell inventory, refactoring recommendations
- **Pass Criteria**: Maintainability Index >60, Cyclomatic Complexity <15

#### 1B. Architecture Review
- **Agent**: `architect-review`
- **Scope**: Microservices boundaries, API design, DDD patterns
- **Tools**: Architecture diagram analysis, dependency mapping
- **Output**: Architecture assessment, design pattern validation, drift detection
- **Pass Criteria**: No circular dependencies, proper abstraction layers

**Duration**: 5-10 minutes
**Automation**: 90% (agents), 10% (human review of findings)

---

### Phase 2: Security & Performance Review (Parallel)

**Goal**: Identify vulnerabilities and performance bottlenecks

#### 2A. Security Vulnerability Assessment
- **Agent**: `security-auditor`
- **Scope**: OWASP Top 10, dependency vulnerabilities, secrets detection
- **Tools**: Snyk, Trivy, GitLeaks, Bandit
- **Context**: Architecture findings from Phase 1B
- **Output**: Vulnerability report, CVE list, security risk matrix, remediation steps
- **Pass Criteria**: 0 Critical/High CVEs, no hardcoded secrets

#### 2B. Performance & Scalability Analysis
- **Agent**: `performance-engineer`
- **Scope**: CPU/memory hotspots, database queries, caching, N+1 detection
- **Tools**: Profilers, query analyzers, OpenTelemetry
- **Context**: Architecture findings from Phase 1B
- **Output**: Performance metrics, bottleneck analysis, optimization recommendations
- **Pass Criteria**: No obvious N+1 queries, proper resource management

**Duration**: 10-15 minutes
**Automation**: 85% (agents + tools), 15% (manual profiling)

---

### Phase 3: Testing & Documentation Review (Parallel)

**Goal**: Ensure comprehensive test coverage and accurate documentation

#### 3A. Test Coverage & Quality Analysis
- **Agent**: `test-automator`
- **Scope**: Unit/integration/e2e tests, test pyramid, assertion density
- **Tools**: Jest, pytest, coverage.py, mutation testing
- **Context**: Security/performance requirements from Phase 2
- **Output**: Coverage report, test quality metrics, testing gap analysis
- **Pass Criteria**: >80% coverage, <5% delta, meaningful assertions

#### 3B. Documentation Review
- **Agent**: `docs-architect`
- **Scope**: Inline docs, API specs (OpenAPI/Swagger), ADRs, README
- **Tools**: Documentation analyzers, spec validators
- **Context**: All previous phase findings
- **Output**: Documentation coverage report, inconsistency list, improvements
- **Pass Criteria**: All public APIs documented, examples provided

**Duration**: 8-12 minutes
**Automation**: 80% (agents), 20% (human review of technical writing)

---

### Phase 4: Best Practices & CI/CD Review (Parallel)

**Goal**: Verify framework conventions and deployment readiness

#### 4A. Framework & Language Best Practices
- **Agent**: Framework-specific (e.g., `frontend-developer` for React)
- **Scope**: Language idioms, framework patterns, modern conventions
- **Tools**: Framework-specific linters, pattern validators
- **Context**: All quality issues from previous phases
- **Output**: Best practices compliance report, modernization recommendations
- **Pass Criteria**: Framework conventions followed, no deprecated APIs

#### 4B. CI/CD & DevOps Practices
- **Agent**: `deployment-engineer`
- **Scope**: Build automation, deployment strategies, infrastructure as code
- **Tools**: Pipeline analyzers, IaC validators
- **Context**: All critical issues that impact deployment
- **Output**: Pipeline assessment, DevOps maturity evaluation, rollback plan
- **Pass Criteria**: Zero-downtime deployment possible, rollback plan documented

**Duration**: 5-8 minutes
**Automation**: 85% (agents), 15% (human deployment review)

---

### Phase 5: Runtime Validation (Automated)

**Goal**: Validate runtime behavior and breaking changes

#### 5A. Breaking Change Detection
- **Tool**: oasdiff, OpenAPI Comparator, Azure/openapi-diff
- **Scope**: API contract comparison (before/after)
- **Output**: Breaking change report with severity
- **Pass Criteria**: 0 unintentional breaking changes OR proper versioning

#### 5B. Performance Benchmarking
- **Tool**: K6, JMeter, Google Benchmark (language-specific)
- **Scope**: Load testing, response time comparison, resource usage
- **Output**: Performance comparison report (current vs baseline)
- **Pass Criteria**: <10% regression OR explicit performance trade-off documented

#### 5C. API Contract Validation
- **Tool**: Pact, Spring Cloud Contract, Postman Newman
- **Scope**: Consumer-driven contract testing
- **Output**: Contract compatibility report
- **Pass Criteria**: All consumer contracts still satisfied

#### 5D. Visual Regression Testing (if frontend)
- **Tool**: Percy, Chromatic, BackstopJS
- **Scope**: Screenshot comparison (before/after)
- **Output**: Visual diff report with highlighted changes
- **Pass Criteria**: Intentional UI changes only, no unintended regressions

**Duration**: 10-20 minutes (varies by test suite)
**Automation**: 100% (GitHub Actions, CI/CD)

---

### Phase 6: LLM-as-Judge Scoring (Automated)

**Goal**: Consolidate findings and generate objective quality score

#### 6A. Multi-Dimensional Scoring
- **Judge**: SWE-Judge ensemble (Sonnet 4 primary + Haiku 4.5 validation)
- **Input**: All phase outputs (1-5)
- **Process**:
  1. Score each dimension (0-100)
  2. Apply weights (security 25%, quality 15%, etc.)
  3. Calculate overall score
  4. Compare against pass threshold (70)
  5. Validate critical checks (security, tests, breaking changes)

#### 6B. Consolidated Report Generation
- **Format**: Markdown with priority sections
- **Structure**:
  - **Executive Summary**: Overall score, pass/fail, top 3 issues
  - **Critical Issues (P0)**: Must fix immediately (CVEs, data loss risks)
  - **High Priority (P1)**: Fix before merge (performance, tests)
  - **Medium Priority (P2)**: Plan for next sprint (refactoring, docs)
  - **Low Priority (P3)**: Track in backlog (style, cosmetic)
  - **Remediation Guidance**: Specific steps with code examples
  - **Alternative Approaches**: Pairwise comparisons for architecture decisions

**Duration**: 2-3 minutes
**Automation**: 100% (LLM-powered)

---

### Phase 7: Human Review & Decision (Manual)

**Goal**: Final human judgment and merge decision

1. **Reviewer receives consolidated report** with LLM-as-judge score
2. **Reviewer focuses on**:
   - Business logic correctness (agents can't validate requirements)
   - User experience and product decisions
   - Trade-offs and alternatives suggested by agents
   - Critical issues flagged by LLM-as-judge
3. **Reviewer actions**:
   - Approve (if score ≥70 AND critical checks pass)
   - Request changes (with specific feedback referencing agent findings)
   - Reject (if fundamental issues found)

**Duration**: 15-30 minutes (human attention)
**Automation**: 0% (requires human judgment)

---

## Total Review Timeline

| Phase | Duration | Automation | Human Attention |
|-------|----------|------------|-----------------|
| 0. Pre-Review | 2-5 min | 100% | 0% |
| 1. Quality/Arch | 5-10 min | 90% | 10% |
| 2. Security/Perf | 10-15 min | 85% | 15% |
| 3. Tests/Docs | 8-12 min | 80% | 20% |
| 4. Practices/CI | 5-8 min | 85% | 15% |
| 5. Validation | 10-20 min | 100% | 0% |
| 6. Scoring | 2-3 min | 100% | 0% |
| 7. Human Review | 15-30 min | 0% | 100% |
| **TOTAL** | **57-103 min** | **83% avg** | **17% avg** |

**Target**: <2 hours total, <30 minutes human attention

---

## Implementation Roadmap

### Phase 1: Immediate (Week 1) - Use Existing Capabilities
**Goal**: Start comprehensive reviews TODAY with what we have

- [x] Document existing agents and commands (this file)
- [ ] Create PR review playbook using /full-review command
- [ ] Train team on 4-phase review workflow
- [ ] Set up manual validation for missing capabilities (breaking changes, performance)
- [ ] Integrate ACE learning for pattern capture

**Deliverables**: Working PR review process with existing tools

---

### Phase 2: Validation Integration (Week 2-3) - Add Runtime Checks
**Goal**: Automate missing validation capabilities

- [ ] Install/configure breaking change detection
  - oasdiff for OpenAPI comparison
  - GitHub Action for PR comments
- [ ] Set up performance benchmarking
  - K6 for API load testing
  - Historical baseline tracking
- [ ] Add API contract testing
  - Pact or Spring Cloud Contract
  - Consumer contract validation
- [ ] Configure visual regression (if frontend)
  - Percy or Chromatic integration

**Deliverables**: Automated validation pipeline

---

### Phase 3: MCP Integration (Week 4-5) - Bridge Missing Tools
**Goal**: Integrate external analysis tools via MCP

- [ ] Install Code Analysis MCP (code review, refactoring)
- [ ] Install Semgrep MCP (security rules)
- [ ] Evaluate Joern MCP (vulnerability analysis)
- [ ] Consider Frontend Testing MCP (Jest/Cypress)
- [ ] Create custom Breaking Change MCP wrapper (oasdiff)
- [ ] Create custom Performance Benchmarking MCP (K6)

**Deliverables**: Enhanced MCP ecosystem

---

### Phase 4: LLM-as-Judge Implementation (Week 6-8) - Scoring Layer
**Goal**: Automated quality scoring and pass/fail gates

- [ ] Design SWE-Judge ensemble architecture
- [ ] Implement multi-dimensional scoring logic
- [ ] Create consolidated report generator
- [ ] Set pass thresholds and critical check gates
- [ ] Integrate with GitHub Status Checks API
- [ ] A/B test against manual reviews

**Deliverables**: LLM-as-judge evaluator agent

---

### Phase 5: Orchestration & Automation (Week 9-12) - Full Pipeline
**Goal**: End-to-end automated PR review orchestration

- [ ] Create PR Orchestrator Agent (workflow coordinator)
- [ ] Implement Validation Execution Agent (test runner)
- [ ] Add Dependency Impact Analyzer
- [ ] Add Rollback Safety Validator
- [ ] Create dashboard for metrics tracking
- [ ] Implement continuous improvement via ACE

**Deliverables**: Production-ready PR review system

---

## Success Metrics

### Code Quality Metrics
- **Bug Detection Rate**: >90% of production bugs caught in review
- **Security Vulnerability Prevention**: 100% of Critical/High CVEs blocked
- **Performance Regression Prevention**: >85% of performance issues caught

### Process Metrics
- **Review Turnaround Time**: <24 hours from PR creation to first review
- **Human Review Time**: <30 minutes per PR (down from 60+ minutes)
- **Automation Coverage**: >80% of review tasks automated

### Learning Metrics
- **ACE Pattern Growth**: +20 patterns per month from PR reviews
- **Pattern Reuse**: >60% of reviews leverage learned patterns
- **False Positive Rate**: <10% of agent findings dismissed by humans

### Team Velocity
- **PR Throughput**: +30% more PRs reviewed per week
- **Merge Confidence**: >95% of merged PRs have 0 production incidents
- **Developer Satisfaction**: >4.0/5.0 rating on review experience

---

## Gap Mitigation Strategies

### For Missing Capabilities (Short-term)

| Gap | Manual Workaround | Automation Path |
|-----|-------------------|-----------------|
| Breaking Changes | Manual OpenAPI diff review | GitHub Action with oasdiff |
| Performance | Manual profiling with benchmarks | K6 automation in CI/CD |
| Visual Regression | Manual screenshot comparison | Percy/Chromatic integration |
| API Contracts | Manual consumer testing | Pact contract testing |
| Dependency Impact | Manual git blame analysis | Custom analyzer agent |
| Rollback Safety | Manual revert testing | Rollback validator agent |

### For Bias Mitigation (Ongoing)

| Bias | Detection Method | Mitigation |
|------|------------------|------------|
| Code-centric | Review metadata quality scores | pr-enhance mandatory |
| Static-only | Production incident post-mortems | Runtime validation suite |
| Single-agent | Cross-cutting issue frequency | Multi-agent orchestration |
| Post-hoc | High rework rates | Shift-left testing |
| Tool-availability | Gap analysis (this document) | Prioritized MCP development |
| Human-judgment | Review consistency variance | LLM-as-judge scoring |
| Positive-path | Production error rates | Chaos engineering |
| Siloed-review | System-level incident patterns | Consolidated reporting |

---

## Continuous Improvement via ACE

### Pattern Learning from PR Reviews

After each substantial PR review, invoke ACE learning:

```
Skill: ace-orchestration:ace-learning

Task: PR review for [feature/bugfix]
Trajectory:
1. Ran /pr-enhance for metadata generation
2. Executed /full-review with 4-phase analysis
3. Found [N] security issues, [M] performance bottlenecks
4. Discovered [pattern/gotcha]
5. Validated with [tool]

Success: [true/false]
Output: [Lessons learned, patterns discovered]
```

### Playbook Section Mapping

- **strategies_and_hard_rules**: "Always validate API contracts before merge"
- **useful_code_snippets**: "Security header configuration for Express.js"
- **troubleshooting_and_pitfalls**: "N+1 queries common in GraphQL resolvers"
- **apis_to_use**: "Use oasdiff for OpenAPI breaking change detection"

### Learning Feedback Loop

1. **Pattern Discovery**: Agent finds issue during review
2. **Pattern Capture**: ACE learning extracts reusable pattern
3. **Pattern Storage**: Stored in playbook with confidence score
4. **Pattern Retrieval**: Next review benefits from learned pattern
5. **Pattern Reinforcement**: Successful reuse increases confidence

**Target**: Self-improving review system that gets smarter over time

---

## Conclusion

This framework provides a **pragmatic, phased approach** to comprehensive PR review:

✅ **Start TODAY** with existing agents (code-reviewer, architect-review, security-auditor, etc.)
✅ **Leverage existing workflows** (/full-review, /pr-enhance commands)
✅ **Acknowledge gaps** (breaking changes, performance benchmarking, visual regression)
✅ **Document biases** (code-centric, static-only, siloed-review, etc.)
✅ **Iteratively improve** (add validations → MCP integration → LLM-as-judge → orchestration)
✅ **Continuously learn** (ACE pattern capture from every review)

### Key Recommendations

1. **Don't wait for perfect**: Start with 80% solution (existing agents) vs 0% solution (waiting for complete tooling)
2. **Automate incrementally**: Add one validation at a time, measure impact
3. **Document everything**: Gaps, biases, workarounds, patterns
4. **Learn continuously**: Every review is a learning opportunity (ACE integration)
5. **Measure religiously**: Track metrics, validate assumptions, course-correct

### Next Steps

1. **Review this document** with team for feedback
2. **Run first /full-review** on existing PR to validate workflow
3. **Identify first gap to close** (likely breaking change detection)
4. **Set up ACE learning** for pattern capture
5. **Iterate based on real-world usage**

---

**Remember**: A good review catches bugs early, teaches best practices, and continuously improves. This framework provides the structure, tools, and learning mechanisms to achieve all three.
