import dotenv from 'dotenv';

// Load .env file for performance tests
dotenv.config();

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: './jest-environment-node-no-localstorage.cjs',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
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
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(p-limit|yocto-queue))',
  ],
  testMatch: ['**/test/performance/**/*.test.ts'],
  testTimeout: 30000, // Performance tests may take longer
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};
