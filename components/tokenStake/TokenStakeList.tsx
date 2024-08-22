import classNames from "classnames";
import { CustomButton } from "components/common/CustomButton";
import { EmptyContent } from "components/common/EmptyContent";
import { LoadingContent } from "components/common/LoadingContent";
import { Icomoon } from "components/icon/Icomoon";
import { getValidatorProfileUrl } from "config/explorer";
import { robotoSemiBold } from "config/font";
import { useAppSlice } from "hooks/selector";
import { useIsTrustedValidator } from "hooks/useIsTrustedValidator";
import { usePubkeysHome } from "hooks/usePubkeysHome";
import { useWalletAccount } from "hooks/useWalletAccount";
import { PubkeyStatus } from "interfaces/common";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { isPubkeyStakeable, openLink } from "utils/commonUtils";
import snackbarUtil from "utils/snackbarUtils";
import { getShortAddress } from "utils/stringUtils";
import { TokenStakeListTabs } from "./TokenStakeListTabs";

export const TokenStakeList = () => {
  const router = useRouter();
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const [page, setPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState("All");
  const { isTrust } = useIsTrustedValidator();

  const selectedStatus = useMemo(() => {
    switch (selectedTab) {
      case "All":
        return undefined;
      case "Unmatched":
        return PubkeyStatus.Unmatched;
      case "Staked":
        return PubkeyStatus.Staked;
      case "Others":
        return PubkeyStatus.Others;
    }
  }, [selectedTab]);

  const {
    showLoading,
    showEmptyContent,
    displayPubkeyInfos,
    totalCount,
    unmatchedCount,
    stakedCount,
    othersCount,
  } = usePubkeysHome(metaMaskAccount, page, selectedStatus);
  // } = useNodePubkeys(
  //   "0x99C6a3B0d131C996D9f65275fB5a196a8B57B583",
  //   page,
  //   statusList
  // );

  const displaySoloPubkeyInfos = displayPubkeyInfos.filter(
    (item) => item.type === "solo"
  );

  const displayTrustPubkeyInfos = displayPubkeyInfos.filter(
    (item) => item.type === "trusted"
  );

  const showGroupStakeButton =
    displayTrustPubkeyInfos.filter(
      (item) => item.canStake && isPubkeyStakeable(item._status)
    ).length > 1 ||
    displaySoloPubkeyInfos.filter(
      (item) => item.canStake && isPubkeyStakeable(item._status)
    ).length > 1;

  return (
    <div>
      <div className="pt-[.24rem] flex items-center justify-between">
        <div className="flex items-center">
          <TokenStakeListTabs
            selectedTab={selectedTab}
            onChange={setSelectedTab}
            totalCount={totalCount}
            unmatchedCount={unmatchedCount}
            stakedCount={stakedCount}
            othersCount={othersCount}
          />

          <div className="ml-[.24rem]">
            <CustomButton
              type="stroke"
              height=".42rem"
              className="px-[.16rem]"
              onClick={() => {
                router.push("/tokenStake/chooseType");
              }}
            >
              <div className="flex items-center">
                <div>New Deposit</div>

                <div className="ml-[.06rem] rotate-[-90deg]">
                  <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
                </div>
              </div>
            </CustomButton>
          </div>
        </div>

        {showGroupStakeButton && (
          <div className="mr-[.24rem]">
            <CustomButton
              type="stroke"
              className="px-[.16rem]"
              height=".42rem"
              onClick={() => {
                const stakeablePubkeyInfos = (
                  displaySoloPubkeyInfos.length > 1
                    ? displaySoloPubkeyInfos
                    : displayTrustPubkeyInfos
                ).filter((item) => isPubkeyStakeable(item._status));

                if (stakeablePubkeyInfos.length === 0) {
                  return;
                }

                const pubkeyAddressList = stakeablePubkeyInfos.map(
                  (item) => item.pubkeyAddress
                );

                router.push(
                  {
                    pathname: "/tokenStake/stake",
                    query: {
                      pubkeyAddressList: pubkeyAddressList,
                      type: isTrust ? "trusted" : "solo",
                    },
                  },
                  "/tokenStake/stake"
                );
              }}
            >
              <div className="flex items-center">
                <div>
                  Group Stake Avaliable{" "}
                  {displaySoloPubkeyInfos.length > 1 ? "Solo" : "Trusted"} Nodes
                </div>

                <div className="ml-[.06rem] rotate-[-90deg]">
                  <Icomoon icon="arrow-down" size=".1rem" color="#848B97" />
                </div>
              </div>
            </CustomButton>
          </div>
        )}
      </div>

      <div className="mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]">
        <div
          className={classNames(
            "h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#222C3C]",
            robotoSemiBold.className
          )}
          style={{
            gridTemplateColumns: "20% 20% 20% 40%",
          }}
        >
          <div className="flex items-center justify-center text-[.16rem] text-color-text2">
            Pool Addr
          </div>

          <div className="flex items-center justify-center text-[.16rem] text-color-text2">
            Node Addr
          </div>

          <div className="flex items-center justify-center text-[.16rem] text-color-text2">
            Status
          </div>
        </div>

        {showEmptyContent && (
          <div className="h-[2rem] flex items-center justify-center">
            <EmptyContent />
          </div>
        )}

        {showLoading && (
          <div className="h-[2rem] flex items-center justify-center relative">
            <LoadingContent />
          </div>
        )}

        <div className="max-h-[4.2rem] overflow-auto">
          {displayPubkeyInfos.map((pubkeyInfo, index) => (
            <div
              key={index}
              className={classNames(
                "h-[.74rem] grid items-center font-[500]",
                index % 2 === 0 ? "bg-bgPage/50 dark:bg-bgPageDark/50" : ""
              )}
              style={{
                gridTemplateColumns: "20% 20% 20% 40%",
              }}
            >
              <div className="flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer">
                <Icomoon
                  icon="copy"
                  size=".133rem"
                  color={darkMode ? "#ffffff80" : "#6C86AD"}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(pubkeyInfo.pubkeyAddress)
                      .then(() => {
                        snackbarUtil.success("Copy success");
                      });
                  }}
                />

                <div
                  className="flex items-center"
                  onClick={() => {
                    router.push(`/pubkey/${pubkeyInfo.pubkeyAddress}`);
                  }}
                >
                  <div className="mx-[.06rem]">
                    {getShortAddress(pubkeyInfo.pubkeyAddress, 4)}
                  </div>

                  <Icomoon
                    icon="right1"
                    size=".12rem"
                    color={darkMode ? "#ffffff80" : "#6C86AD"}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer">
                <Icomoon
                  icon="copy"
                  size=".133rem"
                  color={darkMode ? "#ffffff80" : "#6C86AD"}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(metaMaskAccount || "")
                      .then(() => {
                        snackbarUtil.success("Copy success");
                      });
                  }}
                />

                <div
                  className="flex items-center"
                  onClick={() => {
                    openLink(getValidatorProfileUrl(metaMaskAccount || ""));
                  }}
                >
                  <div className="mx-[.06rem]">
                    {getShortAddress(metaMaskAccount, 4)}
                  </div>

                  <Icomoon
                    icon="right1"
                    size=".12rem"
                    color={darkMode ? "#ffffff80" : "#6C86AD"}
                  />
                </div>
              </div>

              <div
                className={classNames(
                  "flex items-center justify-center text-[.16rem] ",
                  pubkeyInfo.displayStatus === "Exited"
                    ? "text-error"
                    : pubkeyInfo.displayStatus === "Active"
                    ? "text-color-text1"
                    : "text-color-text2"
                )}
              >
                {!pubkeyInfo.canStake && pubkeyInfo.displayStatus === "Matched"
                  ? "Unmatch"
                  : pubkeyInfo.displayStatus}
              </div>

              <div className="flex items-center justify-end pr-[.56rem] text-[.16rem] text-color-text2">
                {pubkeyInfo.canStake &&
                  isPubkeyStakeable(pubkeyInfo._status) && (
                    <CustomButton
                      height=".42rem"
                      className="px-[.5rem]"
                      onClick={() => {
                        router.push(
                          {
                            pathname: "/tokenStake/stake",
                            query: {
                              pubkeyAddressList: [pubkeyInfo.pubkeyAddress],
                              type: isTrust ? "trusted" : "solo",
                            },
                          },
                          "/tokenStake/stake"
                        );
                      }}
                    >
                      Stake
                    </CustomButton>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
