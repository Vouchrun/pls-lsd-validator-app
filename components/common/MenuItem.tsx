import { Icomoon } from "components/icon/Icomoon";
import { openLink } from "utils/commonUtils";

interface Props {
  text: string;
  link: string;
  mt?: string;
}

export const MenuItem = (props: Props) => {
  return (
    <div
      className="cursor-pointer flex items-center justify-between"
      style={{
        marginTop: props.mt || "0",
      }}
      onClick={() => {
        openLink(props.link);
      }}
    >
      <div
        className="text-[#6C86AD] text-[16px] font-[500] flex-1"
        style={{
          maxLines: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          WebkitLineClamp: 1,
          lineClamp: 1,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
        }}
      >
        {props.text}
      </div>

      <Icomoon icon="right" size="12px" color="#6C86AD" />
    </div>
  );
};
