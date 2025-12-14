import { SettingsSubnav } from "@/components/settings/settings-subnav";

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

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

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="text-lg font-semibold tracking-tight">Settings</div>
        <div className="mt-1 text-sm text-slate-600/80 dark:text-slate-300/70">
          Kelola profil, tema, dan keamanan akun.
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left nav */}
        <GlassCard className="h-fit p-3 sm:p-4">
          <SettingsSubnav />
        </GlassCard>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
