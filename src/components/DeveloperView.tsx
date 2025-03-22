import React, { useState } from 'react';
import { ContractDetails, TransactionLink } from '../types';
import { Share2, Code2, Check, Copy } from 'lucide-react';

const DeveloperView: React.FC = () => {
  const [contractDetails, setContractDetails] = useState<ContractDetails>({
    abi: '',
    chainId: '',
    rpcUrl: '',
    address: '',
  });
  const [selectedFunction, setSelectedFunction] = useState('');
  const [parameters, setParameters] = useState<string[]>([]);
  const [transactionLink, setTransactionLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleContractDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContractDetails(prev => ({ ...prev, [name]: value }));
  };

  const loadDummyData = () => {
    // Test contract for USDC on Mumbai Testnet
    const dummyABI = [
            {
                constant: true,
                inputs: [{ name: "_owner", type: "address" }],
                name: "balanceOf",
                outputs: [{ name: "balance", type: "uint256" }],
                type: "function"
            },
            {
                constant: false,
                inputs: [
                    { name: "_to", type: "address" },
                    { name: "_value", type: "uint256" }
                ],
                name: "transfer",
                outputs: [{ name: "success", type: "bool" }],
                type: "function"
            }
        ];

    setContractDetails({
      abi: JSON.stringify(dummyABI, null, 2),
      chainId: "97", // Mumbai Testnet
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      address: '0x8b687f9D5DAcF1e5dF395684BaBf5EC4F81cc2cc' // USDC on Mumbai
    });
  };

  const parseABI = () => {
    try {
      const parsedABI = JSON.parse(contractDetails.abi);
      return parsedABI.filter((item: any) => item.type === 'function').map((func: any) => func.name);
    } catch (error) {
      console.error('Invalid ABI format');
      return [];
    }
  };

  const generateLink = () => {
    const link: TransactionLink = {
      contractDetails,
      functionName: selectedFunction,
      parameters: ['0x63F5e5CbB3E414A23e64F79d3c6531b3Fee2B535', '1000000'], // 1 USDC (6 decimals)
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(link));
    const baseUrl = window.location.origin;
    setTransactionLink(`${baseUrl}/execute/${encodedData}`);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transactionLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Transaction Link</h1>
        <button
          onClick={loadDummyData}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Code2 size={20} />
          Load Test Data
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Smart Contract ABI</label>
          <textarea
            name="abi"
            value={contractDetails.abi}
            onChange={handleContractDetailsChange}
            className="w-full p-3 border rounded-lg font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={8}
            placeholder="Paste your contract ABI here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Chain ID</label>
            <input
              type="text"
              name="chainId"
              value={contractDetails.chainId}
              onChange={handleContractDetailsChange}
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 80001 for Mumbai Testnet"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">RPC URL</label>
            <input
              type="text"
              name="rpcUrl"
              value={contractDetails.rpcUrl}
              onChange={handleContractDetailsChange}
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., https://rpc-mumbai.maticvigil.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contract Address</label>
          <input
            type="text"
            name="address"
            value={contractDetails.address}
            onChange={handleContractDetailsChange}
            className="w-full p-3 border rounded-lg font-mono bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0x..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contract Function</label>
          <select
            value={selectedFunction}
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a function</option>
            {parseABI().map((func: string) => (
              <option key={func} value={func}>{func}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generateLink}
          disabled={!contractDetails.abi || !contractDetails.address || !selectedFunction}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors
            ${!contractDetails.abi || !contractDetails.address || !selectedFunction
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          <Share2 size={20} />
          Generate Link
        </button>

        {transactionLink && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Transaction Link</h3>
              <button
                onClick={copyToClipboard}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <a
              href={transactionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 hover:text-blue-800 break-all font-mono text-sm"
            >
              {transactionLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperView;