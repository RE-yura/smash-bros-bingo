import { useState, type JSX } from "react";
import { iconUrl, seriesColorClass, type Fighter } from "../data/fighters";

export function FighterIcon({ fighter }: { fighter: Fighter }): JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`grid aspect-square w-full place-items-center rounded-full font-black text-white ${seriesColorClass(fighter.series)}`}
      >
        <span className="text-[length:clamp(10px,20cqi,28px)] leading-none">
          {Array.from(fighter.name)[0]}
        </span>
      </span>
    );
  }

  return (
    <img
      src={iconUrl(fighter)}
      alt=""
      width={200}
      height={200}
      referrerPolicy="no-referrer"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className="block aspect-square w-full object-contain"
    />
  );
}
