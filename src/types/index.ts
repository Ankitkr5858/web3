import { Interface } from 'ethers';

export interface TransactionDetails {
  contractAddress: string;
  chainId: number;
  rpcUrl: string;
  abi: string;
  functionName: string;
  params: any[];
}

export interface ContractFunction {
  name: string;
  inputs: Array<{
    name: string;
    type: string;
  }>;
}

export interface MetaKeepConfig {
  clientId: string;
  chainId: number;
  rpcUrl: string;
}