"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wand2, ClipboardCopy, Loader2 } from "lucide-react";
import Logo from "./logo";

type PageHeaderProps = {
  onEnhance: () => void;
  onExport: () => void;
  isEnhancing: boolean;
  codeExists: boolean;
};

const PageHeader = ({
  onEnhance,
  onExport,
  isEnhancing,
  codeExists,
}: PageHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-xl font-bold font-headline tracking-tight">
            Canvas Companion
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onEnhance}
            disabled={isEnhancing || !codeExists}
            aria-label="Enhance Code"
            variant="outline"
          >
            {isEnhancing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Wand2 />
            )}
            <span className="hidden md:inline">Enhance Code</span>
          </Button>
          <Button
            onClick={onExport}
            disabled={!codeExists}
            aria-label="Copy Code"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <ClipboardCopy />
            <span className="hidden md:inline">Copy Code</span>
          </Button>
        </div>
      </div>
      <Separator />
    </header>
  );
};

export default PageHeader;
