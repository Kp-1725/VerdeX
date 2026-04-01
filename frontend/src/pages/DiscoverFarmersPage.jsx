import { useEffect, useMemo, useState } from "react";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { createTradeRequest, fetchFarmers } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import { useLanguage } from "../hooks/LanguageContext";

function DiscoverFarmersPage() {
  const { tr } = useLanguage();
  const [filters, setFilters] = useState({
    crop: "",
    location: "",
    method: "",
  });
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeFarmerId, setActiveFarmerId] = useState("");
  const [requestForm, setRequestForm] = useState({
    crop: "",
    quantity: "",
    unit: "KG",
    offeredPrice: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const queryParams = useMemo(
    () => ({
      crop: filters.crop,
      location: filters.location,
      method: filters.method,
    }),
    [filters.crop, filters.location, filters.method],
  );

  async function loadFarmers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchFarmers(queryParams);
      setFarmers(response?.farmers || []);
    } catch (err) {
      setError(toFriendlyError(err, tr("Could not load farmers.")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarmers();
  }, []);

  async function onSendRequest() {
    if (!activeFarmerId) {
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      await createTradeRequest({
        farmerId: activeFarmerId,
        crop: requestForm.crop,
        quantity: Number(requestForm.quantity),
        unit: requestForm.unit,
        offeredPrice: Number(requestForm.offeredPrice),
        currency: "INR",
        message: requestForm.message,
      });

      setMessage(tr("Request sent to farmer ✅"));
      setRequestForm({
        crop: "",
        quantity: "",
        unit: "KG",
        offeredPrice: "",
        message: "",
      });
      setActiveFarmerId("");
    } catch (err) {
      setError(toFriendlyError(err, tr("Could not send request.")));
    } finally {
      setSending(false);
    }
  }

  return (
    <MobileContainer
      title="Discover Farmers"
      subtitle="View profiles and select who to buy from"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <input
            value={filters.crop}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, crop: e.target.value }))
            }
            className="rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
            placeholder={tr("Crop")}
          />
          <input
            value={filters.location}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, location: e.target.value }))
            }
            className="rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
            placeholder={tr("Location")}
          />
          <input
            value={filters.method}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, method: e.target.value }))
            }
            className="rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
            placeholder={tr("Method")}
          />
        </div>

        <LargeButton
          icon="🔎"
          text={loading ? tr("Searching...") : tr("Search Farmers")}
          onClick={loadFarmers}
          disabled={loading}
          tone="secondary"
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />

        {loading ? (
          <p className="text-sm text-[#5b6c52]">{tr("Loading farmers...")}</p>
        ) : null}

        {!loading && farmers.length === 0 ? (
          <p className="text-sm text-[#5b6c52]">
            {tr("No farmers found for current filters.")}
          </p>
        ) : null}

        {!loading && farmers.length > 0 ? (
          <div className="space-y-3">
            {farmers.map((farmer) => {
              const profile = farmer.farmerProfile || {};
              const selected = activeFarmerId === farmer._id;

              return (
                <div
                  key={farmer._id}
                  className="rounded-2xl border border-[#d4e0bf] bg-[#f7fbe9] p-3"
                >
                  <p className="text-base font-bold text-[#2f4a33]">
                    {profile.farmName || farmer.name}
                  </p>
                  <p className="text-xs text-[#587057]">
                    {tr("Farmer")}: {farmer.name}
                  </p>
                  <p className="text-xs text-[#587057]">
                    {tr("Location")}: {profile.location || tr("Not shared")}
                  </p>
                  <p className="text-xs text-[#587057]">
                    {tr("Crops")}:{" "}
                    {(profile.primaryCrops || []).length > 0
                      ? profile.primaryCrops.join(", ")
                      : tr("Not shared")}
                  </p>
                  <p className="text-xs text-[#587057]">
                    {tr("Method")}: {profile.farmingMethod || tr("Not shared")}
                  </p>
                  {profile.bio ? (
                    <p className="mt-2 text-sm text-[#355938]">{profile.bio}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      setActiveFarmerId(selected ? "" : farmer._id)
                    }
                    className="mt-3 rounded-xl bg-[#dff1ce] px-4 py-2 text-sm font-bold text-[#245b2c]"
                  >
                    {selected ? tr("Cancel") : tr("Select & Send Request")}
                  </button>

                  {selected ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-[#cadebd] bg-white p-3">
                      <input
                        value={requestForm.crop}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            crop: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                        placeholder={tr("Crop name")}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={requestForm.quantity}
                          onChange={(e) =>
                            setRequestForm((prev) => ({
                              ...prev,
                              quantity: e.target.value.replace(/[^0-9.]/g, ""),
                            }))
                          }
                          className="rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                          placeholder={tr("Quantity")}
                        />
                        <input
                          value={requestForm.unit}
                          onChange={(e) =>
                            setRequestForm((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                          className="rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                          placeholder={tr("Unit (KG)")}
                        />
                      </div>
                      <input
                        value={requestForm.offeredPrice}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            offeredPrice: e.target.value.replace(
                              /[^0-9.]/g,
                              "",
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                        placeholder={tr("Offered total price (INR)")}
                      />
                      <textarea
                        rows={3}
                        value={requestForm.message}
                        onChange={(e) =>
                          setRequestForm((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                        placeholder={tr("Message to farmer")}
                      />

                      <LargeButton
                        icon="📨"
                        text={
                          sending ? tr("Sending...") : tr("Send Buy Request")
                        }
                        onClick={onSendRequest}
                        disabled={sending}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </MobileContainer>
  );
}

export default DiscoverFarmersPage;
