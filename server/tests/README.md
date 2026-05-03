# Testing Documentation

## Overview
This folder contains unit tests for the Glide server application. Tests are written using Jest, a popular JavaScript testing framework.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-runs on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Each test file follows the naming convention: `*.test.js` and is organized by module:

- `polyline.test.js` - Tests for the polyline decoder utility used for encoding/decoding route data

## Test Coverage

Currently testing:
- **Polyline Decoder** (`utils/polyline.js`) - Comprehensive tests for decoding Google Maps encoded polyline strings into coordinate arrays

## Writing New Tests

1. Create a new test file in the `tests/` folder with the naming convention `moduleName.test.js`
2. Import the module you want to test
3. Use Jest's `describe()` and `test()` functions to organize your tests
4. Write assertions using Jest's expect API

### Example Test Template
```javascript
const moduleToTest = require('../path/to/module');

describe('Module Name', () => {
  describe('functionName', () => {
    test('should do something specific', () => {
      const result = moduleToTest.someFunction(input);
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

## Best Practices

- Keep tests focused and test one thing per test
- Use descriptive test names that explain what is being tested
- Mock external dependencies when necessary
- Aim for high code coverage but prioritize meaningful tests
- Use `beforeEach()` or `afterEach()` hooks for common setup/teardown

## Extending Tests

Future test areas to consider:
- User authentication middleware
- Ride booking logic
- Ride calculation utilities
- Map service adapters
- AI controller functionality
