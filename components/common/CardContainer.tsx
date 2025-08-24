import classNames from "classnames";
import { robotoBold } from "config/font";

type CardContainerProps = React.PropsWithChildren<{
  width: string;
  title: string;
}>;

export const CardContainer = (props: CardContainerProps) => {
  return (
    <div
      className="bg-color-bg2 border-solid border-[.01rem] border-color-border1 rounded-[.3rem]"
      style={{
        width: props.width,
      }}
    >
      <div
        className={classNames(
          "rounded-t-[.3rem] h-auto flex items-center justify-center text-[20px] md:text-[24px] text-color-text1 py-[15px] px-[8px] text-center bg-[#E2E0D0] dark:bg-[#333333]",
          robotoBold.className
        )}
        
      >
        {props.title}
      </div>

      <div className="rounded-b-[.3rem]">{props.children}</div>
    </div>
  );
};
