"use client";

import { useSyncExternalStore } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const ACCENTS = [
  { key: "sky", label: "Sky" },
  { key: "violet", label: "Violet" },
  { key: "emerald", label: "Emerald" },
  { key: "rose", label: "Rose" },
] as const;

type AccentKey = (typeof ACCENTS)[number]["key"];
const LS_ACCENT = "mycms_accent";
const EVENT = "mycms:accent";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

function isAccentKey(v: string | null): v is AccentKey {
  return ACCENTS.some((a) => a.key === v);
}

function getAccentSnapshot(): AccentKey {
  const dom = document.documentElement.dataset.accent ?? null;
  if (isAccentKey(dom)) return dom;

  const saved = window.localStorage.getItem(LS_ACCENT);
  if (isAccentKey(saved)) return saved;

  return "sky";
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_ACCENT) cb();
  };
  const onCustom = () => cb();

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onCustom as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onCustom as EventListener);
  };
}

function setAccent(next: AccentKey) {
  document.documentElement.dataset.accent = next;
  try {
    window.localStorage.setItem(LS_ACCENT, next);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}


const subtleText = "text-slate-600/80 dark:text-slate-300/70";

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-white/20 bg-white/50 backdrop-blur-xl",
        "shadow-[0_20px_60px_-25px_rgba(2,6,23,0.18)]",
        "dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      {children}
    </div>
  );
}

function AccentDot({ k }: { k: AccentKey }) {
  const cls =
    k === "sky"
      ? "bg-sky-500"
      : k === "violet"
      ? "bg-violet-500"
      : k === "emerald"
      ? "bg-emerald-500"
      : "bg-rose-500";
  return <span className={cx("h-2.5 w-2.5 rounded-full", cls)} />;
}

function AccentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
        "backdrop-blur-md",
        active
          ? cx(
              "text-white",
              "border-transparent",
              "bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(56,189,248,0.95))]",
              "shadow-[0_12px_30px_-15px_rgba(99,102,241,0.45)]"
            )
          : cx(
              "border-slate-200/70 bg-white/60 hover:bg-white/80",
              "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            )
      )}
    >
      {children}
    </button>
  );
}


export default function ThemeSettingsPage() {
  const accent = useSyncExternalStore(subscribe, getAccentSnapshot, () => "sky");

  return (
    <GlassCard className="p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">
            Theme Settings
          </div>
          <div className={cx("text-sm", subtleText)}>
            Dark/light + accent color untuk seluruh UI.
          </div>
        </div>

        <ThemeToggle className="border-slate-200/70 bg-white/60 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10" />
      </div>

      <GlassCard className="p-4 space-y-3">
        <div className="text-sm font-semibold tracking-tight">Accent Color</div>

        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => {
            const active = accent === a.key;
            return (
              <AccentButton
                key={a.key}
                active={active}
                onClick={() => setAccent(a.key)}
              >
                <AccentDot k={a.key} />
                {a.label}
              </AccentButton>
            );
          })}
        </div>

        <div className={cx("text-xs", subtleText)}>
          Accent dipakai untuk tombol utama, highlight, ring fokus, dll.
        </div>
      </GlassCard>
    </GlassCard>
  );
}
