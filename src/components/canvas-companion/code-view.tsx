"use client";

import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type CodeViewProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isGenerating: boolean;
};

const CodeView = ({ value, onChange, isGenerating }: CodeViewProps) => {
  if (isGenerating) {
    return <Skeleton className="w-full h-full min-h-[400px] rounded-lg" />;
  }

  return (
    <div className="relative h-full w-full">
      <Textarea
        value={value}
        onChange={onChange}
        className="font-code h-full w-full min-h-[400px] resize-none text-sm"
        placeholder="Generated code will appear here..."
        aria-label="Generated Code"
      />
    </div>
  );
};

export default CodeView;
