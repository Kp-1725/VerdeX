import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import MessageBar from "../components/MessageBar";
import TimelineList from "../components/TimelineList";
import { getProductMetadata } from "../utils/api";
import { getHistoryFromChain, toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";

function PublicProductPage() {
  const { isLoggedIn } = useAuth();
  const { id } = useParams();
  const [productName, setProductName] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [metadataResult, historyResult] = await Promise.allSettled([
          getProductMetadata(id),
          getHistoryFromChain(id),
        ]);

        if (metadataResult.status === "fulfilled") {
          setProductName(metadataResult.value?.product?.name || "");
        }

        const chainStages =
          historyResult.status === "fulfilled"
            ? historyResult.value.map((stage) => ({ stage }))
            : [];

        if (chainStages.length > 0) {
          setTimeline(chainStages);
        } else if (metadataResult.status === "fulfilled") {
          const fromDb = (metadataResult.value?.product?.stages || []).map(
            (item) => ({
              stage: item.stage,
              time: item.updatedAt
                ? new Date(item.updatedAt).toLocaleString()
                : "",
            }),
          );
          setTimeline(fromDb);
        }

        if (
          metadataResult.status === "rejected" &&
          historyResult.status === "rejected"
        ) {
          throw metadataResult.reason;
        }
      } catch (err) {
        setError(toFriendlyError(err, "Could not fetch product journey."));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  return (
    <MobileContainer
      title="Product Journey"
      subtitle={`Product ID: ${id}`}
      showBack
      backTo={isLoggedIn ? "/home" : "/login"}
      showNav={isLoggedIn}
    >
      {productName ? (
        <div className="rounded-xl border border-[#d4e0bf] bg-[#f6faeb] px-4 py-3">
          <p className="text-xs text-[#5f6f56]">Product Name</p>
          <p className="text-lg font-bold text-[#2e4a31]">{productName}</p>
        </div>
      ) : null}

      {loading ? <MessageBar message="Loading journey..." type="info" /> : null}
      {error ? <MessageBar message={error} type="error" /> : null}
      {!loading && !error ? <TimelineList stages={timeline} /> : null}

      {!isLoggedIn ? (
        <Link
          to="/login"
          className="inline-block rounded-xl bg-[#edf7df] px-4 py-2 text-sm font-bold text-[#1f5d2f]"
        >
          Team Login
        </Link>
      ) : null}
    </MobileContainer>
  );
}

export default PublicProductPage;
