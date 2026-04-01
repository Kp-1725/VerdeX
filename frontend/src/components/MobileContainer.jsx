import BottomNav from "./BottomNav";
import { useNavigate } from "react-router-dom";
import { useDeviceType } from "../hooks/useDeviceType";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

function MobileContainer({
  title,
  subtitle,
  children,
  showNav = false,
  showBack = false,
  backTo = "/",
}) {
  const navigate = useNavigate();
  const { deviceType, isMobile, isTablet, isDesktop } = useDeviceType();
  const showDebugDeviceTag = import.meta.env.DEV;
  const deviceLabel =
    deviceType === "mobile"
      ? "Mobile"
      : deviceType === "tablet"
        ? "Tablet"
        : "Desktop";

  const shellClass = isDesktop
    ? "mx-auto w-full max-w-[1180px] grid grid-cols-[280px_minmax(0,1fr)] gap-6"
    : "mx-auto w-full max-w-[760px]";

  const contentCardClass = isMobile
    ? "mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[400px] flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]"
    : isTablet
      ? "mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]"
      : "mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-none flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]";

  function onBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(backTo, { replace: true });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dff5dc,_#f5f9eb_40%,_#f9f6ef)] px-3 py-3 sm:py-6 lg:px-6">
      <AnimatedGridPattern
        width={48}
        height={48}
        numSquares={30}
        maxOpacity={0.6}
        duration={9}
        repeatDelay={2.2}
        className="z-0 text-[#4f7a4d] [mask-image:radial-gradient(ellipse_at_top,white_30%,transparent_80%)]"
      />

      <div className={`${shellClass} relative z-10`}>
        {isDesktop ? (
          <aside className="flex flex-col rounded-3xl border border-[#d3dcbf] bg-[#eff6de] p-6 shadow-[0_20px_45px_rgba(73,93,44,0.12)]">
            <h2 className="font-title text-3xl leading-tight text-[#21412f]">
              Agri Trace
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#426447]">
              Track every product from farm to market with simple, clear steps.
            </p>

            <div className="mt-6 rounded-2xl border border-[#c9dcb0] bg-[#f8fcef] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#537154]">
                How It Works
              </p>
              <ol className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9efcb] text-xs font-black text-[#265e34]">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#284a31]">
                      Add product
                    </p>
                    <p className="text-xs text-[#5b725a]">
                      Farmer creates item and QR.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9efcb] text-xs font-black text-[#265e34]">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#284a31]">
                      Update status
                    </p>
                    <p className="text-xs text-[#5b725a]">
                      Farmer or retailer updates stage.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#d9efcb] text-xs font-black text-[#265e34]">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#284a31]">
                      Public tracking
                    </p>
                    <p className="text-xs text-[#5b725a]">
                      Consumer scans and views journey.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#cddfb6] bg-white px-3 py-2 text-xs font-bold text-[#355938]">
                👨‍🌾 Farmer
              </div>
              <div className="rounded-xl border border-[#cddfb6] bg-white px-3 py-2 text-xs font-bold text-[#355938]">
                🚚 Retailer
              </div>
              <div className="col-span-2 rounded-xl border border-[#cddfb6] bg-white px-3 py-2 text-xs font-bold text-[#355938]">
                🔍 Public QR tracking, no login
              </div>
            </div>

            <div className="mt-auto rounded-2xl border border-[#c9dcb0] bg-[#f8fcef] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#537154]">
                Tip
              </p>
              <p className="mt-1 text-sm text-[#355938]">
                Keep Product IDs short and numeric so field teams can type them
                quickly.
              </p>
            </div>
          </aside>
        ) : null}

        <div className={contentCardClass}>
          <header className="border-b border-[#dfe7c6] bg-[#f4fae8] px-5 py-5">
            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mb-3 rounded-xl border border-[#c7d6af] bg-[#e8f3d6] px-3 py-2 text-sm font-bold text-[#2a4f31]"
              >
                ← Back
              </button>
            ) : null}

            <h1 className="font-title text-3xl leading-tight text-[#27412d]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-[#4b6042]">{subtitle}</p>
            ) : null}

            {showDebugDeviceTag ? (
              <span className="mt-3 inline-flex rounded-lg border border-[#bdd0a2] bg-[#e9f5d5] px-2 py-1 text-[11px] font-bold text-[#2b5231]">
                Device: {deviceLabel}
              </span>
            ) : null}
          </header>

          <main
            className={`fade-in flex-1 space-y-4 px-5 py-5 ${showNav ? "pb-24" : "pb-5"}`}
          >
            {children}
          </main>

          {showNav ? <BottomNav /> : null}
        </div>
      </div>
    </div>
  );
}

export default MobileContainer;
