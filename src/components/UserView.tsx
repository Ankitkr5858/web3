import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type { TransactionDetails } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';

export default function UserView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'pending_network'>(
    'idle'
  );
  const [error, setError] = useState<string>('');
  const [web3, setWeb3] = useState<Web3 | null>(null);
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

    const initWeb3 = async () => {
      if (!window.ethereum) {
        setError('Please install MetaMask or another Web3 wallet');
        setStatus('error');
        return;
      }

      try {
        const provider = window.ethereum;
        const web3Instance = new Web3(provider);
        
        await provider.request({ method: 'eth_requestAccounts' });
        
        if (!mounted) return;
        
        setWeb3(web3Instance);

        const chainId = await web3Instance.eth.getChainId();
        setCurrentChainId(chainId);

        provider.on('chainChanged', (chainId: string) => {
          if (!mounted) return;
          const numericChainId = parseInt(chainId, 16);
          setCurrentChainId(numericChainId);
          
          if (status === 'pending_network' && numericChainId === SEPOLIA_CHAIN_ID) {
            setStatus('idle');
            setIsProcessing(false);
          }
        });

        provider.on('accountsChanged', () => {
          if (!mounted) return;
          setIsProcessing(false);
          setStatus('idle');
        });

      } catch (err: any) {
        if (!mounted) return;
        console.error('Failed to initialize Web3:', err);
        setError(err.message || 'Failed to connect to wallet');
        setStatus('error');
      }
    };

    if (!isInitializing && txDetails) {
      initWeb3();
    }

    return () => {
      mounted = false;
    };
  }, [isInitializing, txDetails, status]);

  const addSepoliaNetwork = useCallback(async () => {
    if (!window.ethereum || isProcessing) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_HEX_CHAIN_ID,
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Failed to add Sepolia network:', error);
      return false;
    }
  }, [isProcessing]);

  const switchToSepoliaNetwork = useCallback(async () => {
    if (!window.ethereum || isProcessing) {
      throw new Error('No Web3 provider found or transaction in progress');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const added = await addSepoliaNetwork();
        if (added) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
            });
            return true;
          } catch (error) {
            console.error('Failed to switch to Sepolia after adding:', error);
            return false;
          }
        }
        return false;
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  }, [addSepoliaNetwork, isProcessing]);

  const executeTransaction = useCallback(async () => {
    if (!txDetails || !web3 || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus('loading');

      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const chainId = await web3.eth.getChainId();
      if (chainId !== SEPOLIA_CHAIN_ID) {
        const switched = await switchToSepoliaNetwork();
        if (!switched) {
          setStatus('pending_network');
          return;
        }
      }
      
      const contract = new web3.eth.Contract(JSON.parse(txDetails.abi), txDetails.contractAddress);

      const method = txDetails.functionName;
      if (!contract.methods[method]) {
        throw new Error(`Function ${method} not found in contract`);
      }

      const tx = await contract.methods[method](...(txDetails.params || [])).send({
        from: accounts[0],
      });

      console.log('Transaction hash:', tx.transactionHash);
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
      if (status !== 'pending_network') {
        setIsProcessing(false);
      }
    }
  }, [txDetails, web3, isProcessing, switchToSepoliaNetwork, status, navigate]);

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
            disabled={status === 'loading' || !web3 || isProcessing}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </>
            ) : !web3 ? (
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