"use client";
import { useMemo, useState, type ReactNode } from "react";

type LeaseType = "new" | "renewal" | "other";

/* ===== Helpers ===== */
function toNum(s: string): number {
  if (!s) return 0;
  return Number(s.replace(/,/g, "."));
}

function tieredRateSum(months: number): number {
  const m1 = Math.min(months, 60);
  const m2 = Math.min(Math.max(months - 60, 0), 60);
  const m3 = Math.max(months - 120, 0);
  return m1 * 0.035 + m2 * 0.0275 + m3 * 0.025;
}

// format en "xxxxx.xx" (pas d'espace, point décimal)
const fmt = (n: number) =>
  (n || 0).toFixed(2);

/* ===== Page ===== */
export default function Page() {
  const [rent, setRent] = useState<string>("10000");
  
  // Nouveaux états pour la durée brute et la franchise
  const [contractLength, setContractLength] = useState<string>("12");
  const [rentFree, setRentFree] = useState<string>("0");

  const [type, setType] = useState<LeaseType>("new");
  const [capex, setCapex] = useState<string>("");

  // Valeurs numériques
  const rentVal = toNum(rent);
  const contractLengthVal = Math.max(0, Math.floor(toNum(contractLength)));
  const rentFreeVal = Math.max(0, toNum(rentFree));
  const capexVal = Math.max(0, toNum(capex));

  // Calcul de la durée effective (Duration) pour le backend
  // Duration = Contract Length - Rent Free Months
  const monthsVal = Math.max(0, contractLengthVal - rentFreeVal);

  const fee = useMemo<number>(() => {
    // On utilise monthsVal (durée effective) pour tous les calculs
    if (!rentVal || !monthsVal) return 0;

    if (type !== "new") {
      // 1% × (months × rent − capex)
      return Math.max(0, monthsVal * rentVal - capexVal) * 0.01;
    }

    // NEW: 3.5% (0-60), 2.75% (61-120), 2.5% (>120) ; capex déduit au taux moyen pondéré
    const sum = tieredRateSum(monthsVal); // somme des (mois × taux)
    const feeOnRent = rentVal * sum;
    const effectiveRate = monthsVal > 0 ? sum / monthsVal : 0;
    const feeOnCapex = capexVal * effectiveRate;
    return Math.max(0, feeOnRent - feeOnCapex);
  }, [rentVal, monthsVal, capexVal, type]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <HeroBackground />
      <div className="relative z-10">
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Fee Calculator</h1>
        </div>

        <section className="mx-auto mt-8 max-w-3xl px-6 pb-14">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            
            {/* Row 1: Rent & Time inputs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Rent (EUR)">
                <input
                  inputMode="decimal"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-zinc-300 focus:border-white/25"
                  placeholder="10000"
                />
              </Field>

              <Field label="Contract Length">
                <div className="relative">
                  <input
                    inputMode="numeric"
                    value={contractLength}
                    onChange={(e) => setContractLength(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 pr-16 text-white outline-none placeholder:text-zinc-300 focus:border-white/25"
                    placeholder="12"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-300">
                    months
                  </span>
                </div>
              </Field>

              <Field label="Rent Free">
                <div className="relative">
                  <input
                    inputMode="numeric"
                    value={rentFree}
                    onChange={(e) => setRentFree(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 pr-16 text-white outline-none placeholder:text-zinc-300 focus:border-white/25"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-300">
                    months
                  </span>
                </div>
              </Field>
            </div>

            {/* Row 2: Type & Capex */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Type">
                <Segmented
                  value={type}
                  onChange={setType}
                  options={[
                    { value: "new", label: "New" },
                    { value: "renewal", label: "Renewal" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Field>

              <Field label="Capex (EUR)">
                <input
                  inputMode="decimal"
                  value={capex}
                  onChange={(e) => setCapex(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-white outline-none placeholder:text-zinc-300 focus:border-white/25"
                  placeholder="0"
                />
              </Field>

              {/* Display calculated effective duration for clarity (Optional, but helpful for debugging/transparency) */}
              <div className="hidden md:block">
                 <Field label="Effective Duration" hint="Calculated automatically">
                    <div className="w-full px-3 py-2 text-zinc-400">
                        {monthsVal} months
                    </div>
                 </Field>
              </div>
            </div>

            <button
              className="mt-6 w-full rounded-xl border border-white/10 bg-white/15 py-3 text-lg font-medium tracking-wide hover:bg-white/25"
              onClick={() => {}}
            >
              Calculate
            </button>

            <div className="mt-6 text-center text-2xl font-semibold md:text-3xl">{`Fee: ${fmt(fee)}`}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ===== UI bits ===== */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-zinc-200">{label}</div>
      {children}
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </label>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: LeaseType;
  onChange: (v: LeaseType) => void;
  options: { value: LeaseType; label: string }[];
}) {
  return (
    <div className="flex rounded-xl border border-white/15 bg-white/10 p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "flex-1 rounded-lg px-3 py-2 text-sm transition " +
              (active ? "bg-white/25 border border-white/20" : "hover:bg-white/15 text-zinc-200")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ===== Fancy background (visible) ===== */
function HeroBackground() {
  return (
    <>
      {/* base gradient + vignettes */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-[#0b0f2e] via-[#081436] to-[#021b3a]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(80rem_40rem_at_10%_80%,rgba(255,153,51,0.25),transparent_60%)]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(80rem_40rem_at_90%_10%,rgba(64,149,255,0.25),transparent_60%)]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70" />

      {/* beams */}
      <svg className="absolute inset-0 z-0 h-full w-full" viewBox="0 0 1440 900" aria-hidden="true">
        <defs>
          <linearGradient id="trailWarm" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff9a3c" />
            <stop offset="50%" stopColor="#ff5d2d" />
            <stop offset="100%" stopColor="#ffd46b" />
          </linearGradient>
          <linearGradient id="trailCool" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6bc9ff" />
            <stop offset="60%" stopColor="#4085ff" />
            <stop offset="100%" stopColor="#7bf3ff" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="20" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M900 80C1100 120 1240 200 1400 360"
          stroke="url(#trailCool)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          filter="url(#softGlow)"
          opacity="0.85"
        />
        <path
          d="M860 160C1050 200 1240 280 1440 500"
          stroke="url(#trailCool)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#softGlow)"
          opacity="0.7"
        />
        <path
          d="M-40 640C120 620 260 610 420 640C640 682 820 780 1100 820"
          stroke="url(#trailWarm)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
          filter="url(#softGlow)"
          opacity="0.9"
        />
        <path
          d="M-60 700C100 680 280 690 460 720C780 772 990 860 1260 880"
          stroke="url(#trailWarm)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          filter="url(#softGlow)"
          opacity="0.75"
        />
      </svg>
    </>
  );
}