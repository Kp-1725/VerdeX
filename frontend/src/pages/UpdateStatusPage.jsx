import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import StageSelector from "../components/StageSelector";
import { addStageOnChain, toFriendlyError } from "../utils/blockchain";
import { addProductStageMetadata } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

function UpdateStatusPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillId = searchParams.get("productId") || "";
    if (/^\d+$/.test(prefillId)) {
      setProductId(prefillId);
    }
  }, [searchParams]);

  async function onUpdate() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!productId || !selectedStage) {
        throw new Error("Please enter product ID and choose a status.");
      }

      const chainProof = await addStageOnChain(productId, selectedStage);
      const payload = {
        stage: selectedStage,
        chainProof,
      };

      if (user?.role === "Retailer" && retailPrice) {
        payload.retailPrice = Number(retailPrice);
      }

      await addProductStageMetadata(productId, payload);
      setMessage("Updated ✅");
    } catch (err) {
      setError(
        toFriendlyError(err, "Could not update status. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileContainer
      title="Update Status"
      subtitle="Select stage and save"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Product ID
          </label>
          <input
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value.replace(/[^0-9]/g, ""))
            }
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder="Enter product ID"
          />
        </div>

        <StageSelector
          selectedStage={selectedStage}
          onSelect={setSelectedStage}
        />

        {user?.role === "Retailer" ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#375138]">
              Retail Price (INR)
            </label>
            <input
              value={retailPrice}
              onChange={(e) =>
                setRetailPrice(e.target.value.replace(/[^0-9.]/g, ""))
              }
              className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
              placeholder="For example: 180"
            />
            <p className="mt-1 text-xs text-[#61725a]">
              Retailers can set selling price to consumers.
            </p>
          </div>
        ) : null}

        <LargeButton
          icon="🔄"
          text={loading ? "Updating..." : "Update"}
          onClick={onUpdate}
          disabled={loading}
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />
      </div>
    </MobileContainer>
  );
}

export default UpdateStatusPage;
