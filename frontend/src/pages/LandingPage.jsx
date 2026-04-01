import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MagicCard } from "@/components/ui/magic-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/LanguageContext";

function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { language, setLanguage, tr, translateRole, t } = useLanguage();
  const [productId, setProductId] = useState("");
  const [activeUpdateIndex, setActiveUpdateIndex] = useState(0);

  const greeting = useMemo(() => {
    if (!isLoggedIn) {
      return tr("Track farm products from harvest to market");
    }

    return `${tr("Welcome back")}, ${user?.name || t("common.team", "Team")}`;
  }, [isLoggedIn, tr, t, user?.name]);

  const roleLabel = isLoggedIn
    ? translateRole(user?.role || "Member")
    : translateRole("Guest");
  const pulseMessage = !isLoggedIn
    ? tr("Start with instant public traceability.")
    : user?.role === "Farmer"
      ? tr("Publish fresh batches with immutable proof.")
      : user?.role === "Retailer"
        ? tr("Source trusted produce with transparent pricing.")
        : tr("Track trusted journeys across every checkpoint.");
  const snapshotLabel = isLoggedIn ? tr("Session") : tr("Access");
  const snapshotValue = isLoggedIn ? tr("Connected") : tr("Public");

  const liveUpdates = useMemo(() => {
    if (!isLoggedIn) {
      return [
        "Open tracking is live for all public product IDs.",
        "Latest chain proofs are visible in each product timeline.",
        "Create an account to publish and manage verified batches.",
      ];
    }

    if (user?.role === "Farmer") {
      return [
        "Your farm can publish new produce with immutable checkpoints.",
        "Use status updates to keep retailers synced in real time.",
        "Every archive action preserves compliance audit history.",
      ];
    }

    if (user?.role === "Retailer") {
      return [
        "Discover farmers and compare fair-trade sourcing quickly.",
        "Request inbox now reflects accept or reject decisions live.",
        "Track shelf products end-to-end with chain-backed proof.",
      ];
    }

    return [
      "Network health and chain transparency are running normally.",
      "Use quick tracking to validate journey checkpoints instantly.",
      "VerdeX keeps product movement visible from farm to shelf.",
    ];
  }, [isLoggedIn, user?.role]);

  const featureHighlights = useMemo(
    () => [
      {
        icon: "🧾",
        title: "Immutable Chain Proof",
        text: "Every stage update is captured with verifiable history for trusted audits.",
      },
      {
        icon: "🤝",
        title: "Fair Trade Visibility",
        text: "Farmer and retailer pricing can be compared transparently before decisions.",
      },
      {
        icon: "⚡",
        title: "Live Operational Flow",
        text: "Requests, status changes, and tracking updates stay synced in near real time.",
      },
    ],
    [],
  );

  const flowSteps = useMemo(
    () => [
      "Harvest Logged",
      "Transport Verified",
      "Shelf Received",
      "Consumer Tracked",
    ],
    [],
  );

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveUpdateIndex((prev) => (prev + 1) % liveUpdates.length);
    }, 3200);

    return () => window.clearInterval(timerId);
  }, [liveUpdates.length]);

  function onTrack() {
    if (!/^\d+$/.test(productId)) {
      return;
    }

    navigate(`/product/${productId}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#dff5dc,_#f5f9eb_40%,_#f9f6ef)] px-4 py-6 lg:px-8">
      <AnimatedGridPattern
        width={52}
        height={52}
        numSquares={34}
        maxOpacity={0.55}
        duration={10}
        repeatDelay={2.4}
        className="z-0 text-[#4d764a] [mask-image:radial-gradient(ellipse_at_top,white_25%,transparent_80%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <MagicCard
            className="rounded-3xl"
            gradientFrom="#94d87f"
            gradientTo="#5db07d"
            gradientColor="#d8edc6"
            gradientSize={220}
            gradientOpacity={0.12}
          >
            <section className="rounded-3xl border border-[#cce0b5] bg-[#f6fbeb] p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex rounded-full border border-[#c1d5a5] bg-[#e8f5d5] px-3 py-1 text-xs font-bold text-[#2f5a33]">
                  VerdeX Supply Chain Traceability
                </p>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-[#bfd4a4] bg-[#eff8e3] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#3a5b3e]">
                    {tr("Green Verified Network")}
                  </span>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c7d9b1] bg-white px-2 py-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#587255]">
                      {t("language.label", "Language")}
                    </span>
                    <select
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                      className="rounded-lg border border-[#c8d9b3] bg-[#f5fbe9] px-2 py-1 text-xs font-bold text-[#2d5a38] outline-none"
                    >
                      <option value="en">EN</option>
                      <option value="hi">HI</option>
                      <option value="kn">KN</option>
                    </select>
                  </div>
                </div>
              </div>

              <h1 className="mt-4 font-title text-4xl leading-tight text-[#21412f] lg:text-5xl">
                VerdeX
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[#3f6345]">
                {greeting}
              </p>

              <section className="hover-pop relative mt-6 overflow-hidden rounded-2xl border border-[#cdddb7] bg-[linear-gradient(145deg,#f7fcec,#edf7de_58%,#e7f2d8)] p-4 shadow-[0_12px_30px_rgba(81,114,59,0.12)]">
                <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#8fd184]/30 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-[#bddf9b]/30 blur-2xl" />

                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4f6843]">
                      VerdeX Live Pulse
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#214429]">
                      Trust Chain Snapshot
                    </h2>
                    <p className="mt-1 text-sm text-[#496146]">
                      {pulseMessage}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-[#b7d29d] bg-[#eaf6dc] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#2f5f35]">
                    {roleLabel}
                  </span>
                </div>

                <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="hover-pop rounded-xl border border-[#cfe1b9] bg-white/90 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#5d7554]">
                      Ledger Health
                    </p>
                    <p className="mt-1 text-base font-black text-[#2a4f31]">
                      Live + Verified
                    </p>
                  </div>
                  <div className="hover-pop rounded-xl border border-[#cfe1b9] bg-white/90 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#5d7554]">
                      Your Snapshot
                    </p>
                    <p className="mt-1 text-base font-black text-[#2a4f31]">
                      {snapshotLabel}: {snapshotValue}
                    </p>
                  </div>
                  <div className="hover-pop rounded-xl border border-[#cfe1b9] bg-white/90 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#5d7554]">
                      Fair Trade Mode
                    </p>
                    <p className="mt-1 text-base font-black text-[#2a4f31]">
                      On
                    </p>
                  </div>
                </div>

                <div className="relative mt-3 rounded-xl border border-dashed border-[#bdd4a7] bg-[#f8fdf0] px-3 py-2 text-xs font-bold text-[#466045]">
                  <div className="flex items-center justify-between gap-2">
                    <span>Harvest</span>
                    <span className="text-[#86ae74]">● ● ●</span>
                    <span>Blockchain</span>
                    <span className="text-[#86ae74]">● ● ●</span>
                    <span>Shelf</span>
                  </div>
                </div>

                <div className="relative mt-3 rounded-xl border border-[#c8dcaf] bg-white/85 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#60a455] animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4c6847]">
                      Live Update Feed
                    </p>
                  </div>
                  <p
                    key={activeUpdateIndex}
                    className="fade-in mt-1 text-sm font-bold text-[#2f5435]"
                  >
                    {liveUpdates[activeUpdateIndex]}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {liveUpdates.map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === activeUpdateIndex
                            ? "w-7 bg-[#6ca65d]"
                            : "w-3 bg-[#c8dfb5]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <div className="mt-7 flex flex-wrap gap-3">
                {isLoggedIn ? (
                  <ShimmerButton
                    background="#2f7d35"
                    shimmerColor="#d2efce"
                    borderRadius="0.9rem"
                    className="smooth-btn !bg-[#2f7d35] !text-white"
                    onClick={() => navigate("/home")}
                  >
                    🏠 {tr("Open Dashboard")}
                  </ShimmerButton>
                ) : (
                  <>
                    <ShimmerButton
                      background="#2f7d35"
                      shimmerColor="#d2efce"
                      borderRadius="0.9rem"
                      className="smooth-btn !bg-[#2f7d35] !text-white"
                      onClick={() => navigate("/login")}
                    >
                      🔐 {tr("Login")}
                    </ShimmerButton>
                    <ShimmerButton
                      background="#edf6df"
                      shimmerColor="#9ac48a"
                      borderRadius="0.9rem"
                      className="smooth-btn !border-[#93b07d] !bg-[#edf6df] !text-[#2f4a33]"
                      onClick={() => navigate("/register")}
                    >
                      📝 {tr("Register")}
                    </ShimmerButton>
                  </>
                )}
              </div>
            </section>
          </MagicCard>

          <MagicCard
            className="rounded-3xl lg:self-start"
            gradientFrom="#b9e592"
            gradientTo="#84c8a0"
            gradientColor="#dcefcf"
            gradientSize={170}
            gradientOpacity={0.1}
          >
            <aside className="hover-pop rounded-3xl border border-[#cce0b5] bg-[#f8fced] p-6">
              <h2 className="font-title text-3xl text-[#234630]">
                {tr("Quick Track")}
              </h2>
              <p className="mt-2 text-sm text-[#4a694b]">
                {tr("Enter product ID to view full journey instantly.")}
              </p>

              <label className="mt-5 block text-sm font-bold text-[#36523b]">
                {tr("Product ID")}
              </label>
              <input
                value={productId}
                onChange={(e) =>
                  setProductId(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="mt-2 w-full rounded-2xl border border-[#cddab5] bg-white px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
                placeholder="For example: 101"
              />

              <ShimmerButton
                background="#2f7d35"
                shimmerColor="#d2efce"
                borderRadius="0.9rem"
                onClick={onTrack}
                className="smooth-btn mt-4 w-full !bg-[#2f7d35] !text-white"
              >
                🔍 {tr("Track Product")}
              </ShimmerButton>

              <div className="hover-pop mt-5 rounded-2xl border border-[#d6e6c5] bg-[#edf6df] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4f6848]">
                  Quick Tips
                </p>
                <ul className="mt-2 space-y-1.5 text-sm font-semibold text-[#3f5e45]">
                  <li>• Use numeric IDs only</li>
                  <li>• Try common demo IDs like 101 or 1001</li>
                  <li>• Track page shows full lifecycle timeline</li>
                </ul>
              </div>

              <div className="hover-pop mt-3 rounded-2xl border border-[#d6e6c5] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4f6848]">
                  Try Demo IDs
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["101", "1001", "2024"].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setProductId(id)}
                      className="smooth-btn rounded-full border border-[#c8dcb2] bg-[#f4fbeb] px-3 py-1 text-xs font-black text-[#35563b] hover:border-[#aecd8c]"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {!isLoggedIn ? (
                <p className="mt-4 text-xs text-[#5b725a]">
                  Team member?{" "}
                  <Link to="/login" className="font-bold text-[#245c32]">
                    Login here
                  </Link>
                </p>
              ) : null}
            </aside>
          </MagicCard>
        </div>

        <MagicCard
          className="rounded-3xl"
          gradientFrom="#a8dd96"
          gradientTo="#7bbf8e"
          gradientColor="#dff1cf"
          gradientSize={200}
          gradientOpacity={0.12}
        >
          <section className="rounded-3xl border border-[#cbe0b5] bg-[#f7fcec] p-6 lg:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4d6a47]">
                  Why VerdeX
                </p>
                <h2 className="mt-1 font-title text-4xl text-[#234630]">
                  Built For Real-World Produce Flows
                </h2>
              </div>
              <span className="rounded-full border border-[#c0d8a8] bg-[#eaf5db] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#3d6040]">
                Farm To Shelf Confidence
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {featureHighlights.map((item) => (
                <article
                  key={item.title}
                  className="hover-pop rounded-2xl border border-[#d3e4c0] bg-white/90 p-4"
                >
                  <p className="text-2xl leading-none">{item.icon}</p>
                  <h3 className="mt-3 text-lg font-black text-[#2a4a31]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#557054]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#cfe1bb] bg-[#f0f8e2] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#506d4b]">
                How It Moves
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {flowSteps.map((step, index) => (
                  <div
                    key={step}
                    className="hover-pop rounded-xl border border-[#d6e6c5] bg-white px-3 py-3"
                  >
                    <p className="text-[11px] font-black uppercase tracking-wide text-[#6a835f]">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#2e4f34]">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c8dcaf] bg-[#edf6df] px-4 py-3">
              <p className="text-sm font-bold text-[#3f5d41]">
                Need a quick verification? Jump straight to public product
                tracking.
              </p>
              <button
                type="button"
                onClick={() => navigate("/track")}
                className="smooth-btn rounded-full border border-[#b8d09d] bg-white px-4 py-2 text-sm font-black text-[#2f5a33]"
              >
                Open Public Track
              </button>
            </div>
          </section>
        </MagicCard>
      </div>
    </div>
  );
}

export default LandingPage;
