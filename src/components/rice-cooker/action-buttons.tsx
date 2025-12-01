
"use client";

import { Button } from "@/components/ui/button";
import { Play, Square, CookingPot, Loader, Droplets, Wheat } from "lucide-react";
import { type Status } from "@/hooks/use-device";

type ActionButtonsProps = {
  status: Status;
  onAddWater: () => void;
  onDispenseRice: () => void;
  onCook: () => void;
  onCancel: () => void;
  isRunning: boolean;
  isActionDisabled: boolean;
  isConnected: boolean;
};

export function ActionButtons({ status, onAddWater, onDispenseRice, onCook, onCancel, isRunning, isActionDisabled, isConnected }: ActionButtonsProps) {
  const isSendingCommand = status === 'SENDING_COMMAND';
    
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
      <Button
        onClick={onAddWater}
        disabled={isActionDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        {isSendingCommand ? (
            <Loader className="mr-2 h-5 w-5 animate-spin" />
        ) : (
            <Droplets className="mr-2 h-5 w-5" />
        )}
        Add Water
      </Button>
      <Button
        onClick={onDispenseRice}
        disabled={isActionDisabled}
        size="lg"
        className="w-full text-lg font-bold tracking-wider"
      >
        {isSendingCommand ? (
            <Loader className="mr-2 h-5 w-5 animate-spin" />
        ) : (
            <Wheat className="mr-2 h-5 w-5" />
        )}
        Dispense Rice
      </Button>
      <Button
        onClick={onCook}
        disabled={isActionDisabled}
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
        className="w-full text-lg font-bold tracking-wider col-span-1 sm:col-span-2 lg:col-span-3"
        variant="destructive"
      >
        <Square className="mr-2 h-5 w-5" />
        CANCEL
      </Button>
    </div>
  );
}
