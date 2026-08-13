"use client";

import { ChevronLeft } from "lucide-react";
import { useNavigationStore, type TabId } from "@/store/navigationStore";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  backTo?: TabId;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
};

/**
 * Sticky mobile-friendly back header used across tabs/sections/forms.
 */
export default function PageBackHeader({
  title,
  backTo = "home",
  onBack,
  right,
  className,
}: Props) {
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  const handleBack = () => {
    if (onBack) onBack();
    else setActiveTab(backTo);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-surface-border bg-background/90 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface transition-colors hover:bg-surface-elevated active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="truncate text-base font-bold text-white sm:text-lg">{title}</h1>
        </div>
        {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : <div className="w-10" />}
      </div>
    </header>
  );
}
