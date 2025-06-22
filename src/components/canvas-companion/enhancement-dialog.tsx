"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type EnhancementDialogProps = {
  result: {
    enhancedCode: string;
    suggestions: string[];
  };
  onAccept: () => void;
  onOpenChange: (open: boolean) => void;
};

export function EnhancementDialog({
  result,
  onAccept,
  onOpenChange,
}: EnhancementDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Code Enhancement Suggestions</DialogTitle>
          <DialogDescription>
            AI has suggested the following improvements for your code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold font-headline text-lg">Suggestions</h3>
            <ScrollArea className="flex-1 rounded-md border p-4">
              <ul className="list-disc pl-5 space-y-3 text-sm">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold font-headline text-lg">Enhanced Code</h3>
            <ScrollArea className="flex-1 rounded-md bg-muted">
              <pre className="p-4 text-sm font-code">
                <code>{result.enhancedCode}</code>
              </pre>
            </ScrollArea>
          </div>
        </div>
        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onAccept}>Accept & Use Code</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
