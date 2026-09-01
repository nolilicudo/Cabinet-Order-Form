import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatDeletionError } from "@/lib/deleteOrderFeedback";
import { trpc } from "@/lib/trpc";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type DeleteOrderDialogProps = {
  orderId: number;
  estimateNumber: string;
};

export function DeleteOrderDialog({ orderId, estimateNumber }: DeleteOrderDialogProps) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const remove = trpc.orders.delete.useMutation({
    onSuccess: () => {
      toast.success(`Order ${estimateNumber} deleted.`);
      void utils.orders.list.invalidate();
      void utils.orders.get.invalidate({ orderId });
      setLocation("/");
    },
    onError: error => toast.error(formatDeletionError(error)),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5 border-[#e5c7bf] text-[#a3483e] hover:bg-[#fff5f2] hover:text-[#8b3d34]" disabled={remove.isPending}>
          <Trash2 size={14} />Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this cabinet order?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes order {estimateNumber} and all of its cabinet line items. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Keep order</AlertDialogCancel>
          <AlertDialogAction
            className="bg-[#a3483e] text-white hover:bg-[#8b3d34]"
            disabled={remove.isPending}
            onClick={event => {
              event.preventDefault();
              remove.mutate({ orderId });
            }}
          >
            {remove.isPending ? "Deleting…" : "Delete order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
