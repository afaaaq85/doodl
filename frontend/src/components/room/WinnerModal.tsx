import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const WinnerModal = ({
  open,
  setOpen,
  winner,
  currentWord
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  winner: string;
  currentWord: string;
}) => {
  return (
    <Card
      className={`${
        open ? "flex flex-col items-center" : "hidden"
      } md:w-[500px] w-[300px] shadow-lg absolute py-24 left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg`}
    >
      <CardHeader>
        <CardTitle className="text-4xl">Winner: {winner}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4 text-xl" >
        <p>Word was</p>
      </CardContent>
      <CardFooter >
        <p className="text-2xl font-semibold">'{currentWord}'</p>
      </CardFooter>
      <Button variant={"ghost"} className="absolute right-0 top-0 m-1" onClick={() => setOpen(false)}><X/></Button>
    </Card>
  );
};

export default WinnerModal;
