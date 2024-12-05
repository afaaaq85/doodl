import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { wordList } from "@/utils/wordList";
import socket from "@/services/socket";
import { useEffect } from "react";

const WordsModal = ({
  open,
  setOpen,
  setCurrentWord,
  roomId
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  setCurrentWord: (word: string) => void;
  roomId: string | undefined;
}) => {
  const handleSelectWord = (word: string) => {
    setCurrentWord(word);
    socket.emit("word_selected", word, roomId);
    socket.emit("start_game", roomId);
    setOpen(false);
  };

  useEffect(() => {
    socket.on("word_selected", (word) => {
      setCurrentWord(word);
    });
    return () => {
      socket.off("word_selected");
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a word</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="flex flex-1 gap-2">
            {Array.from(
              { length: 3 },
              () => wordList[Math.floor(Math.random() * wordList.length)]
            ).map((word) => (
              <Button
                key={word}
                variant="outline"
                size="sm"
                className="px-3"
                onClick={() => {
                  handleSelectWord(word);
                }}
              >
                {word}
              </Button>
            ))}
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

export default WordsModal;
