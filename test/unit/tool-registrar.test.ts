/**
 * Unit tests for ToolRegistrar
 *
 * Tests:
 * - Profile gate: enabled tools pass through; others are filtered
 * - Read-only gate: WRITE_TOOLS are filtered when readOnly=true
 * - Read tools bypass read-only: non-WRITE_TOOLS pass through even when readOnly=true
 * - Empty enabledTools: nothing is registered
 * - Compound filtering: profile gate and read-only gate apply independently
 */

import { ToolRegistrar } from '../../src/server/tool-registrar';
import { WRITE_TOOLS } from '../../src/config/tool-profiles';

// Minimal McpServer mock — only registerTool is needed
function makeMockServer() {
  return {
    registerTool: jest.fn(),
  };
}

// Pick a known write tool and a known read tool for tests
const A_WRITE_TOOL = 'create_card'; // always in WRITE_TOOLS
const A_READ_TOOL = 'get_card'; // never in WRITE_TOOLS
const FAKE_CONFIG = { description: 'test tool' };
const FAKE_HANDLER = jest.fn();

// Sanity-check our test fixtures against the actual set
if (!WRITE_TOOLS.has(A_WRITE_TOOL)) {
  throw new Error(`Test fixture broken: '${A_WRITE_TOOL}' must be in WRITE_TOOLS`);
}
if (WRITE_TOOLS.has(A_READ_TOOL)) {
  throw new Error(`Test fixture broken: '${A_READ_TOOL}' must NOT be in WRITE_TOOLS`);
}

describe('ToolRegistrar', () => {
  describe('Profile gate', () => {
    it('passes through a tool that is in enabledTools', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, [A_READ_TOOL], false);

      registrar.registerTool(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).toHaveBeenCalledTimes(1);
      expect(server.registerTool).toHaveBeenCalledWith(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);
    });

    it('filters a tool that is NOT in enabledTools', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, ['list_boards'], false);

      registrar.registerTool(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).not.toHaveBeenCalled();
    });
  });

  describe('Read-only gate', () => {
    it('filters a WRITE_TOOL when readOnly=true', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, [A_WRITE_TOOL], true);

      registrar.registerTool(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).not.toHaveBeenCalled();
    });

    it('passes through a WRITE_TOOL when readOnly=false', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, [A_WRITE_TOOL], false);

      registrar.registerTool(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).toHaveBeenCalledTimes(1);
      expect(server.registerTool).toHaveBeenCalledWith(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER);
    });

    it('passes through a non-WRITE_TOOL even when readOnly=true', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, [A_READ_TOOL], true);

      registrar.registerTool(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).toHaveBeenCalledTimes(1);
      expect(server.registerTool).toHaveBeenCalledWith(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);
    });
  });

  describe('Empty enabledTools', () => {
    it('registers nothing when enabledTools is empty', () => {
      const server = makeMockServer();
      const registrar = new ToolRegistrar(server as any, [], false);

      registrar.registerTool(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);
      registrar.registerTool(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).not.toHaveBeenCalled();
    });
  });

  describe('Compound filtering', () => {
    it('applies profile gate before read-only gate (tool not in profile skips read-only check)', () => {
      const server = makeMockServer();
      // enabledTools does NOT include A_WRITE_TOOL, readOnly=true
      const registrar = new ToolRegistrar(server as any, [A_READ_TOOL], true);

      registrar.registerTool(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER);

      expect(server.registerTool).not.toHaveBeenCalled();
    });

    it('filters correctly when multiple tools are registered with mixed profile/write status', () => {
      const server = makeMockServer();
      // Enable both a read tool and a write tool; readOnly=true
      const registrar = new ToolRegistrar(server as any, [A_READ_TOOL, A_WRITE_TOOL], true);

      registrar.registerTool(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER); // should pass
      registrar.registerTool(A_WRITE_TOOL, FAKE_CONFIG, FAKE_HANDLER); // blocked by read-only
      registrar.registerTool('list_boards', FAKE_CONFIG, FAKE_HANDLER); // blocked by profile gate

      expect(server.registerTool).toHaveBeenCalledTimes(1);
      expect(server.registerTool).toHaveBeenCalledWith(A_READ_TOOL, FAKE_CONFIG, FAKE_HANDLER);
    });
  });
});
