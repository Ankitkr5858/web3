/**
 * @file contract.ts
 * @description Utility functions for handling smart contract interactions and ABI parsing
 */

import { Interface } from 'ethers';
import type { ContractFunction } from '../types';

/**
 * Parses a contract ABI string and extracts function definitions
 * @function
 * @param {string} abiString - The contract ABI in JSON string format
 * @returns {ContractFunction[]} Array of parsed contract functions with their inputs
 * 
 * @example
 * const abi = '[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"}]}]';
 * const functions = parseABI(abi);
 * // Returns: [{ name: 'transfer', inputs: [{ name: 'to', type: 'address' }] }]
 */
export const parseABI = (abiString: string): ContractFunction[] => {
  try {
    // Parse the ABI string into JSON
    const abi = JSON.parse(abiString);
    
    // Filter for function type entries and map to simplified format
    return abi
      .filter((item: any) => item.type === 'function')
      .map((func: any) => ({
        name: func.name,
        inputs: func.inputs.map((input: any) => ({
          name: input.name,
          type: input.type
        }))
      }));
  } catch (error) {
    console.error('Error parsing ABI:', error);
    return [];
  }
};

/**
 * Generates a transaction execution URL with encoded transaction details
 * @function
 * @param {TransactionDetails} details - The transaction details to encode in the URL
 * @returns {string} The complete URL for executing the transaction
 * 
 * @example
 * const details = { to: '0x...', value: '1000000000000000000' };
 * const url = generateTransactionLink(details);
 * // Returns: 'http://localhost:3000/execute?tx=%7B%22to%22%3A%220x...%22%7D'
 */
export const generateTransactionLink = (details: TransactionDetails): string => {
  const baseUrl = window.location.origin;
  const params = encodeURIComponent(JSON.stringify(details));
  return `${baseUrl}/execute?tx=${params}`;
};