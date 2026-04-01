import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { addProductOnChain, toFriendlyError } from "../utils/blockchain";
import {
  createProductMetadata,
  fetchGovPriceRecommendation,
  fetchMlPriceForecast,
  fetchNextProductId,
} from "../utils/api";
import { useLanguage } from "../hooks/LanguageContext";

function formatPriceInput(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "";
  }

  return String(Number(parsed.toFixed(2)));
}

function convertPerQuintalToPerKg(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number((parsed / 100).toFixed(2));
}

function AddProductPage() {
  const { tr } = useLanguage();
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [farmerSellPrice, setFarmerSellPrice] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [idLoading, setIdLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceRecommendation, setPriceRecommendation] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlForecast, setMlForecast] = useState(null);

  const recommendedPricePerKg = useMemo(() => {
    return convertPerQuintalToPerKg(
      priceRecommendation?.recommendationPriceInrPerQuintal,
    );
  }, [priceRecommendation]);

  const mlFirstPrediction = useMemo(() => {
    const first = mlForecast?.predictions?.[0];
    if (!first) {
      return null;
    }

    const predictedPrice = Number(first.predictedPrice);
    if (!Number.isFinite(predictedPrice) || predictedPrice <= 0) {
      return null;
    }

    return {
      ...first,
      predictedPrice,
    };
  }, [mlForecast]);

  const fallbackQrUrl = useMemo(() => {
    if (!productId) {
      return "";
    }

    return `${window.location.origin}/product/${productId}`;
  }, [productId]);

  async function assignNextProductId() {
    setIdLoading(true);
    try {
      const data = await fetchNextProductId();
      const nextId = Number(data?.nextProductId);
      if (!Number.isInteger(nextId) || nextId <= 0) {
        throw new Error(tr("Invalid product ID generated."));
      }

      setProductId(String(nextId));
    } catch (err) {
      setError(toFriendlyError(err, tr("Could not auto-generate product ID.")));
    } finally {
      setIdLoading(false);
    }
  }

  useEffect(() => {
    assignNextProductId();
  }, []);

  async function onRecommendPrice() {
    setMessage("");
    setError("");

    if (!String(name || "").trim()) {
      setError(tr("Enter product name first to get recommendation."));
      return;
    }

    setPriceLoading(true);
    try {
      const result = await fetchGovPriceRecommendation({
        crop: String(name).trim(),
        state: String(stateInput || "").trim() || undefined,
      });

      const recommended = Number(
        result?.recommendation?.recommendationPriceInrPerQuintal,
      );
      if (!Number.isFinite(recommended) || recommended <= 0) {
        throw new Error(tr("Invalid recommendation received."));
      }

      setFarmerSellPrice(formatPriceInput(recommended));
      setPriceRecommendation(result?.recommendation || null);
      setMessage(tr("Government price recommendation applied."));
    } catch (err) {
      setPriceRecommendation(null);
      setError(
        toFriendlyError(
          err,
          tr("Could not fetch government price recommendation."),
        ),
      );
    } finally {
      setPriceLoading(false);
    }
  }

  async function onFetchMlForecast() {
    setMessage("");
    setError("");

    if (!String(name || "").trim()) {
      setError(tr("Enter product name first to run ML forecast."));
      return;
    }

    setMlLoading(true);
    try {
      const result = await fetchMlPriceForecast({
        crop: String(name).trim(),
        state: String(stateInput || "").trim() || undefined,
        daysAhead: 7,
      });

      const forecast = result?.forecast;
      const predictions = Array.isArray(forecast?.predictions)
        ? forecast.predictions
        : [];
      if (!predictions.length) {
        throw new Error(tr("No prediction series returned."));
      }

      setMlForecast(forecast);
      setMessage(tr("ML forecast loaded."));
    } catch (err) {
      setMlForecast(null);
      setError(toFriendlyError(err, tr("Could not fetch ML price forecast.")));
    } finally {
      setMlLoading(false);
    }
  }

  async function onSave() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!name || !productId || !farmerSellPrice) {
        throw new Error(tr("Please enter product name, ID, and farmer price."));
      }

      const chainProof = await addProductOnChain(productId, name);
      const result = await createProductMetadata({
        productId,
        name,
        farmerSellPrice: Number(farmerSellPrice),
        pricingCurrency: "INR",
        chainProof,
      });

      setQrUrl(
        result?.product?.qrUrl ||
          `${window.location.origin}/product/${productId}`,
      );
      setMessage(tr("Saved Successfully ✅"));
      setName("");
      setFarmerSellPrice("");
      setMlForecast(null);
      await assignNextProductId();
    } catch (err) {
      const friendly = toFriendlyError(
        err,
        tr("Could not save product. Please try again."),
      );

      if (friendly === "Product ID already exists.") {
        await assignNextProductId();
        setError(
          tr(
            "Product ID collision detected. A new ID was generated. Please save again.",
          ),
        );
      } else {
        setError(friendly);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileContainer
      title="Add Product"
      subtitle="Enter product details and save"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Product Name")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("For example: Organic Rice")}
          />
        </div>

        <div className="rounded-2xl border border-[#d6e3be] bg-[#f7fbef] p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#315b35]">
              {tr("Govt Price Recommendation")}
            </p>
            <span
              className="cursor-help rounded-full border border-[#c8d8af] bg-white px-2 py-0.5 text-[10px] font-bold text-[#4f664a]"
              title={tr(
                "Government mandi rates are usually published as INR per quintal, where 1 quintal = 100 kg.",
              )}
            >
              {tr("UNIT INFO")}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#597252]">
            {tr(
              "Uses govt mandi data when available, with prototype fallback for demo reliability.",
            )}
          </p>
          <p className="mt-1 text-[11px] text-[#5d7557]">
            {tr(
              "Unit note: Recommendation values are INR per quintal (100 kg).",
            )}
          </p>

          <div className="mt-3 space-y-2">
            <input
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              className="w-full rounded-xl border border-[#cddab5] bg-white px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
              placeholder={tr("State (optional), for example: Karnataka")}
            />
            <button
              type="button"
              onClick={onRecommendPrice}
              disabled={loading || priceLoading}
              className="w-full rounded-xl border border-[#b8cf9e] bg-[#e9f5d9] px-3 py-2 text-sm font-bold text-[#2e6034] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {priceLoading
                ? tr("Fetching Govt Price...")
                : tr("Get Recommendation")}
            </button>
          </div>

          {priceRecommendation ? (
            <div className="mt-3 rounded-xl border border-[#d1dfbb] bg-white p-3 text-xs text-[#4f664a]">
              <p className="font-semibold text-[#2f5733]">
                {tr("Suggested")} : INR{" "}
                {priceRecommendation.recommendationPriceInrPerQuintal} / quintal
              </p>
              <p className="mt-1">
                {tr("Approx per-kg")}: INR {recommendedPricePerKg ?? "-"} / kg
              </p>
              <p className="mt-1">
                {tr("Avg range")}:{" "}
                {priceRecommendation.minPriceAverageInrPerQuintal ?? "-"} to{" "}
                {priceRecommendation.maxPriceAverageInrPerQuintal ?? "-"}
              </p>
              <p className="mt-1">
                {tr("Source")}:{" "}
                {priceRecommendation.source?.name || tr("Govt dataset")}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (recommendedPricePerKg) {
                    setFarmerSellPrice(formatPriceInput(recommendedPricePerKg));
                    setMessage(tr("Per-kg converted recommendation applied."));
                    setError("");
                  }
                }}
                className="mt-2 rounded-lg border border-[#c6d8ad] bg-[#eff7e4] px-2 py-1 text-[11px] font-semibold text-[#335a38]"
              >
                {tr("Use per-kg value in sell price")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#d6e3be] bg-[#f7fbef] p-3">
          <p className="text-sm font-semibold text-[#315b35]">
            {tr("ML Price Forecast (7 Days)")}
          </p>
          <p className="mt-1 text-xs text-[#597252]">
            {tr(
              "Uses the team Random Forest model service, with prototype fallback when the ML API is offline.",
            )}
          </p>
          <p className="mt-1 text-[11px] text-[#5d7557]">
            {tr("Unit note: ML forecast values are INR per kg.")}
          </p>

          <button
            type="button"
            onClick={onFetchMlForecast}
            disabled={loading || mlLoading}
            className="mt-3 w-full rounded-xl border border-[#b8cf9e] bg-[#e9f5d9] px-3 py-2 text-sm font-bold text-[#2e6034] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mlLoading ? tr("Running Forecast...") : tr("Get ML Forecast")}
          </button>

          {mlForecast ? (
            <div className="mt-3 rounded-xl border border-[#d1dfbb] bg-white p-3 text-xs text-[#4f664a]">
              <p className="font-semibold text-[#2f5733]">
                {tr("Day 1 prediction")}: INR{" "}
                {mlFirstPrediction?.predictedPrice ?? "-"} / kg
              </p>
              <p className="mt-1">
                {tr("Range")}: INR {mlFirstPrediction?.lowerBound ?? "-"} -{" "}
                {mlFirstPrediction?.upperBound ?? "-"} / kg
              </p>
              <p className="mt-1">
                {tr("Source")}: {mlForecast?.source?.name || tr("ML model")}
              </p>
              <p className="mt-1">
                {tr("Unit")}: {mlForecast?.unit || "INR/kg"}
              </p>

              <div className="mt-2 space-y-1 rounded-lg border border-[#d4e1c0] bg-[#f8fcf1] p-2">
                {(mlForecast?.predictions || []).slice(0, 3).map((item) => (
                  <p key={item.date} className="text-[11px] text-[#4c6348]">
                    {item.date}: INR {item.predictedPrice} / kg
                  </p>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (mlFirstPrediction?.predictedPrice) {
                    setFarmerSellPrice(
                      formatPriceInput(mlFirstPrediction.predictedPrice),
                    );
                    setMessage(tr("ML day-1 predicted price applied."));
                    setError("");
                  }
                }}
                className="mt-2 rounded-lg border border-[#c6d8ad] bg-[#eff7e4] px-2 py-1 text-[11px] font-semibold text-[#335a38]"
              >
                {tr("Use ML day-1 price (INR/kg)")}
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-sm font-semibold text-[#375138]">
              {tr("Product ID (Auto)")}
            </label>
            <button
              type="button"
              onClick={assignNextProductId}
              disabled={idLoading || loading}
              className="rounded-full border border-[#bcd2a5] bg-[#eef7e1] px-3 py-1 text-xs font-bold text-[#2d5d34] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {idLoading ? tr("Generating...") : tr("Refresh ID")}
            </button>
          </div>
          <input
            value={productId}
            readOnly
            className="w-full rounded-2xl border border-[#cddab5] bg-[#f3fae8] px-4 py-4 text-lg outline-none"
            placeholder={tr("Auto-generated")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Farmer Sell Price (INR)")}
          </label>
          <input
            value={farmerSellPrice}
            onChange={(e) =>
              setFarmerSellPrice(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("For example: 120")}
          />
        </div>

        <LargeButton
          icon="💾"
          text={loading ? tr("Saving...") : tr("Save")}
          onClick={onSave}
          disabled={loading}
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />

        {(qrUrl || fallbackQrUrl) && message ? (
          <div className="rounded-2xl border border-[#d6e3be] bg-[#f8fbef] p-4 text-center">
            <p className="mb-3 text-sm font-semibold text-[#41593d]">
              {tr("QR code for product page")}
            </p>
            <div className="mx-auto w-fit rounded-xl bg-white p-3">
              <QRCodeCanvas value={qrUrl || fallbackQrUrl} size={140} />
            </div>
            <p className="mt-3 break-all text-xs text-[#5d6f56]">
              {qrUrl || fallbackQrUrl}
            </p>
          </div>
        ) : null}
      </div>
    </MobileContainer>
  );
}

export default AddProductPage;
