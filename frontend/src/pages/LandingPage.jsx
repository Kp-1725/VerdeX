import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MagicCard } from "@/components/ui/magic-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { useAuth } from "../hooks/useAuth";

function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [productId, setProductId] = useState("");

  const greeting = useMemo(() => {
    if (!isLoggedIn) {
      return "Track farm products from harvest to market";
    }

    return `Welcome back, ${user?.name || "Team"}`;
  }, [isLoggedIn, user?.name]);

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

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <MagicCard
          className="rounded-3xl"
          gradientFrom="#94d87f"
          gradientTo="#5db07d"
          gradientColor="#d8edc6"
          gradientSize={220}
          gradientOpacity={0.12}
        >
          <section className="rounded-3xl border border-[#cce0b5] bg-[#f6fbeb] p-6 lg:p-8">
            <p className="inline-flex rounded-full border border-[#c1d5a5] bg-[#e8f5d5] px-3 py-1 text-xs font-bold text-[#2f5a33]">
              Agricultural Supply Chain Traceability
            </p>
            <h1 className="mt-4 font-title text-4xl leading-tight text-[#21412f] lg:text-5xl">
              Agri Trace
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#3f6345]">
              {greeting}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {isLoggedIn ? (
                <ShimmerButton
                  background="#2f7d35"
                  shimmerColor="#d2efce"
                  borderRadius="0.9rem"
                  className="!bg-[#2f7d35] !text-white"
                  onClick={() => navigate("/home")}
                >
                  🏠 Open Dashboard
                </ShimmerButton>
              ) : (
                <>
                  <ShimmerButton
                    background="#2f7d35"
                    shimmerColor="#d2efce"
                    borderRadius="0.9rem"
                    className="!bg-[#2f7d35] !text-white"
                    onClick={() => navigate("/login")}
                  >
                    🔐 Login
                  </ShimmerButton>
                  <ShimmerButton
                    background="#edf6df"
                    shimmerColor="#9ac48a"
                    borderRadius="0.9rem"
                    className="!bg-[#edf6df] !text-[#2f4a33]"
                    onClick={() => navigate("/register")}
                  >
                    📝 Register
                  </ShimmerButton>
                </>
              )}
            </div>

            <div className="mt-8 grid gap-3 text-sm text-[#2e4d36] sm:grid-cols-3">
              <div className="rounded-xl border border-[#c9dbb0] bg-white px-4 py-3 font-bold">
                🌱 Farmer updates
              </div>
              <div className="rounded-xl border border-[#c9dbb0] bg-white px-4 py-3 font-bold">
                🚚 Transport tracking
              </div>
              <div className="rounded-xl border border-[#c9dbb0] bg-white px-4 py-3 font-bold">
                🛒 Consumer transparency
              </div>
            </div>
          </section>
        </MagicCard>

        <MagicCard
          className="rounded-3xl"
          gradientFrom="#b9e592"
          gradientTo="#84c8a0"
          gradientColor="#dcefcf"
          gradientSize={170}
          gradientOpacity={0.1}
        >
          <aside className="rounded-3xl border border-[#cce0b5] bg-[#f8fced] p-6">
            <h2 className="font-title text-3xl text-[#234630]">Quick Track</h2>
            <p className="mt-2 text-sm text-[#4a694b]">
              Enter product ID to view full journey instantly.
            </p>

            <label className="mt-5 block text-sm font-bold text-[#36523b]">
              Product ID
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
              className="mt-4 w-full !bg-[#2f7d35] !text-white"
            >
              🔍 Track Product
            </ShimmerButton>

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
    </div>
  );
}

export default LandingPage;
