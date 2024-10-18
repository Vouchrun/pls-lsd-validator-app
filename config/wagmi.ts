// import { w3mConnectors, w3mProvider } from "@web3modal/ethereum";
// import { configureChains, createConfig } from "wagmi";
// import { getWagmiChainConfig } from "./env";

// const walletConnectProjectId = "773e240347e5c760d1cc49e512d0d86c"; // Vouch ProjectID

// // Define the chains to connect with pulsechain
// const chains = [
//   {
//     id: 1,
//     name: "Ethereum",
//     network: "mainnet",
//     nativeCurrency: { name: "ETH", symbol: "eth", decimals: 18 },
//     rpcUrls: {
//       default: { http: [`https://mainnet.infura.io/v3/PutyourID`] },
//       public: { http: [`https://mainnet.infura.io/v3/PutyourID`] }
//     },
//     chainId: 1
//   },
//   {
//     id: 943,
//     name: "Pulsechain Testnet V4",
//     network: "testnet",
//     nativeCurrency: { name: "tPLS", symbol: "tPLS", decimals: 18 },
//     rpcUrls: {
//       default: { http: ["https://rpc-testnet-pulsechain.g4mm4.io"] },
//       public: { http: ["https://rpc-testnet-pulsechain.g4mm4.io"] }
//     },
//     explorerUrl: "https://otter-testnet-pulsechain.g4mm4.io/",
//     chainId: 943
//   }
// ];

// const { publicClient } = configureChains(chains, [
//   w3mProvider({ projectId: walletConnectProjectId }),
// ]);

// export const wagmiConfig = createConfig({
//   autoConnect: false,
//   connectors: [
//     ...w3mConnectors({
//       chains,
//       projectId: walletConnectProjectId,
//     }),
//   ],
//   publicClient,
// });
