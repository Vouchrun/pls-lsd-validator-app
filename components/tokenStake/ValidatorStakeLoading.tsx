import classNames from "classnames";
import { CardContainer } from "components/common/CardContainer";
import { PrimaryLoading } from "components/common/PrimaryLoading";
import { roboto } from "config/font";
import { useAppDispatch, useAppSelector } from "hooks/common";
import Image from "next/image";
import { useMemo } from "react";
import { RootState } from "redux/store";
import successIcon from "public/images/tx_success.png";
import errorIcon from "public/images/tx_error.png";
import { getTokenName } from "utils/configUtils";
import { Icomoon } from "components/icon/Icomoon";

export const ValidatorStakeLoading = () => {
  const dispatch = useAppDispatch();

  const { validatorStakeLoadingParams, darkMode } = useAppSelector(
    (state: RootState) => {
      return {
        validatorStakeLoadingParams: state.app.validatorStakeLoadingParams,
        darkMode: state.app.darkMode,
      };
    }
  );

  const title = useMemo(() => {
    return validatorStakeLoadingParams?.status === "success"
      ? `${
          validatorStakeLoadingParams?.stakeAmount
        } ${getTokenName()} staked successfully!`
      : validatorStakeLoadingParams?.status === "error"
      ? "Transaction Failed"
      : `You are now staking ${
          validatorStakeLoadingParams?.stakeAmount
        } ${getTokenName()}`;
  }, [validatorStakeLoadingParams]);

  const secondaryMsg = useMemo(() => {
    return validatorStakeLoadingParams?.customMsg
      ? validatorStakeLoadingParams.customMsg
      : validatorStakeLoadingParams?.status === "success"
      ? `You are now onboard`
      : validatorStakeLoadingParams?.status === "error"
      ? "Something went wrong, please try again later"
      : `Submitting on chain, ${
          validatorStakeLoadingParams?.stakeAmount
        } ${getTokenName()} are being staked in your validator`;
  }, [validatorStakeLoadingParams]);

  return (
    <CardContainer title="Stake" width="6.2rem">
      <div
        className={classNames(
          "flex-1 flex flex-col items-center",
          darkMode ? "dark" : "",
          roboto.className
        )}
      >
        {(validatorStakeLoadingParams?.status === "loading" ||
          !validatorStakeLoadingParams?.status) && (
          <div className="mt-[.5rem] w-[.8rem] h-[.8rem]">
            <PrimaryLoading size=".8rem" />
          </div>
        )}
        {validatorStakeLoadingParams?.status === "success" && (
          <div className="mt-[.5rem] w-[.8rem] h-[.8rem] relative">
            <Image src={successIcon} alt="success" layout="fill" />
          </div>
        )}
        {validatorStakeLoadingParams?.status === "error" && (
          <div className="mt-[.5rem] w-[.8rem] h-[.8rem] relative">
            <Image src={errorIcon} alt="error" layout="fill" />
          </div>
        )}
        <div
          className={classNames(
            "mx-[.36rem] mt-[.24rem] text-[.24rem] text-color-text1 font-[700] text-center leading-tight"
          )}
        >
          {title}
        </div>
        <div
          className={classNames(
            "mx-[.36rem] mt-[.2rem] leading-tight text-center text-[.16rem] text-color-text2"
          )}
          style={{
            maxLines: 3,
            WebkitLineClamp: 3,
            lineClamp: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
          }}
        >
          {secondaryMsg}
        </div>

        {validatorStakeLoadingParams?.scanUrl && (
          <a
            className="mt-[.32rem] flex items-center"
            href={validatorStakeLoadingParams?.scanUrl || ""}
            target="_blank"
            rel="noreferrer"
          >
            <span className="text-color-link text-[.16rem] mr-[.12rem] font-[500]">
              View on explorer
            </span>

            <Icomoon
              icon="right"
              size=".12rem"
              color={darkMode ? "#ffffff" : "#5A5DE0"}
            />
          </a>
        )}

        <a
          className="my-[.32rem] underline text-color-text2 text-[.12rem]"
          href="https://t.me/vouchrun"
          target="_blank"
          rel="noreferrer"
        >
          Go for community help
        </a>
      </div>
    </CardContainer>
  );
};
