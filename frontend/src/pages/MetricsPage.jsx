import { useEffect, useMemo, useState } from "react";
import MobileContainer from "../components/MobileContainer";
import MessageBar from "../components/MessageBar";
import { fetchPlatformMetrics } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";

function formatShortTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(false);

  async function loadMetrics({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetchPlatformMetrics();
      setMetrics(response || null);
      setPulse(true);
      window.setTimeout(() => setPulse(false), 500);
    } catch (err) {
      setError(toFriendlyError(err, "Could not load live metrics."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isDisposed = false;

    async function bootstrap() {
      if (!isDisposed) {
        await loadMetrics();
      }
    }

    bootstrap();

    const timerId = window.setInterval(() => {
      if (!isDisposed) {
        loadMetrics({ silent: true });
      }
    }, 15000);

    return () => {
      isDisposed = true;
      window.clearInterval(timerId);
    };
  }, []);

  const headline = metrics?.headline || {
    totalValueTrackedInrLakhs: 0,
    fairnessRatingPercent: 0,
    foodWastePreventedKg: 0,
    transactionsCount: 0,
  };

  const velocity = metrics?.velocity || {
    newProductsLast24Hours: 0,
    newRequestsLast24Hours: 0,
    updatesLastHour: 0,
  };

  const totals = metrics?.totals || {
    users: 0,
    farmers: 0,
    retailers: 0,
    products: 0,
    activeProducts: 0,
    archivedProducts: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    rejectedRequests: 0,
    closedRequests: 0,
    totalRetailValueInr: 0,
  };

  const ledgerItems = useMemo(() => metrics?.ledgerStream || [], [metrics]);
  const mapItems = useMemo(() => metrics?.transparencyMap || [], [metrics]);

  return (
    <MobileContainer
      title="Platform Metrics"
      subtitle="Real-time pulse of VerdeX operations"
      showNav
      showBack
      backTo="/home"
    >
      <div className="rounded-3xl border border-[#d3e2bf] bg-[radial-gradient(circle_at_top,_#f8fceb_0%,_#eef6df_50%,_#e6f1d6_100%)] p-4 text-[#2f4a33] shadow-[0_18px_40px_rgba(73,93,44,0.16)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#d2e1bc] pb-3">
          <p className="text-sm font-semibold text-[#4f6d4a]">
            National Agricultural Transparency Portal
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c3d9aa] bg-white/90 px-3 py-1 text-xs font-bold text-[#3f6a46]">
            <span
              className={`h-2.5 w-2.5 rounded-full ${pulse ? "bg-[#58c973]" : "bg-[#7fb76f]"}`}
            />
            Live Sync
          </div>
        </div>

        <MessageBar message={error} type="error" />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#d4e2bf] bg-white p-4 shadow-[0_8px_18px_rgba(73,93,44,0.09)]">
            <p className="text-xs font-black uppercase tracking-wide text-[#5e7a58]">
              Total Value Tracked
            </p>
            <p className="mt-2 text-4xl font-black leading-none text-[#2f7d35]">
              {headline.totalValueTrackedInrLakhs.toFixed(2)}L
            </p>
            <p className="mt-2 text-xs text-[#647a5e]">
              {headline.transactionsCount} transactions
            </p>
          </div>

          <div className="rounded-2xl border border-[#d4e2bf] bg-white p-4 shadow-[0_8px_18px_rgba(73,93,44,0.09)]">
            <p className="text-xs font-black uppercase tracking-wide text-[#5e7a58]">
              Fairness Rating
            </p>
            <p className="mt-2 text-4xl font-black leading-none text-[#2f7d35]">
              {headline.fairnessRatingPercent}%
            </p>
            <p className="mt-2 text-xs text-[#647a5e]">
              Accepted vs responded requests
            </p>
          </div>

          <div className="rounded-2xl border border-[#d4e2bf] bg-white p-4 shadow-[0_8px_18px_rgba(73,93,44,0.09)]">
            <p className="text-xs font-black uppercase tracking-wide text-[#5e7a58]">
              Food Waste Prevented
            </p>
            <p className="mt-2 text-4xl font-black leading-none text-[#2f7d35]">
              {Math.round(headline.foodWastePreventedKg)}kg
            </p>
            <p className="mt-2 text-xs text-[#647a5e]">Accepted volumes</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#d6e3be] bg-[#f7fbe9] p-4">
            <h3 className="text-2xl font-black text-[#2d4b33]">
              Transparency Map
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {mapItems.map((item) => (
                <div
                  key={item.region}
                  className="rounded-xl border border-[#d3e2bf] bg-white p-3"
                >
                  <p className="text-sm font-bold text-[#36563a]">
                    {item.region}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#dce8c9]">
                    <div
                      className="h-full rounded-full bg-[#5eb568]"
                      style={{
                        width: `${Math.max(0, Math.min(100, item.coveragePercent || 0))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#647a5f]">
                    {item.coveragePercent || 0}% coverage | {item.farms || 0}{" "}
                    farms
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#d6e3be] bg-[#f7fbe9] p-4">
            <h3 className="text-2xl font-black text-[#2d4b33]">
              Live Ledger Stream
            </h3>
            <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
              {ledgerItems.map((event, index) => (
                <div
                  key={`${event.type}-${event.timestamp}-${index}`}
                  className="rounded-xl border border-[#d3e2bf] bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-[#5d7a57]">
                      {formatShortTime(event.timestamp)}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        event.type === "product"
                          ? "border-[#b9d7a9] bg-[#eaf6de] text-[#31603a]"
                          : "border-[#c7d7ea] bg-[#edf5ff] text-[#2c5784]"
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#2f4d34]">
                    {event.title}
                  </p>
                  <p className="text-xs text-[#60755a]">{event.subtitle}</p>
                  <p className="mt-1 text-xs text-[#5b7056]">{event.detail}</p>
                </div>
              ))}

              {!loading && ledgerItems.length === 0 ? (
                <p className="text-sm text-[#5d7357]">
                  No stream activity yet. Add products or requests to populate
                  this feed.
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-[#d6e3be] bg-[#f7fbe9] p-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-[#486947]">
            Velocity + Totals
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#d3e2bf] bg-white p-3 text-xs text-[#5f765a]">
              <p className="font-bold">New products (24h)</p>
              <p className="mt-1 text-lg font-black text-[#2d5d34]">
                {velocity.newProductsLast24Hours}
              </p>
            </div>
            <div className="rounded-xl border border-[#d3e2bf] bg-white p-3 text-xs text-[#5f765a]">
              <p className="font-bold">New requests (24h)</p>
              <p className="mt-1 text-lg font-black text-[#2d5d34]">
                {velocity.newRequestsLast24Hours}
              </p>
            </div>
            <div className="rounded-xl border border-[#d3e2bf] bg-white p-3 text-xs text-[#5f765a]">
              <p className="font-bold">Updates (1h)</p>
              <p className="mt-1 text-lg font-black text-[#2d5d34]">
                {velocity.updatesLastHour}
              </p>
            </div>
            <div className="rounded-xl border border-[#d3e2bf] bg-white p-3 text-xs text-[#5f765a]">
              <p className="font-bold">Retail value (INR)</p>
              <p className="mt-1 text-lg font-black text-[#2d5d34]">
                {formatInr(totals.totalRetailValueInr)}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Users:{" "}
              <span className="font-bold text-[#2f5d36]">{totals.users}</span>
            </p>
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Farmers / Retailers:{" "}
              <span className="font-bold text-[#2f5d36]">
                {totals.farmers} / {totals.retailers}
              </span>
            </p>
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Products:{" "}
              <span className="font-bold text-[#2f5d36]">
                {totals.products}
              </span>
            </p>
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Active / Archived:{" "}
              <span className="font-bold text-[#2f5d36]">
                {totals.activeProducts} / {totals.archivedProducts}
              </span>
            </p>
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Pending requests:{" "}
              <span className="font-bold text-[#2f5d36]">
                {totals.pendingRequests}
              </span>
            </p>
            <p className="rounded-lg border border-[#d3e2bf] bg-white px-3 py-2 text-xs text-[#5f7659]">
              Accepted / Rejected / Closed:{" "}
              <span className="font-bold text-[#2f5d36]">
                {totals.acceptedRequests} / {totals.rejectedRequests} /{" "}
                {totals.closedRequests}
              </span>
            </p>
          </div>
        </section>
      </div>
    </MobileContainer>
  );
}

export default MetricsPage;
