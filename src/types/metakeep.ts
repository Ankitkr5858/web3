export interface MetaKeepConfig {
  appId: string;
  chainId: number;
}

export interface MetaKeepWallet {
  address: string;
  chainId: number;
}

export interface MetaKeepTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
}

export interface MetaKeepProvider {
  connect(): Promise<MetaKeepWallet>;
  disconnect(): Promise<void>;
  switchNetwork(chainId: number): Promise<void>;
  signTransaction(params: {
    to: string;
    data: string;
    value?: string;
  }): Promise<MetaKeepTransaction>;
}