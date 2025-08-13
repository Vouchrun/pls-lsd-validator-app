import { useAppSlice } from "hooks/selector";
import Image from "next/image";
import arrowLeftImg from "public/images/arrow_left.svg";
import arrowLeftLightImg from "public/images/arrow_left_light.svg";

interface BackNavigationProps {
  onClick: () => void;
}

export const BackNavigation = (props: BackNavigationProps) => {
  const { darkMode } = useAppSlice();

  return (
    <div className="flex ">
      <div
        className="h-[40px] rounded-[12px] bg-color-bg2 text-color-text1 text-[16px] flex justify-between items-center px-[16px] gap-[.08rem] cursor-pointer"
        onClick={props.onClick}
      >
        <div className="w-[13px] h-[12px] relative text-color-text1">
          <Image
            src={darkMode ? arrowLeftLightImg : arrowLeftImg}
            layout="fill"
            alt="arrow"
          />
        </div>
        Back
      </div>
    </div>
  );
};
