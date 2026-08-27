"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Stepper } from "./Stepper";
import type { StepKey } from "@/lib/steps";

export function StepShell({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step: StepKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-28 pt-6 sm:pt-10">
      <header className="mb-6">
        <Link
          href="/upload"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Split<span className="text-emerald-600">-It</span>
        </Link>
        <div className="mt-4">
          <Stepper current={step} />
        </div>
      </header>

      <main className="flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </main>

      {footer ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-4">
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  );
}
