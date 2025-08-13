import { Drawer } from "@mui/material";
import classNames from "classnames";
import { IOSSwitch } from "components/common/CustomSwitch";
import { MenuItem } from "components/common/MenuItem";
import { Icomoon } from "components/icon/Icomoon";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { setDarkMode } from "redux/reducers/AppSlice";
import { RootState } from "redux/store";
import { openLink } from "utils/commonUtils";
import { getContactList, getExternalLinkList } from "utils/configUtils";

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const SettingsDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector((state: RootState) => {
    return { darkMode: state.app.darkMode };
  });

  const getContactIcon = (type: string) => {
    if (darkMode) {
      return `${type.toLowerCase()}-dark`;
    }
    return `${type.toLowerCase()}-dark`;
  };

  return (
    <Drawer
      anchor={"right"}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        "& .MuiPaper-root": {
          background: darkMode ? "#1a1a1a" : "#f3f3ec",
          width: "300px",
          paddingTop: "1rem",
        },
      }}
    >
      <div className="pb-[1rem] flex-1 flex flex-col justify-between items-stretch pt-2">
        <div>
          <div className="px-[36px]">
            <div className="ml-[24px] mt-[56px] flex items-center">
              <div
                className="text-[16px] mr-[16px]"
                style={{ color: darkMode ? "#fff" : "#1b1b1f" }}
              >
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

            <div className="mt-[32px] h-[0.01rem] bg-color-divider2" />

            <div className="ml-[24px]">
              {getExternalLinkList().map(
                (item: { name: string; link: string }) => (
                  <MenuItem
                    key={item.name}
                    mt="36px"
                    text={item.name}
                    link={item.link}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className="pl-[56px] flex items-center">
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
                <Icomoon
                  icon={getContactIcon(item.type)}
                  size="48px"
                  color={darkMode ? "#FFF" : "#000"}
                />
              </div>
            )
          )}
        </div>
      </div>
    </Drawer>
  );
};
