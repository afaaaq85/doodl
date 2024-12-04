import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WinnerModal = ({
  open,
  setOpen,
  winner,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  winner: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a word</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="flex flex-1 gap-2">
            <h2>Round over</h2>
            <p>Winner:{winner}</p>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <div className="flex w-full justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                Close
              </Button>
            </div>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;
