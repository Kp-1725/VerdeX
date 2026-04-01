import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import { useLocation, useNavigate } from "react-router-dom";
import { useDeviceType } from "../hooks/useDeviceType";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { useAuth } from "../hooks/useAuth";
import { fetchMyTradeRequests } from "../utils/api";
import { useLanguage } from "../hooks/LanguageContext";

function MobileContainer({
  title,
  subtitle,
  children,
  showNav = false,
  showBack = false,
  backTo = "/",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();
  const { language, setLanguage, t, tr, translateRole } = useLanguage();
  const { deviceType, isMobile, isTablet, isDesktop } = useDeviceType();
  const [requestBadgeCount, setRequestBadgeCount] = useState(0);
  const isHomeRoute = location.pathname === "/home";
  const showDebugDeviceTag = import.meta.env.DEV;
  const showTopNav = isDesktop || isTablet;
  const deviceLabel =
    deviceType === "mobile"
      ? "Mobile"
      : deviceType === "tablet"
        ? "Tablet"
        : "Desktop";
  const activeRoleLabel = translateRole(user?.role || "Member");
  const focusLabel =
    user?.role === "Farmer"
      ? "Publish, update, and audit your produce flow"
      : user?.role === "Retailer"
        ? "Find trusted farms and manage incoming requests"
        : "Track product journeys across every checkpoint";
  const homeInsightLabel =
    user?.role === "Farmer"
      ? "Fresh batches, verified chain"
      : user?.role === "Retailer"
        ? "Sourcing with transparent proof"
        : "Live traceability session";

  const shellClass = isDesktop
    ? "mx-auto w-full max-w-[1180px]"
    : "mx-auto w-full max-w-[760px]";

  const contentCardClass = isMobile
    ? "mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]"
    : isTablet
      ? "mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]"
      : "mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1180px] flex-col overflow-hidden rounded-3xl border border-[#d3dcbf] bg-[#fffef8] shadow-[0_20px_60px_rgba(73,93,44,0.18)]";

  const navItems = [];
  if (isLoggedIn) {
    navItems.push({ to: "/home", label: t("nav.home", "Home"), icon: "🏠" });
    navItems.push({ to: "/track", label: t("nav.track", "Track"), icon: "🔍" });
    navItems.push({
      to: "/metrics",
      label: t("nav.metrics", "Metrics"),
      icon: "📊",
    });
    navItems.push({
      to: "/requests",
      label: t("nav.requests", "Requests"),
      icon: "💬",
    });

    if (user?.role === "Farmer") {
      navItems.push({
        to: "/add-product",
        label: t("nav.add", "Add"),
        icon: "➕",
      });
      navItems.push({
        to: "/farmer-profile",
        label: t("nav.myFarm", "My Farm"),
        icon: "🚜",
      });
    }

    if (user?.role === "Retailer") {
      navItems.push({
        to: "/discover-farmers",
        label: t("nav.farmers", "Farmers"),
        icon: "🧑‍🌾",
      });
      navItems.push({
        to: "/update-status",
        label: t("nav.status", "Status"),
        icon: "🔄",
      });
    }
  } else {
    navItems.push({ to: "/", label: t("nav.home", "Home"), icon: "🏠" });
    navItems.push({ to: "/login", label: t("nav.login", "Login"), icon: "🔐" });
    navItems.push({
      to: "/register",
      label: t("nav.register", "Register"),
      icon: "📝",
    });
  }

  function goTo(path) {
    if (location.pathname !== path) {
      navigate(path);
    }
  }

  useEffect(() => {
    let isDisposed = false;

    async function loadRequestBadge() {
      if (!isLoggedIn || !user?.role) {
        if (!isDisposed) {
          setRequestBadgeCount(0);
        }
        return;
      }

      try {
        const response = await fetchMyTradeRequests();
        const requests = Array.isArray(response?.requests)
          ? response.requests
          : [];

        let count = 0;
        if (user.role === "Farmer") {
          count = requests.filter((item) => item.status === "Pending").length;
        } else if (user.role === "Retailer") {
          count = requests.filter(
            (item) => item.status === "Accepted" || item.status === "Rejected",
          ).length;
        }

        if (location.pathname === "/requests") {
          count = 0;
        }

        if (!isDisposed) {
          setRequestBadgeCount(count);
        }
      } catch (error) {
        if (!isDisposed) {
          setRequestBadgeCount(0);
        }
      }
    }

    loadRequestBadge();

    const timerId = window.setInterval(loadRequestBadge, 45000);

    return () => {
      isDisposed = true;
      window.clearInterval(timerId);
    };
  }, [isLoggedIn, user?.role, location.pathname]);

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

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

      <div className={`${shellClass} relative z-10 space-y-4`}>
        {showTopNav ? (
          <div className="sticky top-3 z-20 rounded-2xl border border-[#cbddba] bg-[#f7fbef]/95 px-4 py-3 shadow-[0_10px_24px_rgba(73,93,44,0.14)] backdrop-blur">
            <div className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="justify-self-start" />

              <button
                type="button"
                onClick={() => goTo(isLoggedIn ? "/home" : "/")}
                className="justify-self-center inline-flex items-center gap-2 rounded-full border border-[#c4d9ad] bg-[#e6f3d7] px-4 py-2"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f7d35] text-sm text-white">
                  🌿
                </span>
                <span className="font-title text-3xl leading-none text-[#1f3f2d]">
                  VerdeX
                </span>
              </button>

              <div className="justify-self-end inline-flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c7d9b1] bg-white/95 px-2 py-1.5">
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

                {isLoggedIn ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#c7d9b1] bg-white/95 px-2 py-1.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f2d5] text-sm font-black text-[#2d5a38]">
                      {String(user?.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none text-[#2a4d35]">
                        {user?.name || tr("User")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#5b7157]">
                        {translateRole(user?.role || t("common.team", "Team"))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="rounded-full border border-[#f1d0c5] bg-transparent px-2.5 py-1.5 text-xs font-bold text-[#8f4a31] transition hover:bg-[#ffe7dc] hover:text-[#6f2f23]"
                    >
                      {t("common.logout", "Logout")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className="mt-4 grid w-full gap-x-3 gap-y-2 pb-1"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const showRequestsBadge =
                  item.to === "/requests" && requestBadgeCount > 0;
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => goTo(item.to)}
                    className={`inline-flex w-full items-center justify-center rounded-xl border px-2 py-1.5 text-base font-bold transition ${
                      isActive
                        ? "border-[#b7d5a6] bg-transparent text-[#2f5b38] underline decoration-[#89bd7a] decoration-2 underline-offset-6 hover:bg-[#e8f3da] hover:text-[#1f4b2c]"
                        : "border-[#d5e4c6] bg-transparent text-[#5b7458] hover:border-[#bdd8ad] hover:bg-[#edf6df] hover:text-[#255131]"
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.label}
                    {showRequestsBadge ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#e6503f] px-1.5 py-0.5 text-[10px] font-black text-white">
                        {requestBadgeCount > 99 ? "99+" : requestBadgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={contentCardClass}>
          <header className="relative overflow-hidden border-b border-[#dfe7c6] bg-[linear-gradient(180deg,#f4fae8,#eef6df)] px-5 py-5">
            {isHomeRoute ? (
              <>
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#9ed08f]/35 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 right-20 h-24 w-24 rounded-full bg-[#c8e4ad]/35 blur-2xl" />
              </>
            ) : null}

            {showBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mb-3 rounded-xl border border-[#c7d6af] bg-[#e8f3d6] px-3 py-2 text-sm font-bold text-[#2a4f31]"
              >
                ← {t("common.back", "Back")}
              </button>
            ) : null}

            {!showTopNav ? (
              <div className="mb-3 flex justify-end">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c8d9b3] bg-white px-2 py-1.5">
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
            ) : null}

            <div
              className={
                isHomeRoute
                  ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
                  : ""
              }
            >
              <div>
                <h1 className="font-title text-3xl leading-tight text-[#27412d]">
                  {tr(title)}
                </h1>
                {subtitle ? (
                  <p className="mt-2 text-sm text-[#4b6042]">{tr(subtitle)}</p>
                ) : null}

                {showDebugDeviceTag ? (
                  <span className="mt-3 inline-flex rounded-lg border border-[#bdd0a2] bg-[#e9f5d5] px-2 py-1 text-[11px] font-bold text-[#2b5231]">
                    {t("common.device", "Device")}: {deviceLabel}
                  </span>
                ) : null}

                {isHomeRoute ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#b8d1a1] bg-[#e9f4db] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#2f5c35]">
                        Chain Sync Active
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#b8d1a1] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#3f5f43]">
                        Role: {activeRoleLabel}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#b8d1a1] bg-[#edf6e1] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#3f5f43]">
                        Ledger Integrity On
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#cbd9b6] bg-white/85 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5d7358]">
                          Platform
                        </p>
                        <p className="mt-1 text-sm font-black text-[#26472e]">
                          VerdeX Network
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#cbd9b6] bg-white/85 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5d7358]">
                          Session
                        </p>
                        <p className="mt-1 text-sm font-black text-[#26472e]">
                          Ready to Operate
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#cbd9b6] bg-white/85 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#5d7358]">
                          Focus
                        </p>
                        <p className="mt-1 text-xs font-bold leading-snug text-[#36583a]">
                          {focusLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {isHomeRoute ? (
                <aside className="hidden rounded-2xl border border-[#c6d8af] bg-white/85 p-3 shadow-[0_10px_24px_rgba(73,93,44,0.12)] lg:block">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5b7458]">
                    At A Glance
                  </p>
                  <p className="mt-1 text-sm font-black text-[#26472e]">
                    {homeInsightLabel}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border border-[#d5e4c4] bg-[#f6fbef] px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#5f775b]">
                        Traceability Path
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#355538]">
                        Harvest -&gt; Chain -&gt; Shelf
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#d5e4c4] bg-[#f6fbef] px-2.5 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#5f775b]">
                        Quality Signal
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[#4b8547]">
                        <span className="h-2 w-2 rounded-full bg-[#62ac5b]" />
                        <span className="h-2 w-2 rounded-full bg-[#7cbc67]" />
                        <span className="h-2 w-2 rounded-full bg-[#9ac97a]" />
                        <span className="text-[11px] font-bold text-[#365c39]">
                          Stable
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </header>

          <main
            className={`fade-in flex-1 space-y-4 px-5 py-5 ${showNav && isMobile ? "pb-24" : "pb-6"}`}
          >
            {children}
          </main>

          {showNav && isMobile ? <BottomNav /> : null}
        </div>
      </div>
    </div>
  );
}

export default MobileContainer;
