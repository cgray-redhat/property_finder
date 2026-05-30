"use client";

import {
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_INTEREST_RATE_ANNUAL,
} from "@/lib/calculations";
import { useInvestLocateStore } from "@/store/invest-locate-store";

const DOWN_PAYMENT_MIN = 0.05;
const DOWN_PAYMENT_MAX = 0.5;
const INTEREST_RATE_MIN = 0.03;
const INTEREST_RATE_MAX = 0.12;

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

type SliderFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-emerald-800">
          {displayValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-emerald-700"
      />
    </div>
  );
}

export function WhatIfSidebar() {
  const downPaymentPercent = useInvestLocateStore(
    (state) => state.downPaymentPercent,
  );
  const interestRateAnnual = useInvestLocateStore(
    (state) => state.interestRateAnnual,
  );
  const setDownPaymentPercent = useInvestLocateStore(
    (state) => state.setDownPaymentPercent,
  );
  const setInterestRateAnnual = useInvestLocateStore(
    (state) => state.setInterestRateAnnual,
  );

  return (
    <aside className="sticky top-6 h-fit w-full shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:w-72">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
          What-If
        </p>
        <h2 className="text-lg font-semibold text-zinc-900">
          Financing assumptions
        </h2>
        <p className="text-sm text-zinc-600">
          Adjust down payment or interest rate to instantly recalculate
          Cash-on-Cash returns across the ranked list.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <SliderField
          id="down-payment"
          label="Down payment"
          value={downPaymentPercent}
          min={DOWN_PAYMENT_MIN}
          max={DOWN_PAYMENT_MAX}
          step={0.01}
          displayValue={formatPercent(downPaymentPercent, 0)}
          onChange={setDownPaymentPercent}
        />

        <SliderField
          id="interest-rate"
          label="Loan interest rate"
          value={interestRateAnnual}
          min={INTEREST_RATE_MIN}
          max={INTEREST_RATE_MAX}
          step={0.001}
          displayValue={formatPercent(interestRateAnnual)}
          onChange={setInterestRateAnnual}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Down %</span>
            <input
              type="number"
              min={DOWN_PAYMENT_MIN * 100}
              max={DOWN_PAYMENT_MAX * 100}
              step={1}
              value={Math.round(downPaymentPercent * 100)}
              onChange={(event) =>
                setDownPaymentPercent(Number(event.target.value) / 100)
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Rate %</span>
            <input
              type="number"
              min={INTEREST_RATE_MIN * 100}
              max={INTEREST_RATE_MAX * 100}
              step={0.1}
              value={Number((interestRateAnnual * 100).toFixed(2))}
              onChange={(event) =>
                setInterestRateAnnual(Number(event.target.value) / 100)
              }
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setDownPaymentPercent(DEFAULT_DOWN_PAYMENT_PERCENT);
          setInterestRateAnnual(DEFAULT_INTEREST_RATE_ANNUAL);
        }}
        className="mt-6 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Reset to defaults
      </button>
    </aside>
  );
}
