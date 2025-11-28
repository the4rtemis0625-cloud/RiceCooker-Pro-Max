
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Wheat, Droplets, CookingPot, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DeviceSettings } from "@/hooks/use-device";

type SettingsPanelProps = {
  durations: DeviceSettings;
  setDurations: (settings: Partial<DeviceSettings>) => void;
  isDisabled: boolean;
};

type CustomPreset = {
  name: string;
  pumpTime: number;
  dispenseTime: number;
  cookTime: number;
};

export function SettingsPanel({ durations, setDurations, isDisabled }: SettingsPanelProps) {
  const { pumpTime, dispenseTime, cookTime } = durations;
  
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem("ricecooker-custom-presets");
      if (savedPresets) {
        setCustomPresets(JSON.parse(savedPresets));
      }
    } catch (error) {
      console.error("Could not load custom presets from localStorage", error);
    }
  }, []);

  const handleSetDurations = (newDurations: Partial<DeviceSettings>) => {
    if (isDisabled) return;
    setDurations(newDurations);
  }

  const handlePreset = (preset: 'small' | 'medium' | 'large') => {
    switch (preset) {
      case 'small':
        handleSetDurations({ pumpTime: 5, dispenseTime: 3, cookTime: 20 });
        break;
      case 'medium':
        handleSetDurations({ pumpTime: 10, dispenseTime: 5, cookTime: 30 });
        break;
      case 'large':
        handleSetDurations({ pumpTime: 15, dispenseTime: 8, cookTime: 45 });
        break;
    }
  };

  const handleCustomPreset = (preset: CustomPreset) => {
    handleSetDurations({
      pumpTime: preset.pumpTime,
      dispenseTime: preset.dispenseTime,
      cookTime: preset.cookTime,
    });
  };

  const handleSaveCustomPreset = () => {
    if (newPresetName.trim() === "") return;

    const newPreset: CustomPreset = {
      name: newPresetName,
      pumpTime: pumpTime,
      dispenseTime: dispenseTime,
      cookTime: cookTime,
    };

    const updatedPresets = [...customPresets, newPreset];
    setCustomPresets(updatedPresets);
    try {
      localStorage.setItem("ricecooker-custom-presets", JSON.stringify(updatedPresets));
    } catch (error) {
      console.error("Could not save custom presets to localStorage", error);
    }
    setNewPresetName("");
    setIsDialogOpen(false);
  };


  return (
    <Card className={cn("border-primary/20", isDisabled && "opacity-50")}>
      <CardHeader>
        <CardTitle className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Operation Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-8", isDisabled && "opacity-50")}>
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground">Presets</Label>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handlePreset('small')} disabled={isDisabled}>1 Person</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('medium')} disabled={isDisabled}>2 People</Button>
            <Button variant="outline" size="sm" onClick={() => handlePreset('large')} disabled={isDisabled}>4 People</Button>
            {customPresets.map((preset) => (
              <Button key={preset.name} variant="outline" size="sm" onClick={() => handleCustomPreset(preset)} disabled={isDisabled}>
                {preset.name}
              </Button>
            ))}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isDisabled} className="flex items-center gap-1 text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  Save Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Custom Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p>Save the current slider values as a new preset.</p>
                  <Input 
                    placeholder="Preset Name (e.g., 'Quick Cook')" 
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveCustomPreset} disabled={!newPresetName.trim()}>Save Preset</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pump-time" className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-primary/70" />
              Add Water Time
            </Label>
            <span className="font-mono text-lg">{pumpTime}s</span>
          </div>
          <Slider
            id="pump-time"
            min={1}
            max={30}
            step={1}
            value={[pumpTime]}
            onValueChange={(value) => handleSetDurations({ pumpTime: value[0] })}
            disabled={isDisabled}
          />
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dispense-time" className="flex items-center gap-2 text-lg">
              <Wheat className="h-5 w-5 text-primary/70" />
              Dispense Rice Time
            </Label>
            <span className="font-mono text-lg">{dispenseTime}s</span>
          </div>
          <Slider
            id="dispense-time"
            min={1}
            max={30}
            step={1}
            value={[dispenseTime]}
            onValueChange={(value) => handleSetDurations({ dispenseTime: value[0] })}
            disabled={isDisabled}
          />
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="cook-time" className="flex items-center gap-2 text-lg">
              <CookingPot className="h-5 w-5 text-primary/70" />
              Cook Duration
            </Label>
            <span className="font-mono text-lg">{cookTime}m</span>
          </div>
          <Slider
            id="cook-time"
            min={10}
            max={120}
            step={1}
            value={[cookTime]}
            onValueChange={(value) => handleSetDurations({ cookTime: value[0] })}
            disabled={isDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
