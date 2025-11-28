
"use client";

import { Button } from "@/components/ui/button";
import { Play, Square, CookingPot } from "lucide-react";

type ActionButtonsProps = {
  onStart: () => void;
  onCook: () => void;
  onCancel: () => void;
  isRunning: boolean;
  isDisabled: boolean;
};

export function ActionButtons({ onStart, onCook, onCancel, isRunning, isDisabled }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <Button
        onClick={onStart}
        disabled={isDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        <Play className="mr-2 h-5 w-5" />
        Dispense & Add Water
      </Button>
      <Button
        onClick={onCook}
        disabled={isDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        <CookingPot className="mr-2 h-5 w-5" />
        Cook Rice
      </Button>
      <Button
        onClick={onCancel}
        disabled={!isRunning || isDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
        variant="destructive"
      >
        <Square className="mr-2 h-5 w-5" />
        CANCEL
      </Button>
    </div>
  );
}
