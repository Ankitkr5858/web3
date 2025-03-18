import { Interface } from 'ethers';
import type { ContractFunction } from '../types';

export const parseABI = (abiString: string): ContractFunction[] => {
  try {
    const abi = JSON.parse(abiString);
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

export const generateTransactionLink = (details: TransactionDetails): string => {
  const baseUrl = window.location.origin;
  const params = encodeURIComponent(JSON.stringify(details));
  return `${baseUrl}/execute?tx=${params}`;
};