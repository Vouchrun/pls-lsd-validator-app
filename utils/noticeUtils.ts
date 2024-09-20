import {
  getStorage,
  saveStorage,
  STORAGE_KEY_NOTICE,
  STORAGE_KEY_UNREAD_NOTICE,
} from './storageUtils';
import dayjs from 'dayjs';

export interface LocalNotice {
  id: string;
  type: NoticeType;
  data: NoticeDataType;
  status: NoticeStatus;
  txDetail?: NoticeTxDetail;
  scanUrl?: string;
  timestamp?: number;
}

export type NoticeType =
  | 'Validator Deposit'
  | 'Validator Stake'
  | 'Withdraw'
  | 'Add Trust Node'
  | 'Claim Rewards';

export type NoticeStatus = 'Pending' | 'Error' | 'Cancelled' | 'Confirmed';

export interface NoticeTxDetail {
  sender: string;
  transactionHash: string;
}

export type NoticeDataType =
  | NoticeValidatorDepositData
  | NoticeValidatorClaimData
  | NoticeWithdrawData;

export interface NoticeValidatorDepositData {
  type: 'solo' | 'trusted';
  amount: string;
  pubkeys: string[];
}

export interface NoticeValidatorClaimData {
  rewardAmount: string;
  rewardTokenName: string;
}

export interface NoticeUnstakeData {
  amount: string;
  willReceiveAmount: string;
  needWithdraw?: boolean;
}

export interface NoticeStakeData {
  amount: string;
  willReceiveAmount: string;
}

export interface NoticeWithdrawData {
  tokenAmount: string;
}

export function addNoticeInternal(newNotice: LocalNotice) {
  let noticeList = getNoticeList();

  const targetNotice = noticeList.filter((item) => item.id === newNotice.id);
  noticeList = noticeList.filter((item) => item.id !== newNotice.id);
  if (targetNotice.length > 0) {
    updateNoticeInternal(newNotice.id, newNotice);
  } else {
    const newLength = noticeList.unshift({
      ...newNotice,
      timestamp: dayjs().valueOf(),
    });

    if (newLength > 10) {
      noticeList.pop();
    }

    saveStorage(STORAGE_KEY_NOTICE, JSON.stringify(noticeList));
    saveStorage(STORAGE_KEY_UNREAD_NOTICE, '1');
  }
}

export function updateNoticeInternal(
  id: string,
  // newStatus: NoticeStatus,
  newNotice: Partial<LocalNotice>
) {
  let noticeList = getNoticeList();

  const targetNotice = noticeList.filter((item) => item.id === id);
  noticeList = noticeList.filter((item) => item.id !== id);

  if (targetNotice.length === 1) {
    let matched = targetNotice[0];
    matched = {
      ...matched,
      ...newNotice,
    };

    noticeList.unshift(matched);

    saveStorage(STORAGE_KEY_NOTICE, JSON.stringify(noticeList));
    saveStorage(STORAGE_KEY_UNREAD_NOTICE, '1');
  }
}

export function getNoticeList(): LocalNotice[] {
  const localStr = getStorage(STORAGE_KEY_NOTICE);

  let noticeList: LocalNotice[] = [];
  if (localStr) {
    noticeList = JSON.parse(localStr);
  }

  return noticeList || [];
}
