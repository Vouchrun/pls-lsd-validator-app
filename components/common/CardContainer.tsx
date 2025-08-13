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
          "rounded-t-[.3rem] h-auto flex items-center justify-center text-[20px] md:text-[24px] text-color-text1 py-[15px] px-[8px] text-center",
          robotoBold.className
        )}
        style={{
          background:
            "linear-gradient(274.08deg, rgba(128, 202, 255, 0.2) 1.81%, rgba(133, 224, 163, 0.2) 96.22%)",
        }}
      >
        {props.title}
      </div>

      <div className="rounded-b-[.3rem]">{props.children}</div>
    </div>
  );
};
