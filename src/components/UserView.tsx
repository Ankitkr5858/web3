import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MetaKeep } from 'metakeep';
import { Send, Wallet, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { TransactionLink } from '../types';
import { ethers } from 'ethers';

const TEST_APP_ID = '3122c75e-8650-4a47-8376-d1dda7ef8c58';

const UserView: React.FC = () => {
  const { data } = useParams();
  const [transactionDetails, setTransactionDetails] = useState<TransactionLink | null>(null);
  const [sdk, setSdk] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [functionAbi, setFunctionAbi] = useState<any>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [functionInputs, setFunctionInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (data) {
      try {
        const decoded = JSON.parse(decodeURIComponent(data));
        setTransactionDetails(decoded);

        // Initialize function ABI and inputs
        if (decoded.contractDetails.abi) {
          const abiData = JSON.parse(decoded.contractDetails.abi);
          const foundFunction = abiData.find((item: any) =>
            item.type === 'function' && item.name === decoded.functionName
          );
          if (foundFunction) {
            setFunctionAbi(foundFunction);
            const initialInputs: { [key: string]: string } = {};
            foundFunction.inputs.forEach((input: any) => {
              initialInputs[input.name] = '';
            });
            setFunctionInputs(initialInputs);
          }
        }
      } catch (error) {
        setError('Invalid transaction data');
      }
    }
  }, [data]);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setConnecting(true);
        const metakeepSDK = new MetaKeep({
          appId: TEST_APP_ID,
          chainId: 97,  // For Testnet (use 56 for Mainnet)
          rpcNodeUrls: {
            97: "https://data-seed-prebsc-1-s1.binance.org:8545/", // BSC Testnet RPC URL
          }
        });

        // Set SDK instance
        setSdk(metakeepSDK);

        // Get user wallet
        const user = await metakeepSDK.getUser();
        if (!user) {
          // If no user, initiate login
          await metakeepSDK.login();
        }

        // Get wallet after login
        const wallet = await metakeepSDK.getWallet();
        if (wallet) {
          setWalletAddress(wallet?.wallet?.ethAddress);
        }

        setError('');
      } catch (error: any) {
        console.error('MetaKeep SDK initialization error:', error);
        setError('Failed to initialize MetaKeep SDK. Please try again.');
      } finally {
        setConnecting(false);
      }
    };

    if (data) {
      initializeSDK();
    } else {
      setConnecting(false);
    }
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFunctionInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const executeTransaction = async () => {
    if (!transactionDetails || !sdk || !functionAbi) return;

    setLoading(true);
    setError('');

    try {
      const iface = new ethers.utils.Interface(transactionDetails.contractDetails.abi);

      // Prepare parameters based on function inputs
      const params = functionAbi.inputs.map((input: any) => {
        const value = functionInputs[input.name];
        if (input.type === 'uint256') {
          return ethers.utils.parseEther(value);
        }
        return value || '';
      });

      const encodedData = iface.encodeFunctionData(
        transactionDetails.functionName,
        params
      );

      // For payable functions, use the amount as the value
      const value = functionAbi.stateMutability === 'payable' && params.length > 0
        ? params[0]
        : '0x0';

      const web3Provider = await sdk.ethereum;
      await web3Provider.enable();
      const ethersProvider = new ethers.providers.Web3Provider(web3Provider);
      const signer = ethersProvider.getSigner()
      const signerAddress = await signer.getAddress()
      console.log(signerAddress)

      const feeData = await ethersProvider.getFeeData();
      const maxFeePerGas = feeData?.maxFeePerGas?.toString(); // Automatically fetch maxFeePerGas
      const maxPriorityFeePerGas = feeData?.maxPriorityFeePerGas?.toString(); // Automatically fetch maxPriorityFeePerGas

      // Create transaction object
      const transaction = {
        to: transactionDetails.contractDetails.address,
        data: encodedData,
        value: value,
        chainId: parseInt(transactionDetails.contractDetails.chainId),
        type: 2,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      };

      const txResponse = await signer.sendTransaction(transaction)
      await txResponse.wait()
      console.log('Transaction sent:', txResponse.hash);
      setTransactionHash(txResponse.hash)
    } catch (error: any) {
      console.error('Transaction error:', error);
      setError(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };





  if (!data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">No Transaction Found</h1>
          <p className="text-gray-600 mb-6">
            To execute a transaction, you need to access this page through a transaction link generated in the Developer view.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Go to Developer View
          </Link>
        </div>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin mx-auto text-blue-600" />
          <p className="text-lg text-gray-600">Initializing MetaKeep SDK...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 text-red-700 mb-2">
            <AlertCircle size={24} />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-red-600">{error}</p>
          <a
            href="https://docs.metakeep.xyz/reference/sdk-101"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-red-700 hover:text-red-800 underline"
          >
            Learn more about MetaKeep SDK
          </a>
        </div>
      </div>
    );
  }

  if (!transactionDetails) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center text-gray-600">Loading transaction details...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Execute Transaction</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {walletAddress && (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
            <Wallet size={20} className="text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Connected Wallet</div>
              <div className="font-mono text-sm text-blue-700">{walletAddress}</div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Transaction Details</h2>
          <div className="grid gap-3">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Contract Address</div>
              <div className="font-mono">{transactionDetails.contractDetails.address}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Function</div>
              <div className="font-medium">
                {transactionDetails.functionName}
                {functionAbi?.stateMutability === 'payable' && (
                  <span className="ml-2 text-sm text-blue-600">(Payable)</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Network</div>
              <div className="font-medium">
                {transactionDetails.contractDetails.chainId === '80001' ? 'Mumbai Testnet' :
                  transactionDetails.contractDetails.chainId === '137' ? 'Polygon Mainnet' :
                    'Unknown Network'} ({transactionDetails.contractDetails.chainId})
              </div>
            </div>

            {functionAbi && functionAbi.inputs.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-md space-y-3">
                <div className="text-sm font-medium text-gray-700">Function Parameters</div>
                {functionAbi.inputs.map((input: any, index: number) => (
                  <div key={input.name} className="space-y-1">
                    <label className="block text-sm text-gray-600">
                      {input.name} ({input.type})
                      {functionAbi.stateMutability === 'payable' && input.name === 'amount' && (
                        <span className="ml-2 text-blue-600">(Transaction Value)</span>
                      )}
                    </label>
                    <input
                      type={input.type === 'uint256' ? 'number' : 'text'}
                      value={functionInputs[input.name]}
                      onChange={(e) => handleInputChange(input.name, e.target.value)}
                      placeholder={`Enter ${input.name}`}
                      className="w-full p-2 border rounded-md text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={executeTransaction}
          disabled={loading || !sdk}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors
            ${loading || !sdk
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing Transaction...
            </>
          ) : (
            <>
              <Send size={20} />
              Sign & Execute Transaction
            </>
          )}
        </button>

        {/* Transaction hash result */}
        {transactionHash && (
          <div className="mt-4">
            <h2>Transaction Hash:</h2>
            <a
              href={`https://testnet.bscscan.com/tx/${transactionHash}`} // Change the link to the appropriate network explorer
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              {transactionHash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserView;