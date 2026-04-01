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
        </li>
      ))}
    </ol>
  );
}

export default TimelineList;
