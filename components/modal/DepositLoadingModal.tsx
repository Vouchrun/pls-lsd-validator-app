import { Box, Modal } from "@mui/material";
import classNames from "classnames";
import { CustomButton } from "components/common/CustomButton";
import { PrimaryLoading } from "components/common/PrimaryLoading";
import { Icomoon } from "components/icon/Icomoon";
import { roboto, robotoBold } from "config/font";
import { useAppDispatch, useAppSelector } from "hooks/common";
import Image from "next/image";
import { useRouter } from "next/router";
import errorIcon from "public/images/tx_error.png";
import successIcon from "public/images/tx_success.png";
import { useMemo } from "react";
import {
  setDepositLoadingParams,
  updateDepositLoadingParams,
} from "redux/reducers/AppSlice";
import { RootState } from "redux/store";

export const DepositLoadingModal = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { depositLoadingParams, darkMode } = useAppSelector(
    (state: RootState) => {
      return {
        depositLoadingParams: state.app.depositLoadingParams,
        darkMode: state.app.darkMode,
      };
    }
  );

  const secondaryMsg = useMemo(() => {
    return depositLoadingParams?.customMsg
      ? depositLoadingParams.customMsg
      : depositLoadingParams?.status === "success"
      ? `File need to be checked before delegation, it may take about 5 minutes, please wait for a moment…`
      : depositLoadingParams?.status === "error"
      ? "Something went wrong, please try again later"
      : "Deposit processing, please wait for a moment";
  }, [depositLoadingParams]);

  const closeModal = () => {
    if (depositLoadingParams?.status === "success") {
      dispatch(setDepositLoadingParams(undefined));
      router.push("/tokenStake/list");
    } else if (depositLoadingParams?.status !== "loading") {
      dispatch(setDepositLoadingParams(undefined));
    } else {
      dispatch(updateDepositLoadingParams({ modalVisible: false }));
    }
  };

  return (
    <Modal
      open={depositLoadingParams?.modalVisible === true}
      onClose={closeModal}
    >
      <Box
        pt="0"
        sx={{
          backgroundColor: darkMode ? "#38475D" : "#ffffff",
          width: "3.5rem",
          borderRadius: "0.16rem",
          outline: "none",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className={classNames(
            "flex-1 flex flex-col items-center",
            darkMode ? "dark" : "",
            roboto.className
          )}
        >
          <div
            className={classNames(
              "mr-[.24rem] self-end mt-[24px] cursor-pointer"
            )}
            onClick={closeModal}
          >
            <Icomoon
              icon="close"
              size=".16rem"
              color={darkMode ? "#FFFFFF80" : "#6C86AD80"}
            />
          </div>

          {depositLoadingParams?.status === "loading" && (
            <div className="mt-[.0rem] mb-[.24rem]  w-[.8rem] h-[.8rem] relative">
              <PrimaryLoading size=".8rem" />
            </div>
          )}

          {depositLoadingParams?.status === "success" && (
            <div className="mt-[.0rem] mb-[.24rem]  w-[.8rem] h-[.8rem] relative">
              <Image src={successIcon} alt="success" layout="fill" />
            </div>
          )}

          {depositLoadingParams?.status === "error" && (
            <div className="mt-[.0rem] mb-[.24rem] w-[.8rem] h-[.8rem] relative">
              <Image src={errorIcon} alt="error" layout="fill" />
            </div>
          )}

          <div
            className={classNames(
              "mx-[.36rem] mt-[.0rem] text-[.24rem] text-color-text1 font-[700] text-center leading-normal",
              robotoBold.className
            )}
          >
            {depositLoadingParams?.status === "loading"
              ? "Wait..."
              : depositLoadingParams?.status === "success"
              ? "File Submitted!"
              : depositLoadingParams?.status === "error"
              ? "Error"
              : ""}
          </div>

          <div
            className={classNames(
              "mx-[.36rem] mt-[.2rem] leading-normal text-center text-[.16rem] text-color-text2"
            )}
            style={{
              WebkitLineClamp: 3,
              lineClamp: 3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
          >
            {secondaryMsg}
          </div>

          <div className="self-stretch m-[.24rem]">
            {depositLoadingParams?.status === "success" && (
              <CustomButton height=".56rem" onClick={closeModal}>
                Ok, I Understand
              </CustomButton>
            )}
          </div>
        </div>
      </Box>
    </Modal>
  );
};
