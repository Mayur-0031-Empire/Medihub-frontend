import { AppSettingsPanel } from "@/components/settings/AppSettingsPanel";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100%,24rem)] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Theme, appearance, and accessibility preferences.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-1">
          <AppSettingsPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
