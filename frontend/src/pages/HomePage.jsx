import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import { useAuth } from "../hooks/useAuth";
import { archiveMyProductMetadata, fetchMyProducts } from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import MessageBar from "../components/MessageBar";
import { MagicCard } from "@/components/ui/magic-card";

function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [archivingId, setArchivingId] = useState(null);

  useEffect(() => {
    async function loadMyProducts() {
      if (user?.role !== "Farmer") {
        return;
      }

      setLoadingProducts(true);
      setProductMessage("");
      setProductError("");

      try {
        const data = await fetchMyProducts();
        setMyProducts(data?.products || []);
      } catch (error) {
        setProductError(
          toFriendlyError(error, "Could not load your products."),
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    loadMyProducts();
  }, [user?.role]);

  async function onArchiveProduct(item) {
    const confirmed = window.confirm(
      `Archive ${item.name} (ID: ${item.productId})? This keeps history for audit.`,
    );

    if (!confirmed) {
      return;
    }

    setProductMessage("");
    setProductError("");
    setArchivingId(item.productId);

    try {
      const data = await archiveMyProductMetadata(item.productId);
      setMyProducts((prev) =>
        prev.filter((product) => product.productId !== item.productId),
      );
      setProductMessage(data?.message || "Archived ✅");
    } catch (error) {
      setProductError(
        toFriendlyError(error, "Could not archive product. Please try again."),
      );
    } finally {
      setArchivingId(null);
    }
  }

  const isFarmer = user?.role === "Farmer";
  const isRetailer = user?.role === "Retailer";

  return (
    <MobileContainer
      title={`Hello, ${user?.name || "User"}`}
      subtitle="Choose what you want to do"
      showNav
    >
      <section className="rounded-2xl border border-[#d4e2bf] bg-[#f5fbe9] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-black text-[#2d4831]">Quick Actions</h2>
          <span className="rounded-full bg-[#e7f3d6] px-3 py-1 text-[11px] font-bold text-[#4b6848]">
            One-tap flows
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {isFarmer ? (
            <LargeButton
              icon="➕"
              text="Add Product"
              onClick={() => navigate("/add-product")}
            />
          ) : null}

          <LargeButton
            icon="🔄"
            text="Update Status"
            onClick={() => navigate("/update-status")}
            tone="secondary"
          />

          <LargeButton
            icon="🔍"
            text="Track Product"
            onClick={() => navigate("/track")}
            tone="secondary"
          />

          {isFarmer ? (
            <LargeButton
              icon="🚜"
              text="My Farm Profile"
              onClick={() => navigate("/farmer-profile")}
              tone="secondary"
            />
          ) : null}

          {isRetailer ? (
            <LargeButton
              icon="🧑‍🌾"
              text="Discover Farmers"
              onClick={() => navigate("/discover-farmers")}
              tone="secondary"
            />
          ) : null}

          <LargeButton
            icon="💬"
            text="Requests Inbox"
            onClick={() => navigate("/requests")}
            tone="secondary"
          />

          <LargeButton
            icon="📊"
            text="Live Metrics"
            onClick={() => navigate("/metrics")}
            tone="secondary"
          />
        </div>
      </section>

      {user?.role === "Farmer" ? (
        <MagicCard
          className="rounded-2xl"
          gradientFrom="#8bcf83"
          gradientTo="#5eb07a"
          gradientColor="#d8edc6"
          gradientSize={170}
          gradientOpacity={0.12}
        >
          <section className="rounded-2xl border border-[#d6e3be] bg-[#f7fbe9] p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2f4a33]">
                My Products
              </h2>
              <button
                type="button"
                onClick={() => navigate("/add-product")}
                className="rounded-xl bg-[#d9efcd] px-3 py-1 text-xs font-bold text-[#245b2c]"
              >
                Add New
              </button>
            </div>

            {loadingProducts ? (
              <p className="text-sm text-[#5b6c52]">Loading your items...</p>
            ) : null}

            {!loadingProducts && !productError && myProducts.length === 0 ? (
              <p className="text-sm text-[#5b6c52]">
                No products yet. Tap Add Product to create your first item.
              </p>
            ) : null}

            {!loadingProducts && myProducts.length > 0 ? (
              <div className="space-y-2">
                {myProducts.map((item) => (
                  <MagicCard
                    key={item.productId}
                    className="rounded-xl"
                    gradientFrom="#c2eaa2"
                    gradientTo="#9fd9b5"
                    gradientColor="#e6f4d8"
                    gradientSize={120}
                    gradientOpacity={0.1}
                  >
                    <div className="flex items-center justify-between rounded-xl border border-[#d4e0bf] bg-white px-3 py-2">
                      <div>
                        <p className="text-sm font-bold text-[#2d4831]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#607059]">
                          ID: {item.productId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/update-status?productId=${item.productId}`,
                            )
                          }
                          className="rounded-lg bg-[#e8f5dc] px-3 py-2 text-xs font-bold text-[#245b2c]"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${item.productId}`)}
                          className="rounded-lg bg-[#edf5ff] px-3 py-2 text-xs font-bold text-[#24507c]"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchiveProduct(item)}
                          disabled={archivingId === item.productId}
                          className="rounded-lg bg-[#ffe6e0] px-3 py-2 text-xs font-bold text-[#8a2f24] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {archivingId === item.productId
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    </div>
                  </MagicCard>
                ))}
              </div>
            ) : null}

            <MessageBar message={productMessage} type="success" />
            <MessageBar message={productError} type="error" />
          </section>
        </MagicCard>
      ) : null}

      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="mt-3 w-full rounded-2xl border border-[#f3b6a5] bg-[#fff1ea] px-4 py-3 text-base font-bold text-[#843f28]"
      >
        Logout
      </button>
    </MobileContainer>
  );
}

export default HomePage;
