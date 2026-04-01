import { useEffect, useMemo, useState } from "react";
import MobileContainer from "../components/MobileContainer";
import LargeButton from "../components/LargeButton";
import MessageBar from "../components/MessageBar";
import {
  fetchMyTradeRequests,
  sendTradeRequestMessage,
  updateTradeRequestStatus,
} from "../utils/api";
import { toFriendlyError } from "../utils/blockchain";
import { useAuth } from "../hooks/useAuth";

function RequestsInboxPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeRequest = useMemo(
    () => requests.find((item) => item._id === activeId) || null,
    [requests, activeId],
  );

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchMyTradeRequests();
      const list = response?.requests || [];
      setRequests(list);
      if (list.length > 0 && !activeId) {
        setActiveId(list[0]._id);
      }
    } catch (err) {
      setError(toFriendlyError(err, "Could not load requests."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function patchRequestInState(updatedRequest) {
    setRequests((prev) =>
      prev.map((item) =>
        item._id === updatedRequest._id ? updatedRequest : item,
      ),
    );
  }

  async function onSendMessage() {
    if (!activeRequest || !messageText.trim()) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await sendTradeRequestMessage(activeRequest._id, {
        text: messageText,
      });
      patchRequestInState(response.request);
      setMessage("Message sent ✅");
      setMessageText("");
    } catch (err) {
      setError(toFriendlyError(err, "Could not send message."));
    } finally {
      setSaving(false);
    }
  }

  async function onChangeStatus(status) {
    if (!activeRequest) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await updateTradeRequestStatus(activeRequest._id, {
        status,
      });
      patchRequestInState(response.request);
      setMessage(response.message || "Status updated ✅");
    } catch (err) {
      setError(toFriendlyError(err, "Could not update request."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileContainer
      title="Requests Inbox"
      subtitle="Farmer and retailer direct communication"
      showNav
      showBack
      backTo="/home"
    >
      <div className="space-y-3">
        <LargeButton
          icon="🔄"
          text={loading ? "Refreshing..." : "Refresh Requests"}
          onClick={loadRequests}
          disabled={loading}
          tone="secondary"
        />

        <MessageBar message={message} type="success" />
        <MessageBar message={error} type="error" />

        {requests.length === 0 ? (
          <p className="text-sm text-[#5c6f55]">No requests yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-2">
              {requests.map((item) => {
                const counterParty =
                  user?.role === "Farmer" ? item.retailerName : item.farmerName;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setActiveId(item._id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left ${
                      activeId === item._id
                        ? "border-[#8fc280] bg-[#ecf7df]"
                        : "border-[#d2e0bc] bg-[#f8fbef]"
                    }`}
                  >
                    <p className="text-sm font-bold text-[#2f4a33]">
                      {item.crop}
                    </p>
                    <p className="text-xs text-[#607059]">
                      With: {counterParty} | {item.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-[#607059]">
                      Offer: {item.currency}{" "}
                      {Number(item.offeredPrice || 0).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#355938]">
                      Status: {item.status}
                    </p>
                  </button>
                );
              })}
            </div>

            {activeRequest ? (
              <div className="rounded-xl border border-[#d2e0bc] bg-[#f8fbef] p-3">
                <p className="text-sm font-bold text-[#2f4a33]">
                  {activeRequest.crop} request
                </p>
                <p className="text-xs text-[#607059] mt-1">
                  Quantity: {activeRequest.quantity} {activeRequest.unit} |
                  Offer: {activeRequest.currency}{" "}
                  {Number(activeRequest.offeredPrice || 0).toFixed(2)}
                </p>
                <p className="text-xs text-[#607059] mt-1">
                  Status: {activeRequest.status}
                </p>

                <div className="mt-3 max-h-48 space-y-2 overflow-auto rounded-xl border border-[#d5e4bf] bg-white p-2">
                  {(activeRequest.messages || []).length === 0 ? (
                    <p className="text-xs text-[#64745e]">No messages yet.</p>
                  ) : (
                    activeRequest.messages.map((entry, index) => (
                      <div
                        key={`${entry.sentAt}-${index}`}
                        className="rounded-lg border border-[#e2ebd2] bg-[#f7fbef] px-2 py-2"
                      >
                        <p className="text-xs font-bold text-[#2f4a33]">
                          {entry.senderName} ({entry.senderRole})
                        </p>
                        <p className="text-xs text-[#425944]">{entry.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-[#cddab5] px-3 py-2 text-sm outline-none focus:border-[#2f7d35]"
                  placeholder="Type a message"
                />

                <LargeButton
                  icon="💬"
                  text={saving ? "Sending..." : "Send Message"}
                  onClick={onSendMessage}
                  disabled={saving}
                />

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {user?.role === "Farmer" &&
                  activeRequest.status === "Pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onChangeStatus("Accepted")}
                        className="rounded-lg bg-[#dff4d4] px-3 py-2 text-xs font-bold text-[#215b2c]"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeStatus("Rejected")}
                        className="rounded-lg bg-[#ffe7e1] px-3 py-2 text-xs font-bold text-[#893529]"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {user?.role === "Retailer" &&
                  ["Accepted", "Rejected"].includes(activeRequest.status) ? (
                    <button
                      type="button"
                      onClick={() => onChangeStatus("Closed")}
                      className="rounded-lg bg-[#e7eefb] px-3 py-2 text-xs font-bold text-[#30507e]"
                    >
                      Close
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default RequestsInboxPage;
