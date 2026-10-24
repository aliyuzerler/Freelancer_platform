/**
 * Jest configuration (FZ-08). The package.json declared jest + playwright but
 * shipped zero test files; this config backs the security regression suite.
 * Unit tests are node-side and pure — no DB, no network — so `npm test` runs
 * fast enough to gate CI. (Plain .js config: avoids the ts-node dependency.)
 */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json'],
};
