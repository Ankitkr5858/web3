export interface MetaKeepProvider {
  new (appId: string): MetaKeepProvider;
  connect(): Promise<MetaKeepWallet>;
}

export interface MetaKeepWallet {
  sendTransaction(transaction: MetaKeepTransaction): Promise<any>;
}

export interface MetaKeepTransaction {
  to: string;
  data?: string;
  value?: string;
}