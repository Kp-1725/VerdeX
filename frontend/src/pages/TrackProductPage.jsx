import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { useLanguage } from "../hooks/LanguageContext";

function extractIdFromUrl(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return /^\d+$/.test(last) ? last : "";
  } catch (error) {
    return "";
  }
}

function TrackProductPage() {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const [productId, setProductId] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [error, setError] = useState("");

  function goToProduct(id) {
    if (!id || !/^\d+$/.test(id)) {
      setError(tr("Please enter a valid product ID."));
      return;
    }

    setError("");
    navigate(`/product/${id}`);
  }

  function onUseQrLink() {
    const id = extractIdFromUrl(qrLink);
    if (!id) {
      setError(tr("Could not read product ID from link."));
      return;
    }

    goToProduct(id);
  }

  return (
    <MobileContainer
      title="Track Product"
      subtitle="Enter ID or paste QR link"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            {tr("Product ID")}
          </label>
          <input
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder={tr("Enter product ID")}
          />
        </div>

        <LargeButton
          icon="🔍"
          text={tr("Track")}
          onClick={() => goToProduct(productId)}
        />

        <div className="rounded-2xl border border-dashed border-[#d0dbba] bg-[#f8fbef] p-3">
          <p className="mb-2 text-sm font-semibold text-[#456043]">
            {tr("QR scan simulation")}
          </p>
          <input
            value={qrLink}
            onChange={(e) => setQrLink(e.target.value)}
            className="w-full rounded-xl border border-[#cddab5] px-3 py-3 text-sm outline-none focus:border-[#2f7d35]"
            placeholder={tr("Paste QR link here")}
          />
          <button
            type="button"
            onClick={onUseQrLink}
            className="mt-3 w-full rounded-xl bg-[#e6f3d8] px-4 py-3 text-sm font-bold text-[#26582f]"
          >
            {tr("Open from QR link")}
          </button>
        </div>

        <MessageBar message={error} type="error" />
      </div>
    </MobileContainer>
  );
}

export default TrackProductPage;
