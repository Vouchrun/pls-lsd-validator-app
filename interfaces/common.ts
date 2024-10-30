export interface NavigationItem {
  name: string;
  path?: string;
}

export enum ValidatorNodeType {
  Solo = '1',
  Trusted = '2',
}

export interface RewardJsonResponse {
  Epoch: number;
  List: IpfsRewardItem[];
}

export interface IpfsRewardItem {
  index: number;
  address: string;
  proof: string;
  totalExitDepositAmount: number;
  totalRewardAmount: string;
  totalDepositAmount?: string;
}

export enum ChainPubkeyStatus {
  UnInitial = '0',
  Deposited = '1',
  Match = '2',
  Staked = '3',
  UnMatch = '4',
}

export enum PubkeyStatus {
  Unmatched = '1',
  Staked = '2',
  Others = '3',
}

export enum PubkeyStatusType {
  Active = '1',
  Pending = '2',
  Exited = '3',
  Others = '4',
}

export enum DisplayPubkeyStatus {
  Waiting = '0',
  Pending = '1',
  Active = '2',
  Exited = '3',
  Withdrawal = '4',
}

export interface NodePubkeyInfo {
  beaconApiStatus: string | undefined;
  pubkeyAddress: string;
  type: 'solo' | 'trusted';
  canStake?: boolean;
  displayStatus?: string;
  eligibilityEpoch?: string;
  days?: string;
  currentTokenAmount?: string;
  _status: string;
  _owner: string;
  _nodeDepositAmount: string;
  _depositBlock: string;
  apiData?: any;
}

export interface ClaimProof {
  index: number;
  address: string;
  totalRewardAmount: string;
  formatTotalRewardAmount: string;
  totalExitDepositAmount: string;
  formatTotalExitDepositAmount: string;
  proof: string[];
  remainingSeconds: number;
  remainingDays: string;
}

export enum ValidatorClaimType {
  ClaimReward = 1,
  ClaimDeposit = 2,
  ClaimAll = 3,
}

export interface TokenWithdrawInfo {
  rewardAmount: string;
  depositAmount: string;
  totalAmount: string;
  formatRewardAmount?: string;
  formatDepositAmount?: string;
  formatTotalAmount?: string;
  operateTimestamp: number;
  timeLeft: number;
  receivedAddress: string;
  explorerUrl: string;
  txHash: string;
  // 1 exiting 2 exited 3 claimed 4 withdrawed
  status: number;
}
