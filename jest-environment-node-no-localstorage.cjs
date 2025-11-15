/**
 * Custom Jest environment that extends node environment
 * but skips localStorage initialization to avoid --localstorage-file requirement
 *
 * This is needed because:
 * 1. jest-environment-node tries to expose Node.js localStorage API
 * 2. localStorage requires --localstorage-file flag
 * 3. Node.js 18.x/20.x reject --localstorage-file in NODE_OPTIONS
 * 4. Our tests don't actually use localStorage
 *
 * See: https://github.com/jestjs/jest/issues/14874
 */

const NodeEnvironment = require('jest-environment-node').default;

class NodeEnvironmentWithoutLocalStorage extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);

    // Remove localStorage/sessionStorage descriptors to prevent lazy getter invocation
    // We use Object.getOwnPropertyDescriptor to check without triggering the getter
    const localStorageDesc = Object.getOwnPropertyDescriptor(this.global, 'localStorage');
    if (localStorageDesc) {
      delete this.global.localStorage;
    }

    const sessionStorageDesc = Object.getOwnPropertyDescriptor(this.global, 'sessionStorage');
    if (sessionStorageDesc) {
      delete this.global.sessionStorage;
    }
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = NodeEnvironmentWithoutLocalStorage;
