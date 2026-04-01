import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MobileContainer from "../components/MobileContainer";
import MessageBar from "../components/MessageBar";
import TimelineList from "../components/TimelineList";
import { getProductMetadata } from "../utils/api";
import { getHistoryFromChain, toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/LanguageContext";

function PublicProductPage() {
  const { isLoggedIn } = useAuth();
  const { tr } = useLanguage();
  const { id } = useParams();
  const [productName, setProductName] = useState("");
  const [farmerSellPrice, setFarmerSellPrice] = useState(null);
  const [retailPrice, setRetailPrice] = useState(null);
  const [pricingCurrency, setPricingCurrency] = useState("INR");
  const [timeline, setTimeline] = useState([]);
  const [creationProof, setCreationProof] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [auditType, setAuditType] = useState("info");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      setAuditMessage("");
      setCreationProof(null);
      setIsArchived(false);
      setFarmerSellPrice(null);
      setRetailPrice(null);
      setPricingCurrency("INR");

      try {
        const [metadataResult, historyResult] = await Promise.allSettled([
          getProductMetadata(id),
          getHistoryFromChain(id),
        ]);

        const product =
          metadataResult.status === "fulfilled"
            ? metadataResult.value?.product
            : null;

        if (product) {
          setProductName(product.name || "");
          setFarmerSellPrice(
            Number.isFinite(Number(product.farmerSellPrice))
              ? Number(product.farmerSellPrice)
              : null,
          );
          setRetailPrice(
            Number.isFinite(Number(product.retailPrice))
              ? Number(product.retailPrice)
              : null,
          );
          setPricingCurrency(String(product.pricingCurrency || "INR"));
          setCreationProof(product.creationProof || null);
          setIsArchived(Boolean(product.isArchived));

          const fromDb = (product.stages || []).map((item) => ({
            stage: item.stage,
            time: item.updatedAt
              ? new Date(item.updatedAt).toLocaleString()
              : "",
            chainProof: item.chainProof || null,
          }));
          setTimeline(fromDb);
        }

        const chainStages =
          historyResult.status === "fulfilled" &&
          Array.isArray(historyResult.value)
            ? historyResult.value
            : [];

        if (product && historyResult.status === "fulfilled") {
          const dbStages = (product.stages || []).map((item) =>
            String(item.stage),
          );
          const isAuditMatch =
            dbStages.length === chainStages.length &&
            dbStages.every(
              (stage, index) => stage === String(chainStages[index]),
            );

          if (isAuditMatch) {
            setAuditType("success");
            setAuditMessage(
              tr(
                "Audit check passed: database stage log matches on-chain history.",
              ),
            );
          } else {
            setAuditType("error");
            setAuditMessage(
              tr(
                "Audit warning: database stage log does not fully match on-chain history.",
              ),
            );
          }

          if ((product.stages || []).length === 0 && chainStages.length > 0) {
            setTimeline(chainStages.map((stage) => ({ stage })));
          }
        } else if (!product && historyResult.status === "fulfilled") {
          setTimeline(chainStages.map((stage) => ({ stage })));
          setAuditType("info");
          setAuditMessage(
            tr(
              "Showing blockchain history only because metadata service is unavailable.",
            ),
          );
        } else if (product && historyResult.status === "rejected") {
          setAuditType("info");
          setAuditMessage(
            tr(
              "Metadata loaded. Blockchain verification is temporarily unavailable.",
            ),
          );
        }

        if (!product && historyResult.status === "rejected") {
          throw metadataResult.reason || historyResult.reason;
        }
      } catch (err) {
        setError(toFriendlyError(err, tr("Could not fetch product journey.")));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  return (
    <MobileContainer
      title="Product Journey"
      subtitle={`${tr("Product ID")}: ${id}`}
      showBack
      backTo={isLoggedIn ? "/home" : "/login"}
      showNav={isLoggedIn}
    >
      {productName ? (
        <div className="rounded-xl border border-[#d4e0bf] bg-[#f6faeb] px-4 py-3">
          <p className="text-xs text-[#5f6f56]">{tr("Product Name")}</p>
          <p className="text-lg font-bold text-[#2e4a31]">{productName}</p>
        </div>
      ) : null}

      {farmerSellPrice !== null ? (
        <div className="rounded-xl border border-[#d4e0bf] bg-[#f6faeb] px-4 py-3 text-sm text-[#355738]">
          <p className="font-bold text-[#2e4a31]">{tr("Price Transparency")}</p>
          <p className="mt-1">
            {tr("Farmer sell price")}: {pricingCurrency}{" "}
            {farmerSellPrice.toFixed(2)}
          </p>
          <p>
            {tr("Retail price")}:{" "}
            {retailPrice !== null
              ? `${pricingCurrency} ${retailPrice.toFixed(2)}`
              : tr("Not updated yet")}
          </p>
          {retailPrice !== null ? (
            <p>
              {tr("Margin")}: {pricingCurrency}{" "}
              {(retailPrice - farmerSellPrice).toFixed(2)}
            </p>
          ) : null}
        </div>
      ) : null}

      {isArchived ? (
        <MessageBar
          message={tr(
            "This product record is archived and preserved for traceability audit.",
          )}
          type="info"
        />
      ) : null}

      {creationProof ? (
        <div className="rounded-xl border border-[#d4e0bf] bg-[#f6faeb] px-4 py-3 text-xs text-[#355738]">
          <p className="font-bold text-[#2e4a31]">
            {tr("Creation transaction proof")}
          </p>
          <p className="mt-1 break-all">
            {tr("Tx")}: {creationProof.txHash}
          </p>
          <p>
            {tr("Block")}: {creationProof.blockNumber} | {tr("Chain")}:{" "}
            {creationProof.chainId}
          </p>
          <p className="break-all">
            {tr("Contract")}: {creationProof.contractAddress}
          </p>
          <p className="break-all">
            {tr("Wallet")}: {creationProof.walletAddress}
          </p>
        </div>
      ) : null}

      {loading ? (
        <MessageBar message={tr("Loading journey...")} type="info" />
      ) : null}
      {error ? <MessageBar message={error} type="error" /> : null}
      {!loading && !error && auditMessage ? (
        <MessageBar message={auditMessage} type={auditType} />
      ) : null}
      {!loading && !error ? <TimelineList stages={timeline} /> : null}

      {!isLoggedIn ? (
        <Link
          to="/login"
          className="inline-block rounded-xl bg-[#edf7df] px-4 py-2 text-sm font-bold text-[#1f5d2f]"
        >
          {tr("Team Login")}
        </Link>
      ) : null}
    </MobileContainer>
  );
}

export default PublicProductPage;
