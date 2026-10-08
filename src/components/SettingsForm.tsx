import { useState, type JSX } from "react";
import { BOARD_SIZES, type CardSettings } from "../lib/bingo";

type Props = {
  initial: CardSettings;
  onGenerate: (settings: CardSettings) => void;
};

export function SettingsForm({ initial, onGenerate }: Props): JSX.Element {
  const [settings, setSettings] = useState(initial);

  return (
    <form
      className="flex flex-col items-center gap-4 rounded-2xl bg-panel p-4 ring-1 ring-white/10 sm:flex-row sm:flex-wrap sm:justify-center"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate(settings);
      }}
    >
      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">カードのサイズ</legend>
        {BOARD_SIZES.map((size) => (
          <label key={size} className="cursor-pointer">
            <input
              type="radio"
              name="size"
              value={size}
              checked={settings.size === size}
              onChange={() => setSettings((current) => ({ ...current, size }))}
              className="peer sr-only"
            />
            <span className="block rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 tabular-nums ring-1 ring-white/15 transition peer-checked:bg-white peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
              {size}×{size}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-4">
        <Toggle
          label="DLC を含む"
          checked={settings.dlc}
          onChange={(dlc) => setSettings((current) => ({ ...current, dlc }))}
        />
        <Toggle
          label="Mii を含む"
          checked={settings.mii}
          onChange={(mii) => setSettings((current) => ({ ...current, mii }))}
        />
      </div>

      <button
        type="submit"
        className="cursor-pointer rounded-xl bg-linear-to-r from-team-red to-team-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
      >
        新しいカードを生成
      </button>
    </form>
  );
}

type ToggleProps = { label: string; checked: boolean; onChange: (checked: boolean) => void };

function Toggle({ label, checked, onChange }: ToggleProps): JSX.Element {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="size-5 accent-team-red"
      />
      {label}
    </label>
  );
}
