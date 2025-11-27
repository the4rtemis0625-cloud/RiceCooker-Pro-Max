"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Wheat, Droplets, CookingPot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SettingsPanelProps = {
  durations: {
    dispenseDuration: number;
    washDuration: number;
    cookDuration: number;
  };
  setDurations: {
    setDispenseDuration: (value: number) => void;
    setWashDuration: (value: number) => void;
    setCookDuration: (value: number) => void;
  };
  isDisabled: boolean;
};

export function SettingsPanel({ durations, setDurations, isDisabled }: SettingsPanelProps) {
  const { dispenseDuration, washDuration, cookDuration } = durations;
  const { setDispenseDuration, setWashDuration, setCookDuration } = setDurations;
  
  const handlePreset = (preset: 'small' | 'medium' | 'large') => {
    if (isDisabled) return;
    switch (preset) {
      case 'small':
        setDispenseDuration(3);
        setWashDuration(10);
        setCookDuration(20);
        break;
      case 'medium':
        setDispenseDuration(5);
        setWashDuration(15);
        setCookDuration(30);
        break;
      case 'large':
        setDispenseDuration(8);
        setWashDuration(20);
        setCookDuration(45);
        break;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Operation Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-8", isDisabled && "opacity-50")}>
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground">Presets</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePreset('small')} disabled={isDisabled}>Small</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('medium')} disabled={isDisabled}>Medium</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('large')} disabled={isDisabled}>Large</Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dispense-duration" className="flex items-center gap-2 text-lg">
              <Wheat className="h-5 w-5 text-primary/70" />
              Dispense Duration
            </Label>
            <span className="font-mono text-lg">{dispenseDuration}s</span>
          </div>
          <Slider
            id="dispense-duration"
            min={1}
            max={30}
            step={1}
            value={[dispenseDuration]}
            onValueChange={(value) => setDispenseDuration(value[0])}
            disabled={isDisabled}
          />
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="wash-duration" className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-primary/70" />
              Wash Duration
            </Label>
            <span className="font-mono text-lg">{washDuration}s</span>
          </div>
          <Slider
            id="wash-duration"
            min={5}
            max={60}
            step={5}
            value={[washDuration]}
            onValueChange={(value) => setWashDuration(value[0])}
            disabled={isDisabled}
          />
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cook-duration" className="flex items-center gap-2 text-lg">
              <CookingPot className="h-5 w-5 text-primary/70" />
              Cook Duration
            </Label>
            <span className="font-mono text-lg">{cookDuration}s</span>
          </div>
          <Slider
            id="cook-duration"
            min={10}
            max={120}
            step={1}
            value={[cookDuration]}
            onValueChange={(value) => setCookDuration(value[0])}
            disabled={isDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
