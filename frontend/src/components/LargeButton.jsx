import { ShimmerButton } from "@/components/ui/shimmer-button";

function LargeButton({
  icon,
  text,
  onClick,
  type = "button",
  disabled = false,
  tone = "primary",
}) {
  const isSecondary = tone === "secondary";
  const style = isSecondary
    ? "!bg-[#edf6df] !text-[#2f4a33] border-[#ccdbb4]"
    : "!bg-[#2f7d35] !text-white border-[#276a2d]";

  return (
    <ShimmerButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      background={isSecondary ? "#edf6df" : "#2f7d35"}
      shimmerColor={isSecondary ? "#9ac48a" : "#d2efce"}
      shimmerDuration="2.8s"
      borderRadius="1rem"
      className={`w-full justify-start rounded-2xl px-4 py-4 text-left text-lg font-bold shadow-sm transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 ${style}`}
    >
      <span className="mr-2 text-xl">{icon}</span>
      {text}
    </ShimmerButton>
  );
}

export default LargeButton;
