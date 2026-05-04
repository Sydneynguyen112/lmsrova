"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMachine } from "@/lib/co-may/mock-data";

export function CreateMachineDialog({
  userId,
  onCreated,
}: {
  userId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [capital, setCapital] = useState("");
  const [anchor, setAnchor] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCapital("");
    setAnchor("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const capitalNum = Number(capital);
    const anchorNum = Number(anchor);
    if (!name.trim()) return setError("Tên không được để trống");
    if (!Number.isFinite(capitalNum) || capitalNum <= 0)
      return setError("Vốn phải > 0");
    if (!Number.isFinite(anchorNum) || anchorNum <= 0)
      return setError("Anchor phải > 0");

    addMachine(userId, {
      name: name.trim(),
      capital: capitalNum,
      current_anchor: anchorNum,
    });
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="anchor" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Tạo cỗ máy mới
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo cỗ máy mới</DialogTitle>
          <DialogDescription>
            Khởi động một chu kỳ trading mới với vốn và anchor (mức rút) ban đầu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Tên cỗ máy</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cỗ máy XAUUSD..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Vốn (USD)</label>
              <Input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="5000"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Anchor (USD)</label>
              <Input
                type="number"
                value={anchor}
                onChange={(e) => setAnchor(e.target.value)}
                placeholder="5500"
                min={1}
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="-mx-4 -mb-4 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" variant="anchor">
              Tạo cỗ máy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
