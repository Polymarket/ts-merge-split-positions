import { Contract, ethers } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

import {
  CONDITIONAL_TOKEN_DECIMALS,
  getContractConfig,
} from "@polymarket/clob-client";

const NegRiskAdapterABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "_conditionId", type: "bytes32" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "splitPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_conditionId", type: "bytes32" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "mergePositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ConditionalTokenABI = [
  {
    constant: false,
    inputs: [
      {
        name: "collateralToken",
        type: "address",
      },
      {
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        name: "CONDITION_ID",
        type: "bytes32",
      },
      {
        name: "partition",
        type: "uint256[]",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    name: "splitPosition",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "collateralToken",
        type: "address",
      },
      {
        name: "parentCollectionId",
        type: "bytes32",
      },
      {
        name: "CONDITION_ID",
        type: "bytes32",
      },
      {
        name: "partition",
        type: "uint256[]",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mergePositions",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

dotenvConfig({ path: resolve(__dirname, ".env") });

// wallet
const PK = `${process.env.PK}`;

// RPC_URL
const RPC_URL = `${process.env.RPC_URL}`;

// contracts
const CONTRACTS = getContractConfig(parseInt(process.env.CHAIN_ID || "80002"));

// market
const CONDITION_ID = `${process.env.CONDITION_ID}`;
const IS_NEG_RISK_MARKET = `${process.env.IS_NEG_RISK_MARKET}` === "true";

const main = async () => {
  const provider = new JsonRpcProvider(RPC_URL);
  const mnemonic = new ethers.Wallet(PK);
  const wallet = mnemonic.connect(provider);

  const negRiskAdapter = new ethers.Contract(
    CONTRACTS.negRiskAdapter,
    NegRiskAdapterABI,
    wallet
  );

  const ctf = new ethers.Contract(
    CONTRACTS.conditionalTokens,
    ConditionalTokenABI,
    wallet
  );

  await splitPosition(negRiskAdapter, ctf);
  await mergePositions(negRiskAdapter, ctf);
};

const splitPosition = async (negRiskAdapter: Contract, ctf: Contract) => {
  console.log("Mint conditional tokens");

  if (IS_NEG_RISK_MARKET) {
    await (
      await negRiskAdapter.splitPosition(
        CONDITION_ID,
        ethers.utils.parseUnits("10", CONDITIONAL_TOKEN_DECIMALS)
      )
    ).wait();
  } else {
    await (
      await ctf.splitPosition(
        CONTRACTS.collateral,
        ethers.constants.HashZero,
        CONDITION_ID,
        [1, 2],
        ethers.utils.parseUnits("10", CONDITIONAL_TOKEN_DECIMALS)
      )
    ).wait();
  }
};

const mergePositions = async (negRiskAdapter: Contract, ctf: Contract) => {
  console.log("Merge conditional tokens");

  if (IS_NEG_RISK_MARKET) {
    await (
      await negRiskAdapter.mergePositions(
        CONDITION_ID,
        ethers.utils.parseUnits("10", CONDITIONAL_TOKEN_DECIMALS)
      )
    ).wait();
  } else {
    await (
      await ctf.mergePositions(
        CONTRACTS.collateral,
        ethers.constants.HashZero,
        CONDITION_ID,
        [1, 2],
        ethers.utils.parseUnits("10", CONDITIONAL_TOKEN_DECIMALS)
      )
    ).wait();
  }
};

main();
