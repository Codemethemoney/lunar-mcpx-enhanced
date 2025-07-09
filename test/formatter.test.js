// test/formatter.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { formatResponse, formatError, formatMultiResponse } from '../src/formatter.js';

test('formatResponse should return MCP-compliant format', () => {
  const data = { tool: 'test-tool', confidence: 0.95 };
  const result = formatResponse(data);
  
  assert.strictEqual(result.content[0].type, 'text');
  assert.strictEqual(typeof result.content[0].text, 'string');
  assert.ok(result.content[0].text.includes('test-tool'));
});

test('formatResponse should handle string input', () => {
  const data = 'Simple string response';
  const result = formatResponse(data);
  
  assert.strictEqual(result.content[0].type, 'text');
  assert.strictEqual(result.content[0].text, 'Simple string response');
});

test('formatError should format errors correctly', () => {
  const error = new Error('Test error');
  const result = formatError(error);
  
  assert.strictEqual(result.content[0].type, 'text');
  assert.ok(result.content[0].text.includes('Error: Test error'));
});
test('formatMultiResponse should handle multiple responses', () => {
  const responses = ['Response 1', { data: 'Response 2' }];
  const result = formatMultiResponse(responses);
  
  assert.strictEqual(result.content.length, 2);
  assert.strictEqual(result.content[0].type, 'text');
  assert.strictEqual(result.content[0].text, 'Response 1');
  assert.strictEqual(result.content[1].type, 'text');
  assert.ok(result.content[1].text.includes('Response 2'));
});