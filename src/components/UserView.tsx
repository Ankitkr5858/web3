import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type { TransactionDetails } from '../types';
import { MetaKeepSDKProvider } from '../utils/metakeep';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SEPOLIA_CHAIN_ID = 11155111;

export default function UserView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'pending_network'>(
    'idle'
  );
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<MetaKeepSDKProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const parseTxDetails = () => {
      try {
        const txParam = searchParams.get('tx');
        if (!txParam) {
          throw new Error('No transaction details provided');
        }

        const decodedParam = decodeURIComponent(txParam);
        const details = JSON.parse(decodedParam);

        if (!details.contractAddress) {
          throw new Error('Contract address is required');
        }
        if (!details.functionName) {
          throw new Error('Function name is required');
        }
        if (!details.abi) {
          throw new Error('Contract ABI is required');
        }

        const parsedAbi = JSON.parse(details.abi);
        if (!Array.isArray(parsedAbi)) {
          throw new Error('Invalid ABI format');
        }

        details.params = Array.isArray(details.params) ? details.params : [];

        setTxDetails(details);
        setStatus('idle');
      } catch (err: any) {
        console.error('Error parsing transaction details:', err);
        setError(err.message || 'Invalid transaction details');
        setStatus('error');
      } finally {
        setIsInitializing(false);
      }
    };

    parseTxDetails();
  }, [searchParams]);

  useEffect(() => {
    const recordPageView = async () => {
      try {
        await fetch(`${API_URL}/telemetry/pageview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Failed to record page view:', err);
      }
    };

    if (!isInitializing) {
      recordPageView();
    }
  }, [isInitializing]);

  useEffect(() => {
    let mounted = true;

    const initMetaMask = async () => {
      try {
        setStatus('loading');
        setError('');
        console.log('Starting MetaKeep initialization...');
        const metakeepProvider = new MetaKeepSDKProvider(import.meta.env.VITE_METAKEEP_APP_ID || '');
        
        if (!mounted) return;

        try {
          console.log('Attempting to connect wallet...');
          const wallet = await metakeepProvider.connect();
          console.log('Wallet connected successfully:', wallet.address);
          setWalletAddress(wallet.address);
          setCurrentChainId(wallet.chainId);
          setProvider(metakeepProvider);
          setStatus('idle');
        } catch (error: any) {
          console.error('Wallet connection error:', error);
          throw error;
        }

      } catch (err: any) {
        if (!mounted) return;
        console.error('Failed to initialize Web3:', err);
        setError(err.message || 'Failed to connect to wallet');
        setStatus('error');
        setProvider(null);
      }
    };

    if (!isInitializing && !provider && status !== 'error') {
      initMetaMask();
    }

    return () => {
      mounted = false;
      if (provider) {
        provider.disconnect().catch(console.error);
      }
    };
  }, [isInitializing, provider, status]);

  const switchToSepoliaNetwork = useCallback(async () => {
    if (!provider || isProcessing) {
      throw new Error('No MetaMask provider found or transaction in progress');
    }

    try {
      await provider.switchNetwork(SEPOLIA_CHAIN_ID);
      setCurrentChainId(SEPOLIA_CHAIN_ID);
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }, [provider, isProcessing]);

  const executeTransaction = useCallback(async () => {
    if (!txDetails || !provider || !walletAddress || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus('loading');

      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        const switched = await switchToSepoliaNetwork();
        if (!switched) {
          setStatus('pending_network');
          return;
        }
      }

      // Create contract interface and encode function data
      const { Interface } = await import('@ethersproject/abi');
      const contractInterface = new Interface(JSON.parse(txDetails.abi));
      const data = contractInterface.encodeFunctionData(
        txDetails.functionName,
        txDetails.params || []
      );

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(txDetails.contractAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Add transaction timeout
      const txPromise = provider.signTransaction({
        to: txDetails.contractAddress,
        data: data,
        value: '0x0'
      });

      const tx = await Promise.race([
        txPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout - please try again')), 60000)
        )
      ]);

      console.log('Transaction hash:', tx.hash);
      setStatus('success');
      toast.success('Transaction executed successfully!');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Transaction error:', err);
      if (err.code === 4001) {
        setError('Transaction was rejected. Please try again.');
      } else {
        setError(err.message || 'Failed to execute transaction');
      }
      setStatus('error');
      toast.error(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  }, [txDetails, provider, walletAddress, isProcessing, switchToSepoliaNetwork, navigate]);

  const resetState = useCallback(() => {
    setStatus('idle');
    setError('');
    setIsProcessing(false);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!txDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'No transaction details provided'}</p>
          <a
            href="/"
            className="inline-block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  if (status === 'pending_network') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Network Switch Required</h2>
          <p className="text-gray-600 mb-6">
            Please switch to the Sepolia network in your wallet to continue.
            Once switched, click "Try Again" to proceed with the transaction.
          </p>
          <div className="space-y-4">
            <button
              onClick={executeTransaction}
              disabled={isProcessing}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Try Again
            </button>
            <button
              onClick={resetState}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={resetState}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-2">
            Your transaction has been executed successfully.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting back to home page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Execute Transaction
          </h2>

          {currentChainId !== SEPOLIA_CHAIN_ID && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-md">
              <p className="text-yellow-700">
                Please switch to the Sepolia network to continue. The network will be switched automatically when you click "Execute Transaction".
              </p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contract Address
              </label>
              <div className="mt-1 text-sm text-gray-900 break-all">
                {txDetails.contractAddress}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Function
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {txDetails.functionName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parameters
              </label>
              <div className="mt-1 text-sm text-gray-900 break-all">
                {txDetails.params?.join(', ') || 'No parameters'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Network
              </label>
              <div className="mt-1 text-sm text-gray-900">
                Sepolia Test Network (Chain ID: {SEPOLIA_CHAIN_ID})
              </div>
            </div>
          </div>

          <button
            onClick={executeTransaction}
            disabled={status === 'loading' || !provider || isProcessing}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : !provider ? (
              'Connecting to Wallet...'
            ) : (
              'Execute Transaction'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}