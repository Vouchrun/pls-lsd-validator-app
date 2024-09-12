import {
  CANCELLED_ERR_MESSAGE1,
  CANCELLED_ERR_MESSAGE2,
} from "constants/common";
import {
  ChainPubkeyStatus,
  DisplayPubkeyStatus,
  NodePubkeyInfo,
  PubkeyStatus,
} from "interfaces/common";
import { formatNumber } from "./numberUtils";
import { getValidatorTotalDepositAmount } from "config/env";

/**
 * create uuid
 * @returns uuid
 */
export function uuid() {
  try {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;

        return v.toString(16);
      }
    );
  } catch {
    return "";
  }
}

/**
 * open link in new tab
 * @param url link's url
 */
export function openLink(url: string | undefined | null) {
  if (!url) {
    return;
  }
  const otherWindow = window.open();
  if (otherWindow) {
    otherWindow.opener = null;
    otherWindow.location = url;
  }
}

/**
 * Check is EVM cancel tx error.
 * @param err error message
 * @returns
 */
export const isEvmTxCancelError = (err: any) => {
  return (
    err.code === 4001 ||
    err.message.indexOf(CANCELLED_ERR_MESSAGE1) >= 0 ||
    err.message.indexOf(CANCELLED_ERR_MESSAGE2) >= 0
  );
};

/**
 * Get chain pubkey status display text.
 * @param status pubkey status value
 */
export const getPubkeyStatusText = (status: string) => {
  switch (Number(status)) {
    case 0:
      return "UnInitial";
    case 1:
      return "Deposited";
    case 2:
      return "Matched";
    case 3:
      return "Staked";
    case 4:
      return "Unmatched";
    case 100:
      return "Others";
    default:
      return "Unknown";
  }
};

/**
 * Get chain pubkey status display text.
 * @param status pubkey status value
 */
export const getPubkeyStatusTypeText = (status: string | undefined) => {
  switch (Number(status)) {
    case 1:
      return "Active";
    case 2:
      return "Pending";
    case 3:
      return "Exited";
    default:
      return "Others";
  }
};

/**
 * Check pubkey status, whether it's stakeable.
 * @param status pubkey status value
 */
export const isPubkeyStakeable = (status: string) => {
  // return true;
  switch (Number(status)) {
    case 1:
    case 2:
      return true;
    default:
      return false;
  }
};

/**
 * Get matched beacon api status list of PubkeyStatus
 * @param status pubkey status value
 */
export const getBeaconStatusListOfPubkeyStatus = (status: PubkeyStatus) => {
  switch (status) {
    case PubkeyStatus.Unmatched:
      return ["PENDING_INITIALIZED"];
    case PubkeyStatus.Staked:
      return [
        "PENDING_QUEUED",
        "ACTIVE_ONGOING",
        "ACTIVE_EXITING",
        "ACTIVE_SLASHED",
        "ACTIVE",
        "PENDING",
      ];
    case PubkeyStatus.Others:
      return [
        "EXITED_UNSLASHED",
        "EXITED_SLASHED",
        "WITHDRAWAL_POSSIBLE",
        "WITHDRAWAL_DONE",
        "EXITED",
        "WITHDRAWAL",
        undefined,
      ];
    default:
      return [];
  }
};

/**
 * Get matched beacon api status list of DisplayPubkeyStatus
 * @param status pubkey status value
 */
export const getBeaconStatusListOfDisplayPubkeyStatus = (
  status: DisplayPubkeyStatus
) => {
  switch (status) {
    case DisplayPubkeyStatus.Waiting:
      return ["PENDING_INITIALIZED", "PENDING_QUEUED", "PENDING", undefined];
    case DisplayPubkeyStatus.Pending:
      return ["PENDING_INITIALIZED", "PENDING_QUEUED", "PENDING", undefined];
    case DisplayPubkeyStatus.Active:
      return ["ACTIVE_ONGOING", "ACTIVE_EXITING", "ACTIVE_SLASHED", "ACTIVE"];
    case DisplayPubkeyStatus.Exited:
      return ["EXITED_UNSLASHED", "EXITED_SLASHED", "EXITED"];
    case DisplayPubkeyStatus.Withdrawal:
      return ["WITHDRAWAL_POSSIBLE", "WITHDRAWAL_DONE", "WITHDRAWAL"];
    default:
      return [];
  }
};

