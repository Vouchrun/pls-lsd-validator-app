import networkBalanceContractAbi from './abi/networkBalance.json';
import networkWithdrawContractAbi from './abi/networkWithdraw.json';
import networkProposalContractAbi from './abi/networkProposal.json';
import lsdTokenContractAbi from './abi/lsdToken.json';
import nodeDepositContractAbi from './abi/nodeDeposit.json';
import userDepositContractAbi from './abi/userDeposit.json';
import { AbiItem } from 'web3-utils';

/**
 * get lsdETH token contract ABI
 */
export function getLsdEthTokenContractAbi() {
  return lsdTokenContractAbi as AbiItem[];
}

/**
 * get ETH deposit contract ABI
 */
export function getEthDepositContractAbi() {
  return userDepositContractAbi as AbiItem[];
}

/**
 * get networkBalance contract ABI
 */
export function getNetworkBalanceContractAbi() {
  return networkBalanceContractAbi as AbiItem[];
}

/**
 * get nodeDeposit contract ABI
 */
export function getNodeDepositContractAbi() {
  return nodeDepositContractAbi as AbiItem[];
}

/**
 * get networkWithdraw contract ABI
 */
export function getNetworkWithdrawContractAbi() {
  return networkWithdrawContractAbi as AbiItem[];
}

/**
 * get networkProposal contract ABI
 */
export function getNetworkProposalContractAbi() {
  return networkProposalContractAbi as AbiItem[];
}
