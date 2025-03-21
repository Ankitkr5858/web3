import { MetaKeepProvider, MetaKeepWallet, MetaKeepTransaction } from '../types/metakeep';

export class MetaKeepSDKProvider implements MetaKeepProvider {
  private appId: string;
  private sdk: any;

  constructor(appId: string) {
    this.appId = appId || '3122c75e-8650-4a47-8376-d1dda7ef8c58';
  }

  private static sdkPromise: Promise<void> | null = null;

  async initialize(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    console.log(`Initializing MetaKeep SDK (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Define MetaKeep on window object
    declare global {
      interface Window {
        MetaKeep: any;
      }
    }

    // Check if SDK is already being loaded
    if (MetaKeepSDKProvider.sdkPromise) {
      try {
        await MetaKeepSDKProvider.sdkPromise;
        if (this.sdk) return;
      } catch (error) {
        console.error('Previous SDK initialization failed:', error);
        MetaKeepSDKProvider.sdkPromise = null;
      }
    }

    // Remove any existing script to ensure clean initialization
    const existingScript = document.querySelector('script[src*="metakeep"]');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }

    try {
      console.log('Loading MetaKeep SDK script...');
      MetaKeepSDKProvider.sdkPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.metakeep.xyz/v2.0/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.type = 'text/javascript';
        script.referrerPolicy = 'strict-origin';

        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('MetaKeep SDK initialization timeout - please check your internet connection and try again'));
        }, 60000);

        const cleanup = () => {
          clearTimeout(timeout);
          script.remove();
        };

        script.onload = async () => {
          try {
            // Wait for SDK to be properly initialized
            let attempts = 0;
            const maxAttempts = 10;
            console.log('Waiting for MetaKeep SDK to initialize...');
            
            while (!window.MetaKeep && attempts < maxAttempts) {
              console.log(`Checking for MetaKeep SDK (attempt ${attempts + 1}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, 500));
              attempts++;
            }

            if (!window.MetaKeep) {
              cleanup();
              throw new Error('MetaKeep SDK not found after script load');
            }

            console.log('MetaKeep SDK found, initializing with App ID...');
            if (typeof window.MetaKeep !== 'function') {
              throw new Error('MetaKeep SDK not properly loaded - window.MetaKeep is not a constructor');
            }
            try {
              if (!this.appId) {
                throw new Error('MetaKeep App ID is required');
              }
              this.sdk = new window.MetaKeep(this.appId);
              if (!this.sdk) {
                throw new Error('Failed to create MetaKeep SDK instance');
              }
              console.log('MetaKeep SDK initialized successfully');
              cleanup();
              resolve();
            } catch (initError) {
              cleanup();
              reject(new Error(`Failed to initialize MetaKeep SDK: ${initError.message}`));
            }
          } catch (error) {
            cleanup();
            reject(error);
          }
        };

        script.onerror = () => {
          cleanup();
          reject(new Error('Failed to load MetaKeep SDK'));
        };

        document.body.appendChild(script);
      });
    } catch (error) {
      console.error('MetaKeep SDK initialization error:', error);
      if (retryCount < maxRetries) {
        console.warn(`MetaKeep SDK initialization failed, retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.initialize(retryCount + 1);
      }
      const errorMessage = `Failed to load MetaKeep SDK after ${maxRetries} attempts: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async connect(): Promise<MetaKeepWallet> {
    try {
      if (!this.sdk) {
        await this.initialize();
      }

      const connectPromise = await this.sdk.connect({
        timeout: 30000,
        chainId: 11155111,
        chainConfig: {
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }
      });

      const response = await Promise.race([
        connectPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout - please try again')), 30000)
        )
      ]);

      if (!response || !response.address) {
        throw new Error('Failed to connect wallet');
      }

      return {
        address: response.address,
        chainId: response.chainId
      };
    } catch (error: any) {
      // Clean up SDK instance on error
      this.sdk = null;
      throw new Error(error.message || 'Failed to connect to MetaKeep');
    }
  }

  async disconnect(): Promise<void> {
    if (this.sdk) {
      await this.sdk.disconnect();
    }
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    await this.sdk.switchNetwork(chainId);
  }

  async signTransaction(params: {
    to: string;
    data: string;
    value?: string;
  }): Promise<MetaKeepTransaction> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    const response = await this.sdk.signAndSendTransaction({
      to: params.to,
      data: params.data,
      value: params.value || '0x0'
    });

    return {
      hash: response.hash,
      status: response.status
    };
  }
}