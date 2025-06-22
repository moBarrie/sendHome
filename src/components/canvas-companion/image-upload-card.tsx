"use client";

import { useState, useRef } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

type ImageUploadCardProps = {
  onImageUpload: (file: File) => void;
  isGenerating: boolean;
};

const ImageUploadCard = ({
  onImageUpload,
  isGenerating,
}: ImageUploadCardProps) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
        dragActive ? "border-primary bg-primary/10" : "border-border"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={isGenerating}
      />
      {isGenerating ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold font-headline">
            Generating Code...
          </h3>
          <p className="text-muted-foreground">
            Please wait while the AI works its magic.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold font-headline">
            Upload Your Design
          </h3>
          <p className="text-muted-foreground">
            Drag & drop an image here, or{" "}
            <button
              onClick={onButtonClick}
              className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
            >
              click to browse
            </button>
            .
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Supports PNG, JPG, GIF up to 10MB
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadCard;
