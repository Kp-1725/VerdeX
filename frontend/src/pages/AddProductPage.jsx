import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import { addProductOnChain, toFriendlyError } from "../utils/blockchain";
import { createProductMetadata } from "../utils/api";

function AddProductPage() {
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [farmerSellPrice, setFarmerSellPrice] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const fallbackQrUrl = useMemo(() => {
    if (!productId) {
      return "";
    }

    return `${window.location.origin}/product/${productId}`;
  }, [productId]);

  async function onSave() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (!name || !productId || !farmerSellPrice) {
        throw new Error("Please enter product name, ID, and farmer price.");
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
      setMessage("Saved Successfully ✅");
    } catch (err) {
      setError(
        toFriendlyError(err, "Could not save product. Please try again."),
      );
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
            Product Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder="For example: Organic Rice"
          />
        </div>

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
            placeholder="For example: 1001"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#375138]">
            Farmer Sell Price (INR)
          </label>
          <input
            value={farmerSellPrice}
            onChange={(e) =>
              setFarmerSellPrice(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className="w-full rounded-2xl border border-[#cddab5] px-4 py-4 text-lg outline-none focus:border-[#2f7d35]"
            placeholder="For example: 120"
          />
        </div>

        <LargeButton
          icon="💾"
          text={loading ? "Saving..." : "Save"}
          onClick={onSave}
          disabled={loading}
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />

        {(qrUrl || fallbackQrUrl) && message ? (
          <div className="rounded-2xl border border-[#d6e3be] bg-[#f8fbef] p-4 text-center">
            <p className="mb-3 text-sm font-semibold text-[#41593d]">
              QR code for product page
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
