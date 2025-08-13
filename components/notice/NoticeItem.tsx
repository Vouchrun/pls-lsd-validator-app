import classNames from "classnames";
import { useAppDispatch } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import Image from "next/image";
import stakeIcon from "public/images/notice/notice_stake.svg";
import withdrawIcon from "public/images/notice/notice_withdraw.svg";
import { openLink } from "utils/commonUtils";
import { getTokenName } from "utils/configUtils";
import {
  LocalNotice,
  NoticeValidatorClaimData,
  NoticeValidatorDepositData,
  NoticeWithdrawData,
} from "utils/noticeUtils";
import { formatNumber } from "utils/numberUtils";
import { formatDate } from "utils/timeUtils";

export const NoticeItem = (props: {
  notice: LocalNotice;
  visible: boolean;
  onUpdate: () => void;
}) => {
  const { darkMode } = useAppSlice();
  const dispatch = useAppDispatch();
  const { notice, visible } = props;

  const getNoticeIcon = (notice: LocalNotice): any => {
    switch (notice.type) {
      case "Validator Deposit":
      case "Validator Stake":
        return stakeIcon;
      case "Withdraw":
        return withdrawIcon;
      default:
        return stakeIcon;
    }
  };

  const getNoticeStatus = (notice: LocalNotice): string => {
    switch (notice.status) {
      case "Confirmed":
        return "Succeed";
      case "Error":
        return "Failed";
      default:
        return notice.status;
    }
  };

  const getNoticeContent = (notice: LocalNotice): string => {
    try {
      let data;
      if (notice.type === "Validator Deposit") {
        data = notice.data as NoticeValidatorDepositData;
        return `Deposit ${formatNumber(data.amount)} ${getTokenName()} as ${
          data.type
        } validator, with ${data.pubkeys.length} ${
          data.pubkeys.length === 1 ? "public key" : "public keys"
        }.`;
      }

      if (notice.type === "Validator Stake") {
        data = notice.data as NoticeValidatorDepositData;
        return `Stake ${formatNumber(data.amount)} ${getTokenName()} as ${
          data.type
        } validator, with ${data.pubkeys.length} ${
          data.pubkeys.length === 1 ? "public key" : "public keys"
        }.`;
      }

      if (notice.type === "Withdraw") {
        data = notice.data as NoticeWithdrawData;
        return `Withdraw ${formatNumber(data.tokenAmount)} ${getTokenName()}.`;
      }

      if (notice.type === "Claim Rewards") {
        data = notice.data as NoticeValidatorClaimData;
        return `Claim ${formatNumber(data.rewardAmount)} ${
          data.rewardTokenName
        } as validator rewards`;
      }

      // if (notice.type === "Stake") {
      //   data = notice.data as NoticeStakeData;
      //   return `Stake ${formatNumber(
      //     data.amount
      //   )} ${getTokenName()} from your Wallet to LSD Pool Contract, and receive ${formatNumber(
      //     data.willReceiveAmount
      //   )} ${getLsdTokenName()}.`;
      // }
      // if (notice.type === "Unstake") {
      //   data = notice.data as NoticeUnstakeData;
      //   if (!data.needWithdraw) {
      //     return `Unstake ${formatNumber(
      //       data.amount
      //     )} ${getLsdTokenName()} from LSD Pool Contract to your wallet, and receive ${formatNumber(
      //       data.willReceiveAmount
      //     )} ${getTokenName()}.`;
      //   } else {
      //     return `Unstake ${formatNumber(
      //       data.amount
      //     )} ${getLsdTokenName()} from LSD Pool Contract to your wallet.`;
      //   }
      // }
      // if (notice.type === "Withdraw" || notice.type === "Validator Withdraw") {
      //   data = notice.data as NoticeWithdrawData;
      //   return `Withdraw ${formatNumber(data.tokenAmount)} ${getTokenName()}.`;
      // }
    } catch (err: unknown) {}

    return "";
  };

  const getNoticeUrl = (notice: LocalNotice): string | undefined => {
    try {
      return notice.scanUrl;
      // let data;
      // if (notice.type === "Fee Station") {
      //   data = notice.data as NoticeFeeStationData;
      //   if (data.payTxHash) {
      //     return `${notice.explorerUrl}/tx/${data.payTxHash}`;
      //   }
      //   return `${notice.explorerUrl}/account/${notice.txDetail.address}`;
      // } else {
      //   return `${notice.explorerUrl}/tx/${notice.txDetail.transactionHash}`;
      // }
    } catch (err: unknown) {}

    return "";
  };

  const onClickItem = () => {
    if (notice.type === "Withdraw") {
      if (notice.status === "Confirmed") {
        openLink(getNoticeUrl(notice));
      }
    } else {
      openLink(getNoticeUrl(notice));
    }
  };

  return (
    <div className={classNames(darkMode ? "dark" : "")}>
      <div
        className={classNames(
          "cursor-pointer mt-[.08rem] p-[16px] bg-hover rounded-[.12rem]"
        )}
        onClick={() => {
          onClickItem();
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            <div className="w-[.34rem] h-[.34rem] relative">
              <Image src={getNoticeIcon(notice)} alt="icon" layout="fill" />
            </div>

            <div className="ml-[12px] font-[700] text-color-text1 text-[16px]">
              {notice.type}
            </div>

            <div
              className={classNames(
                "ml-[.06rem] h-[.2rem] rounded-[.04rem] px-[.04rem] flex items-center text-[12px]",
                notice.status === "Confirmed"
                  ? "bg-bgSuccess text-text1 dark:text-white "
                  : notice.status === "Error"
                  ? "bg-[#FEA4FF80] text-error dark:text-white "
                  : "bg-text2/20 text-text1 dark:text-white "
              )}
            >
              {getNoticeStatus(notice)}
            </div>
          </div>

          <div className="text-text2 text-[14px] opacity-50">
            {formatDate(notice.timestamp || 0, "DD MMM HH:mm")}
          </div>
        </div>

        <div className="mt-[.1rem]">
          <div className="text-text2 text-[14px] leading-normal">
            {getNoticeContent(notice)}
          </div>
        </div>
      </div>
    </div>
  );
};
