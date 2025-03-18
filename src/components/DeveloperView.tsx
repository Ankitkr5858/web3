import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Copy, Code2, Plus, Trash2, HelpCircle, AlertCircle, Wallet } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { parseABI, generateTransactionLink } from '../utils/contract';
import type { ContractFunction, TransactionDetails } from '../types';
import Web3 from 'web3';

// Test addresses for demonstration
const TEST_ADDRESSES = {
  contract: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK token on Sepolia
  recipients: [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
  ]
};

// Test ERC20 Contract on Sepolia
const TEST_CONTRACT = {
  address: TEST_ADDRESSES.contract,
  abi: [
    {
      "constant": false,
      "inputs": [
        {
          "name": "_to",
          "type": "address"
        },
        {
          "name": "_value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "balance",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

const schema = z.object({
  contractAddress: z.string().min(42).max(42),
  chainId: z.number().min(1),
  rpcUrl: z.string().url(),
  abi: z.string().min(1),
});

const NETWORKS = [
  { id: 11155111, name: 'Sepolia', rpcUrl: 'https://rpc.sepolia.org' },
  { id: 1, name: 'Ethereum Mainnet', rpcUrl: 'https://eth.llamarpc.com' },
  { id: 137, name: 'Polygon', rpcUrl: 'https://polygon-rpc.com' },
  { id: 42161, name: 'Arbitrum One', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  { id: 10, name: 'Optimism', rpcUrl: 'https://mainnet.optimism.io' },
];

// Local storage key for saved contracts
const SAVED_CONTRACTS_KEY = 'savedContracts';

export default function DeveloperView() {
  const [functions, setFunctions] = useState<ContractFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [transactionLink, setTransactionLink] = useState<string>('');
  const [savedContracts, setSavedContracts] = useState<Array<{
    name: string;
    address: string;
    abi: string;
  }>>([]);
  const [showSavedContracts, setShowSavedContracts] = useState(false);
  const [showAddressHelp, setShowAddressHelp] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [showTestAddresses, setShowTestAddresses] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      chainId: 11155111, // Default to Sepolia
      rpcUrl: 'https://rpc.sepolia.org',
    }
  });

  // Load saved contracts from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(SAVED_CONTRACTS_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSavedContracts(parsed);
      } catch (err) {
        console.error('Error loading saved contracts:', err);
      }
    }
  }, []);

  // Save contracts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SAVED_CONTRACTS_KEY, JSON.stringify(savedContracts));
  }, [savedContracts]);

  const handleABIChange = (abiString: string) => {
    try {
      const parsedFunctions = parseABI(abiString);
      setFunctions(parsedFunctions);
      if (parsedFunctions.length > 0) {
        toast.success('ABI parsed successfully!');
      }
    } catch (err) {
      toast.error('Invalid ABI format');
      setFunctions([]);
    }
  };

  const handleFunctionSelect = (functionName: string) => {
    setSelectedFunction(functionName);
    setParams({});
  };

  const handleParamChange = (name: string, value: string) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const checkBalance = async () => {
    const contractAddress = watch('contractAddress');
    const abiString = watch('abi');
    
    if (!contractAddress || !abiString) {
      toast.error('Please enter contract address and ABI first');
      return;
    }

    if (!window.ethereum) {
      toast.error('Please install MetaMask');
      return;
    }

    try {
      setCheckingBalance(true);

      // Parse ABI to find balanceOf function
      const abi = JSON.parse(abiString);
      const balanceOfFunction = abi.find((item: any) => 
        item.name === 'balanceOf' && 
        item.type === 'function' &&
        item.constant === true
      );

      if (!balanceOfFunction) {
        throw new Error('This contract does not have a balanceOf function');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Please connect your wallet');
      }

      // Switch to selected network
      const chainId = watch('chainId');
      const chainIdHex = `0x${chainId.toString(16)}`;
      const network = NETWORKS.find(n => n.id === chainId);

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902 && network) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: network.name,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: ['https://sepolia.etherscan.io'], // This should be dynamic based on network
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // Create Web3 instance with the provider
      const web3 = new Web3(window.ethereum);
      
      // Create contract instance
      const contract = new web3.eth.Contract(
        abi,
        contractAddress
      );

      // Call balanceOf function
      const balance = await contract.methods.balanceOf(accounts[0]).call();
      
      // Convert from wei to token units (assuming 18 decimals)
      const balanceInTokens = web3.utils.fromWei(balance, 'ether');
      setBalance(balanceInTokens);
      toast.success(`Current token balance: ${balanceInTokens}`);
    } catch (err: any) {
      console.error('Error checking balance:', err);
      toast.error(err.message || 'Failed to check balance');
      setBalance(null);
    } finally {
      setCheckingBalance(false);
    }
  };

  const generateLink = (data: any) => {
    if (!selectedFunction) {
      toast.error('Please select a function first');
      return;
    }

    const selectedFunctionData = functions.find(f => f.name === selectedFunction);
    if (!selectedFunctionData) {
      toast.error('Invalid function selected');
      return;
    }

    // Validate required parameters
    const missingParams = selectedFunctionData.inputs.filter(
      input => !params[input.name] && params[input.name] !== '0'
    );

    if (missingParams.length > 0) {
      toast.error(`Please fill in all parameters: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    const txDetails: TransactionDetails = {
      ...data,
      functionName: selectedFunction,
      params: selectedFunctionData.inputs.map(input => params[input.name])
    };

    const link = generateTransactionLink(txDetails);
    setTransactionLink(link);
    toast.success('Transaction link generated!');
  };

  const loadTestContract = () => {
    setValue('contractAddress', TEST_CONTRACT.address);
    setValue('chainId', 11155111); // Sepolia chain ID
    setValue('rpcUrl', 'https://rpc.sepolia.org');
    setValue('abi', JSON.stringify(TEST_CONTRACT.abi, null, 2));
    handleABIChange(JSON.stringify(TEST_CONTRACT.abi));
    setShowTestAddresses(true);
    toast.success('Test contract loaded!');
  };

  const saveCurrentContract = () => {
    const address = watch('contractAddress');
    const abi = watch('abi');
    
    if (!address || !abi) {
      toast.error('Please fill in contract address and ABI');
      return;
    }

    const newContract = {
      name: `Contract ${savedContracts.length + 1}`,
      address,
      abi
    };

    setSavedContracts(prev => [...prev, newContract]);
    toast.success('Contract saved!');
  };

  const loadSavedContract = (contract: { address: string; abi: string }) => {
    setValue('contractAddress', contract.address);
    setValue('abi', contract.abi);
    handleABIChange(contract.abi);
    setShowSavedContracts(false);
    toast.success('Contract loaded!');
  };

  const deleteContract = (index: number) => {
    setSavedContracts(prev => prev.filter((_, i) => i !== index));
    toast.success('Contract deleted');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transactionLink);
    toast.success('Copied to clipboard!');
  };

  const handleNetworkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const network = NETWORKS.find(n => n.id === parseInt(e.target.value));
    if (network) {
      setValue('chainId', network.id);
      setValue('rpcUrl', network.rpcUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transaction Link Generator
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Create shareable transaction links for your smart contract interactions
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={loadTestContract}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Code2 className="h-5 w-5 mr-2" />
              Load Test Contract
            </button>
            <button
              onClick={checkBalance}
              disabled={checkingBalance}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Wallet className="h-5 w-5 mr-2" />
              {checkingBalance ? 'Checking...' : 'Check Token Balance'}
            </button>
            <button
              onClick={() => setShowSavedContracts(!showSavedContracts)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showSavedContracts ? 'Hide Saved' : 'Show Saved'}
            </button>
          </div>
          {balance !== null && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg inline-block">
              <p className="text-green-700">
                Your Token Balance: <span className="font-bold">{balance}</span>
              </p>
            </div>
          )}
        </div>

        {showTestAddresses && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Addresses</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Contract Address:</p>
                <div className="flex items-center mt-1">
                  <code className="text-sm bg-gray-50 px-2 py-1 rounded flex-1">{TEST_ADDRESSES.contract}</code>
                  <button
                    onClick={() => copyAddress(TEST_ADDRESSES.contract)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Test Recipient Addresses:</p>
                <div className="space-y-2 mt-1">
                  {TEST_ADDRESSES.recipients.map((address, index) => (
                    <div key={index} className="flex items-center">
                      <code className="text-sm bg-gray-50 px-2 py-1 rounded flex-1">{address}</code>
                      <button
                        onClick={() => copyAddress(address)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSavedContracts && savedContracts.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Contracts</h3>
            <div className="space-y-4">
              {savedContracts.map((contract, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{contract.name}</p>
                    <p className="text-sm text-gray-500 truncate">{contract.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadSavedContract(contract)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteContract(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit(generateLink)} className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Smart Contract Address
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddressHelp(!showAddressHelp)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              {showAddressHelp && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p>This is the address where the smart contract is deployed on the blockchain.</p>
                  <p className="mt-1">It's <strong>not</strong> your wallet address - it's the address of the contract you want to interact with.</p>
                  <p className="mt-1">Example: The LINK token contract on Sepolia is {TEST_CONTRACT.address}</p>
                </div>
              )}
              <input
                {...register('contractAddress')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0x..."
              />
              {errors.contractAddress && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contractAddress.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Network
              </label>
              <select
                onChange={handleNetworkSelect}
                defaultValue={11155111}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {NETWORKS.map(network => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contract ABI
              </label>
              <textarea
                {...register('abi')}
                onChange={(e) => handleABIChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                rows={5}
                placeholder="[...]"
              />
              {errors.abi && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.abi.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveCurrentContract}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Contract
              </button>
            </div>

            {functions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Function
                </label>
                <select
                  value={selectedFunction}
                  onChange={(e) => handleFunctionSelect(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select a function...</option>
                  {functions.map((func) => (
                    <option key={func.name} value={func.name}>
                      {func.name}
                    </option>
                  ))}
                </select>
                {!selectedFunction && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Please select a function to enable the generate button
                  </p>
                )}
              </div>
            )}

            {selectedFunction && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Function Parameters
                </h3>
                {functions
                  .find((f) => f.name === selectedFunction)
                  ?.inputs.map((input) => (
                    <div key={input.name}>
                      <label className="block text-sm font-medium text-gray-700">
                        {input.name} ({input.type})
                      </label>
                      <input
                        type="text"
                        onChange={(e) =>
                          handleParamChange(input.name, e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={`Enter ${input.type} value...`}
                      />
                    </div>
                  ))}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedFunction}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!selectedFunction ? 'Select a Function First' : 'Generate Transaction Link'}
            </button>
          </form>
        </div>

        {transactionLink && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Transaction Link
              </h3>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </button>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <SyntaxHighlighter language="text" className="text-sm">
                {transactionLink}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}