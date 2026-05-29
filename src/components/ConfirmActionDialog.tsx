import { useState } from "react";

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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ConfirmActionDialogProps = {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  tooltipContent?: React.ReactNode;
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"];
  tooltipAlign?: React.ComponentProps<typeof TooltipContent>["align"];
};

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  destructive = true,
  tooltipContent,
  tooltipSide,
  tooltipAlign,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  };

  const triggerElement = tooltipContent ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide ?? "right"} align={tooltipAlign ?? "center"}>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  ) : (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerElement}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} className="w-full sm:w-auto" onClick={confirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}