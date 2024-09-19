import classNames from "classnames";
import { Icomoon } from "components/icon/Icomoon";
import { getValidatorTotalDepositAmount } from "config/env";
import { robotoBold } from "config/font";
import { useAppSlice } from "hooks/selector";
import { useSoloNodeDepositAmount } from "hooks/useSoloNodeDepositAmount";
import { getTokenName } from "utils/configUtils";
import { formatNumber } from "utils/numberUtils";

export const ChooseTypeGuide = () => {
  const { darkMode } = useAppSlice();

  const { soloNodeDepositAmount } = useSoloNodeDepositAmount();

  return (
    <div className="">
      <a
        className="text-[.24rem] text-color-text1 inline-flex items-center"
        href="https://vouch.run/docs/validator_guide/getting_started.html"
        target="_blank"
        rel="noreferrer"
      >
        <div className="mr-[.16rem]">Guide</div>

        <Icomoon
          icon="right"
          color={darkMode ? "#ffffff80" : "#6C86AD"}
          size=".11rem"
        />
      </a>

      <div className="mt-[.12rem] rounded-[.16rem] w-[4.3rem] bg-[#6C86AD14] p-[.2rem] h-[3.67rem]">
        <div
          className={classNames(
            "text-color-text2 text-[.16rem]",
            robotoBold.className
          )}
        >
          Nodes Comparison
        </div>

        <div className="text-color-text2 text-[.14rem] py-[.1rem] mt-[.16rem] leading-normal">
          {soloNodeDepositAmount && Number(soloNodeDepositAmount) > 0 && (
            <>
              Deposit{" "}
              <span className={robotoBold.className}>
                {formatNumber(soloNodeDepositAmount, { fixedDecimals: false })}{" "}
                {getTokenName()}
              </span>{" "}
              to register as a Solo validator on StaFi; StaFi will match{" "}
              <span className={robotoBold.className}>
                {formatNumber(
                  getValidatorTotalDepositAmount() -
                    Number(soloNodeDepositAmount),
                  { fixedDecimals: false }
                )}{" "}
                {getTokenName()}
              </span>{" "}
              to your node so that it can meet the validator conditions of{" "}
              {getTokenName()}.
              <div className="mt-[.1rem]" />
            </>
          )}
          If you are a{" "}
          <span className={robotoBold.className}>trusted validator</span>, you
          don't need to deposit {getTokenName()} yourself.
        </div>
      </div>
    </div>
  );
};
