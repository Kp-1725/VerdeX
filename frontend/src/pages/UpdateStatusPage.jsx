import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import StageSelector from "../components/StageSelector";
import { addStageOnChain, toFriendlyError } from "../utils/blockchain";
import {
  addProductStageMetadata,
  fetchRetailerProductOptions,
} from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/LanguageContext";

const RETAILER_STAGE_OPTIONS = ["At Market"];
const FARMER_STAGE_OPTIONS = ["Harvested", "Packed", "In Transport"];

function UpdateStatusPage() {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [retailerProducts, setRetailerProducts] = useState([]);
  const [loadingRetailerProducts, setLoadingRetailerProducts] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillId = searchParams.get("productId") || "";
    if (/^\d+$/.test(prefillId)) {
      setProductId(prefillId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user?.role === "Retailer") {
      setSelectedStage("At Market");
      return;
    }

    if (user?.role === "Farmer" && selectedStage === "At Market") {
      setSelectedStage("");
    }
  }, [user?.role, selectedStage]);

  useEffect(() => {
    let isDisposed = false;

    async function loadRetailerProducts() {
      if (user?.role !== "Retailer") {
        if (!isDisposed) {
          setRetailerProducts([]);
        }
        return;
      }

      setLoadingRetailerProducts(true);
      try {
        const response = await fetchRetailerProductOptions();
        if (!isDisposed) {
          setRetailerProducts(response?.products || []);
        }
      } catch (fetchError) {
        if (!isDisposed) {
          setRetailerProducts([]);
        }
      } finally {
        if (!isDisposed) {
          setLoadingRetailerProducts(false);
        }
      }
    }

    loadRetailerProducts();

    return () => {
      isDisposed = true;
    };
  }, [user?.role]);

  async function onUpdate() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!productId || !selectedStage) {
        throw new Error(tr("Please enter product ID and choose a status."));
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
      setMessage(tr("Updated ✅"));
    } catch (err) {
      setError(
        toFriendlyError(err, tr("Could not update status. Please try again.")),
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

          {user?.role === "Retailer" ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold text-[#5f745a]">
                {tr("Existing Product IDs")}
              </p>

              {loadingRetailerProducts ? (
                <p className="text-xs text-[#62755b]">{tr("Loading...")}</p>
              ) : null}

              {!loadingRetailerProducts && retailerProducts.length === 0 ? (
                <p className="text-xs text-[#62755b]">
                  {tr("No eligible products found yet.")}
                </p>
              ) : null}

              {!loadingRetailerProducts && retailerProducts.length > 0 ? (
                <div className="max-h-36 space-y-2 overflow-auto rounded-xl border border-[#d5e1c0] bg-[#f8fbef] p-2">
                  {retailerProducts.map((item) => (
                    <button
                      key={item.productId}
                      type="button"
                      onClick={() => setProductId(String(item.productId))}
                      className="w-full rounded-lg border border-[#cfdeb8] bg-white px-3 py-2 text-left"
                    >
                      <p className="text-xs font-bold text-[#2f4a33]">
                        ID: {item.productId}
                      </p>
                      <p className="text-[11px] text-[#5e7258]">{item.name}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <StageSelector
          selectedStage={selectedStage}
          onSelect={setSelectedStage}
          options={
            user?.role === "Retailer"
              ? RETAILER_STAGE_OPTIONS
              : user?.role === "Farmer"
                ? FARMER_STAGE_OPTIONS
                : undefined
          }
        />

        {user?.role === "Retailer" ? (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#375138]">
              {tr("Retail Price (INR)")}
            </label>
            <input
              value={retailPrice}
              onChange={(e) =>
                setRetailPrice(e.target.value.replace(/[^0-9.]/g, ""))
              }
              className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
              placeholder={tr("For example: 180")}
            />
            <p className="mt-1 text-xs text-[#61725a]">
              {tr("Retailers can set selling price to consumers.")}
            </p>
          </div>
        ) : null}

        <LargeButton
          icon="🔄"
          text={loading ? tr("Updating...") : tr("Update")}
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