/**
 * Get chain DisplayPubkeyStatus.
 * @param status pubkey status value
 */
export const getDisplayPubkeyStatusFromBeaconStatus = (
  beaconStatus: string | undefined
) => {
  if (
    getBeaconStatusListOfDisplayPubkeyStatus(
      DisplayPubkeyStatus.Waiting
    ).indexOf(beaconStatus) >= 0
  ) {
    return DisplayPubkeyStatus.Waiting;
  } else if (
    getBeaconStatusListOfDisplayPubkeyStatus(
      DisplayPubkeyStatus.Active
    ).indexOf(beaconStatus) >= 0
  ) {
    return DisplayPubkeyStatus.Active;
  } else if (
    getBeaconStatusListOfDisplayPubkeyStatus(
      DisplayPubkeyStatus.Exited
    ).indexOf(beaconStatus) >= 0
  ) {
    return DisplayPubkeyStatus.Exited;
  } else if (
    getBeaconStatusListOfDisplayPubkeyStatus(
      DisplayPubkeyStatus.Withdrawal
    ).indexOf(beaconStatus) >= 0
  ) {
    return DisplayPubkeyStatus.Withdrawal;
  }
};

/**
 * Get Pubkey display status text
 * @param status pubkey status value
 */
export const getPubkeyDisplayStatus = (
  item: NodePubkeyInfo,
  unmatchedToken: number
) => {
  if (item._status === ChainPubkeyStatus.Deposited) {
    // return "Waiting";
    return "Pending";
  }
  if (item._status === ChainPubkeyStatus.UnMatch) {
    return "Failed";
  }
  if (item._status === ChainPubkeyStatus.Match && unmatchedToken < 31) {
    return "Unmatched";
  }
  if (item._status === ChainPubkeyStatus.Match && unmatchedToken >= 31) {
    return "Matched";
  }
  if (
    item._status === ChainPubkeyStatus.Staked &&
    (item.beaconApiStatus === undefined ||
      item.beaconApiStatus === "PENDING_INITIALIZED" ||
      item.beaconApiStatus === "PENDING_QUEUED" ||
      item.beaconApiStatus === "PENDING")
  ) {
    return "Pending";
  }
  if (
    item._status === ChainPubkeyStatus.Staked &&
    (item.beaconApiStatus === "ACTIVE_ONGOING" ||
      item.beaconApiStatus === "ACTIVE_EXITING" ||
      item.beaconApiStatus === "ACTIVE_SLASHED" ||
      item.beaconApiStatus === "ACTIVE")
  ) {
    return "Active";
  }
  if (
    item._status === ChainPubkeyStatus.Staked &&
    (item.beaconApiStatus === "EXITED_UNSLASHED" ||
      item.beaconApiStatus === "EXITED_SLASHED" ||
      item.beaconApiStatus === "EXITED")
  ) {
    return "Exited";
  }
  if (
    item._status === ChainPubkeyStatus.Staked &&
    (item.beaconApiStatus === "WITHDRAWAL_POSSIBLE" ||
      item.beaconApiStatus === "WITHDRAWAL_DONE" ||
      item.beaconApiStatus === "WITHDRAWAL")
  ) {
    return "Withdrawal";
  }

  return "Unknown";
};

export const formatValidatorDespositAmount = formatNumber(
  getValidatorTotalDepositAmount(),
  { fixedDecimals: false }
);

export const isPubkeyStillValid = (beaconStatus: string | undefined) => {
  const uppercaseStatus = beaconStatus?.toUpperCase();
  return (
    uppercaseStatus !== "EXITED_UNSLASHED" &&
    uppercaseStatus !== "EXITED_SLASHED" &&
    uppercaseStatus !== "EXITED" &&
    uppercaseStatus !== "WITHDRAWAL_POSSIBLE" &&
    uppercaseStatus !== "WITHDRAWAL_DONE"
  );
};
