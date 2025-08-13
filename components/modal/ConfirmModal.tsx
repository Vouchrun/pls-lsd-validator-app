import { Box, Modal } from "@mui/material";
import classNames from "classnames";
import { CustomButton } from "components/common/CustomButton";
import { Icomoon } from "components/icon/Icomoon";
import { robotoBold } from "config/font";
import { useAppDispatch } from "hooks/common";
import { useAppSlice } from "hooks/selector";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  content: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = (props: ConfirmModalProps) => {
  const { darkMode } = useAppSlice();

  return (
    <Modal
      open={props.visible}
      onClose={props.onClose}
      sx={{
        backgroundColor: "#0A131Bba",
      }}
    >
      <Box
        pt="0"
        pl="0"
        pr="0"
        pb="0"
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
            "flex flex-col items-stretch",
            darkMode ? "dark" : ""
          )}
        >
          <div
            className="self-end mr-[.24rem] mt-[24px] cursor-pointer"
            onClick={props.onClose}
          >
            <Icomoon icon="close" size=".16rem" />
          </div>

          <div
            className={classNames(
              "mx-[.36rem] mt-[-0.1rem] text-[.24rem] text-color-text1 font-[700] text-center leading-normal",
              robotoBold.className
            )}
          >
            {props.title}
          </div>

          <div className="px-[.24rem] mt-[.12rem] text-[.16rem] text-color-text2 text-center leading-normal">
            {props.content}
          </div>

          <div className="mt-[24px] px-[.24rem]">
            <CustomButton height=".56rem" onClick={props.onConfirm}>
              {props.confirmText}
            </CustomButton>
          </div>

          <div
            className="cursor-pointer mt-[.16rem] text-center text-color-text2 text-[.14rem] mb-[.24rem]"
            onClick={props.onClose}
          >
            Never Mind
          </div>
        </div>
      </Box>
    </Modal>
  );
};
