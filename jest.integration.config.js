import dotenv from 'dotenv';

// Load .env file for integration tests
dotenv.config();

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: './jest-environment-node-no-localstorage.cjs',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
    '^@client/(.+?)\\.js$': '<rootDir>/src/client/$1',
    '^@client/(.+)$': '<rootDir>/src/client/$1',
    '^@config/(.+?)\\.js$': '<rootDir>/src/config/$1',
    '^@config/(.+)$': '<rootDir>/src/config/$1',
    '^@schemas/(.+?)\\.js$': '<rootDir>/src/schemas/$1',
    '^@schemas/(.+)$': '<rootDir>/src/schemas/$1',
    '^@services/(.+?)\\.js$': '<rootDir>/src/services/$1',
    '^@services/(.+)$': '<rootDir>/src/services/$1',
    '^@defs/(.+?)\\.js$': '<rootDir>/src/types/$1',
    '^@defs/(.+)$': '<rootDir>/src/types/$1',
    '^@utils/(.+?)\\.js$': '<rootDir>/src/utils/$1',
    '^@utils/(.+)$': '<rootDir>/src/utils/$1',
    '^@server/(.+?)\\.js$': '<rootDir>/src/server/$1',
    '^@server/(.+)$': '<rootDir>/src/server/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'es2020',
          noImplicitAny: false,
          strict: false,
          baseUrl: '.',
          paths: {
            '@client/*': ['src/client/*'],
            '@config/*': ['src/config/*'],
            '@schemas/*': ['src/schemas/*'],
            '@services/*': ['src/services/*'],
            '@defs/*': ['src/types/*'],
            '@utils/*': ['src/utils/*'],
            '@server/*': ['src/server/*'],
          },
        },
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(p-limit|yocto-queue))',
  ],
  testMatch: ['**/test/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/integration/infrastructure/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Issue #44: Run integration tests sequentially to reduce API rate limit pressure
  // BusinessMap API has a 30 req/minute limit - parallel tests exhaust this quickly
  maxWorkers: 1,

  // Extend default timeout to 90s to allow for rate-limit retries
  // axios-retry uses retry-after header which can be up to 60 seconds
  testTimeout: 90000,
};
