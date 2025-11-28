
"use client";

import { Button } from "@/components/ui/button";
import { Play, Square, CookingPot, Loader } from "lucide-react";
import { type Status } from "@/hooks/use-device";

type ActionButtonsProps = {
  status: Status;
  onStart: () => void;
  onCook: () => void;
  onCancel: () => void;
  isRunning: boolean;
  isStartCookDisabled: boolean;
  isConnected: boolean;
};

export function ActionButtons({ status, onStart, onCook, onCancel, isRunning, isStartCookDisabled, isConnected }: ActionButtonsProps) {
  const isSendingCommand = status === 'SENDING_COMMAND';
    
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <Button
        onClick={onStart}
        disabled={isStartCookDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        {isSendingCommand ? (
            <Loader className="mr-2 h-5 w-5 animate-spin" />
        ) : (
            <Play className="mr-2 h-5 w-5" />
        )}
        Add Water & Dispense Rice
      </Button>
      <Button
        onClick={onCook}
        disabled={isStartCookDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        <CookingPot className="mr-2 h-5 w-5" />
        Cook Rice
      </Button>
      <Button
        onClick={onCancel}
        disabled={!isRunning}
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
