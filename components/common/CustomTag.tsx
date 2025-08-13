import classNames from "classnames";

type CustomTagProps = React.PropsWithChildren<{
  type?: "stroke" | "active" | "pending" | "apr" | "error";
  ml?: string;
}>;

export const CustomTag = (props: CustomTagProps) => {
  const { type, ml } = props;

  return (
    <div
      className={classNames(
        "rounded-[.06rem] px-[.06rem] py-[.04rem] text-[12px] flex items-center justify-center",
        type === "error" ? "text-error" : "text-text1",
        {
          "border-[0.01rem] border-text1/10 dark:border-text1Dark/10":
            type === "stroke",
        }
      )}
      style={{
        background:
          !type || type === "active"
            ? "linear-gradient(274.04deg, #80CAFF 31.26%, #00F3AB 117.22%)"
            : type === "pending"
            ? "#FFCD294D"
            : type === "apr"
            ? "linear-gradient(275.73deg, #FFCD29 35.79%, #FEA4FF 97.61%)"
            : type === "error"
            ? "#FEA4FF4D"
            : "none",
        marginLeft: ml || "0",
      }}
    >
      {props.children}
    </div>
  );
};
