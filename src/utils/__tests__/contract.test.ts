import { describe, it, expect } from 'vitest';
import { parseABI, generateTransactionLink } from '../contract';

describe('parseABI', () => {
  it('should parse valid ABI correctly', () => {
    const testABI = JSON.stringify([{
      "type": "function",
      "name": "transfer",
      "inputs": [
        { "name": "_to", "type": "address" },
        { "name": "_value", "type": "uint256" }
      ]
    }]);

    const result = parseABI(testABI);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('transfer');
    expect(result[0].inputs).toHaveLength(2);
  });

  it('should return empty array for invalid ABI', () => {
    const result = parseABI('invalid json');
    expect(result).toEqual([]);
  });
});

describe('generateTransactionLink', () => {
  it('should generate correct transaction link', () => {
    const details = {
      contractAddress: '0x123',
      chainId: 1,
      rpcUrl: 'https://example.com',
      abi: '[]',
      functionName: 'test',
      params: ['param1']
    };

    const result = generateTransactionLink(details);
    expect(result).toContain('/execute?tx=');
    expect(result).toContain(encodeURIComponent(JSON.stringify(details)));
  });
});