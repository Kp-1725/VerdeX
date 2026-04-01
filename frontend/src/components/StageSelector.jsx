import { STAGE_OPTIONS } from "../utils/constants";

function StageSelector({ selectedStage, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STAGE_OPTIONS.map((stage) => {
        const emoji =
          stage === "Harvested"
            ? "🌱"
            : stage === "Packed"
              ? "📦"
              : stage === "In Transport"
                ? "🚚"
                : "🏪";

        const isSelected = selectedStage === stage;

        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelect(stage)}
            className={`rounded-2xl border px-3 py-4 text-left font-bold transition ${
              isSelected
                ? "border-[#2c7835] bg-[#d7f2cd] text-[#1f5d2f]"
                : "border-[#d5e0bf] bg-[#f5faeb] text-[#2d4532]"
            }`}
          >
            <div className="text-xl">{emoji}</div>
            <div className="mt-1 text-sm">{stage}</div>
          </button>
        );
      })}
    </div>
  );
}

export default StageSelector;
