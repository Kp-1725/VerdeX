function MessageBar({ message, type = "info" }) {
  if (!message) {
    return null;
  }

  const typeStyles = {
    success: "bg-[#dbf4ce] text-[#1f5d2f] border-[#9fcd89]",
    error: "bg-[#ffe6dc] text-[#7b2d1f] border-[#f0ae96]",
    info: "bg-[#e7f0ff] text-[#214477] border-[#b7c8e8]",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-3 text-sm font-semibold ${typeStyles[type] || typeStyles.info}`}
    >
      {message}
    </div>
  );
}

export default MessageBar;
