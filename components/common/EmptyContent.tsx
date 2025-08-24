import Image from "next/image";
import empty from "public/images/empty_bird.svg";
import { useAppSlice } from 'hooks/selector';

interface EmptyContentProps {
  hideText?: boolean;
  mt?: string;
  size?: string;
}

export const EmptyContent = (props: EmptyContentProps) => {
  const { darkMode, unreadNoticeFlag } = useAppSlice();
  return (
    <div
      className="flex justify-center"
      style={{
        marginTop: props.mt || "0",
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="relative"
          style={{
            width: props.size || "40px",
            height: props.size || "40px",
          }}
        >
          <Image src={empty} alt="empty" layout="fill" />
        </div>
        {!props.hideText && (
          <div className="mt-[16px] text-[14px]" style={{ color: darkMode ? '#fff' : '#1b1b1f' }}>
            There is Nothing Here
          </div>
        )}
      </div>
    </div>
  );
};
