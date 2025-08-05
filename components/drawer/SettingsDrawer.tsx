import { Drawer, TextField, Typography } from "@mui/material";
import classNames from "classnames";
import { IOSSwitch } from "components/common/CustomSwitch";
import { MenuItem } from "components/common/MenuItem";
import { Icomoon } from "components/icon/Icomoon";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { setDarkMode, setCustomRpc } from "redux/reducers/AppSlice";
import { RootState } from "redux/store";
import { openLink } from "utils/commonUtils";
import { getContactList, getExternalLinkList } from "utils/configUtils";
import { getEthereumRpc } from "config/env";

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const SettingsDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;
  const dispatch = useAppDispatch();
  const { darkMode, customRpc } = useAppSelector((state: RootState) => {
    return {
      darkMode: state.app.darkMode,
      customRpc: state.app.customRpc,
    };
  });

  const getContactIcon = (type: string) => {
    if (darkMode) {
      return `${type.toLowerCase()}-dark`;
    }
    return type.toLowerCase();
  };

  return (
    <Drawer
      anchor={"right"}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        "& .MuiPaper-root": {
          background: darkMode ? "#1B1B1F" : "#E8EFFD",
          width: "5.5rem",
          paddingTop: "1rem",
        },
      }}
    >
      <div className="pb-[1rem] flex-1 flex flex-col justify-between items-stretch">
        <div>
          <div className="px-[.36rem]">
            <div className="ml-[.24rem] mt-[.56rem] flex items-center">
              <div className="text-[.16rem] text-color-text2 mr-[.16rem]">
                Dark Mode
              </div>

              <IOSSwitch
                // darkMode={darkMode}
                checked={darkMode}
                onChange={(e) => {
                  dispatch(setDarkMode(e.target.checked));
                }}
              />
            </div>

            <div className="mt-[.32rem] h-[0.01rem] bg-color-divider2" />

            <div className="px-[.24rem] mt-[.36rem]">
              <Typography className="text-[.16rem] text-color-text2 mb-[.16rem]">
                RPC Settings
              </Typography>
              <Typography className="text-[.14rem] text-color-text2 mb-[.16rem]">
                Default RPC: {getEthereumRpc()}
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter custom RPC URL"
                value={customRpc || ""}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  dispatch(setCustomRpc(value || undefined));
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: darkMode ? "#2D2D32" : "#E8EFFD",
                    },
                    "&:hover fieldset": {
                      borderColor: darkMode ? "#2D2D32" : "#E8EFFD",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: darkMode ? "#2D2D32" : "#E8EFFD",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: darkMode ? "#fff" : "#000",
                    fontSize: ".14rem",
                  },
                }}
              />
            </div>

            <div className="mt-[.32rem] h-[0.01rem] bg-color-divider2" />

            <div className="ml-[.24rem]">
              {getExternalLinkList().map(
                (item: { name: string; link: string }) => (
                  <MenuItem
                    key={item.name}
                    mt=".36rem"
                    text={item.name}
                    link={item.link}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className="pl-[.56rem] flex items-center">
          {getContactList().map(
            (item: { type: string; link: string }, index: number) => (
              <div
                key={item.type}
                className={classNames(
                  "cursor-pointer",
                  index > 0 ? "ml-[.4rem]" : ""
                )}
                onClick={() => {
                  openLink(item.link);
                }}
              >
                <Icomoon icon={getContactIcon(item.type)} size=".48rem" />
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
};
