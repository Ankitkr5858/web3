import { ethers } from 'ethers';
import { MetaKeep } from 'metakeep';
import React, { useEffect, useState } from 'react'

const TEST_APP_ID = '3122c75e-8650-4a47-8376-d1dda7ef8c58';
const DirectTransfer = () => {
    const [walletAddress, setWalletAddress] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState('');
    const [transactionHash, setTransactionHash] = useState('');

    const [sdk, setSdk] = useState<any>(null);

    useEffect(() => {
        const initializeSDK = async () => {
            try {
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
                console.log(wallet, "walletwallet");
                if (wallet) {
                    const ethersProvider = new ethers.providers.JsonRpcProvider("https://bsc-testnet-rpc.publicnode.com");
                    const balances = await ethersProvider.getBalance(wallet?.wallet?.ethAddress);
                    setBalance(balances?.toString() / 10**18);
                    setWalletAddress(wallet?.wallet?.ethAddress);
                }
            } catch (error: any) {
                console.error('MetaKeep SDK initialization error:', error);
            }
        };
        initializeSDK();
    }, [])

    const executeTransaction = async () => {

        if (!sdk) return;

        try {
            // Use MetaKeep web3 provider
            const web3Provider = await sdk.ethereum;
            await web3Provider.enable();
            const ethersProvider = new ethers.providers.Web3Provider(web3Provider);
            const signer = ethersProvider.getSigner()
            const signerAddress = await signer.getAddress()
            console.log(signerAddress)

            const sendTxnResponse = await signer.sendTransaction({
                from: signerAddress,
                to: recipientAddress,
                value: ethers.utils.parseEther(amount?.toString()),
            });
            console.log("send txn successful");
            await sendTxnResponse.wait()
            console.log(sendTxnResponse);
            setTransactionHash(sendTxnResponse.hash)
        } catch (err: any) {
            console.log("Error when trying to sign");
            console.log(err.message || err);
        }
    };

    return (
        <div>
            <h1>{balance}</h1>
            <h1>{walletAddress}</h1>
            {/* Only show the button and inputs if sdk is loaded */}
            {sdk && (
                <div>
                    {/* Input for recipient address */}
                    <div>
                        <label htmlFor="recipientAddress">Recipient Address:</label>
                        <input
                            type="text"
                            id="recipientAddress"
                            placeholder="Enter recipient address"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Input for amount */}
                    <div>
                        <label htmlFor="amount">Amount (ETH):</label>
                        <input
                            type="number"
                            id="amount"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Execute Transaction Button */}
                    <button
                        onClick={executeTransaction}
                        disabled={!sdk}
                        className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-colors mt-2
        ${!sdk
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                            }`}
                    >
                        Execute Transaction
                    </button>
                </div>
            )}

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
    );
};

export default DirectTransfer;
