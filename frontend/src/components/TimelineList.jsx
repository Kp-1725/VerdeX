function TimelineList({ stages }) {
  if (!stages?.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#c8d7b1] bg-[#f8fbf0] px-4 py-4 text-sm text-[#5c6b53]">
        No updates yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {stages.map((item, index) => (
        <li
          key={`${item.stage}-${index}`}
          className="rounded-2xl border border-[#d6e3be] bg-[#f7fbe8] px-4 py-3"
        >
          <p className="text-base font-bold text-[#2b4930]">
            {index + 1}. {item.stage}
          </p>
          {item.time ? (
            <p className="text-xs text-[#61725a]">{item.time}</p>
          ) : null}

          {item.chainProof ? (
            <div className="mt-2 rounded-xl border border-[#d0debb] bg-[#f1f8e3] px-3 py-2 text-xs text-[#355738]">
              <p className="font-bold">On-chain proof</p>
              <p className="break-all">Tx: {item.chainProof.txHash}</p>
              <p>
                Block: {item.chainProof.blockNumber} | Chain:{" "}
                {item.chainProof.chainId}
              </p>
              <p className="break-all">
                Contract: {item.chainProof.contractAddress}
              </p>
              <p className="break-all">
                Wallet: {item.chainProof.walletAddress}
              </p>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export default TimelineList;
