"use client";

import { useState } from "react";
import Image from "next/image";
import { imageToCode } from "@/ai/flows/image-to-code";
import { codeEnhancementSuggestions } from "@/ai/flows/code-enhancement";
import { useToast } from "@/hooks/use-toast";

import PageHeader from "@/components/canvas-companion/page-header";
import ImageUploadCard from "@/components/canvas-companion/image-upload-card";
import CodeView from "@/components/canvas-companion/code-view";
import { EnhancementDialog } from "@/components/canvas-companion/enhancement-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EnhancementResult = {
  enhancedCode: string;
  suggestions: string[];
};

export default function Home() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [enhancementResult, setEnhancementResult] =
    useState<EnhancementResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const { toast } = useToast();

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setImageDataUri(base64data);
      generateCode(base64data);
    };
    reader.readAsDataURL(file);
  };

  const generateCode = async (dataUri: string) => {
    setIsGenerating(true);
    setGeneratedCode("");
    try {
      const result = await imageToCode({ imageDataUri: dataUri });
      setGeneratedCode(result.code);
      toast({
        title: "Success!",
        description: "Code has been generated from your image.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate code from image. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceCode = async () => {
    if (!generatedCode) return;
    setIsEnhancing(true);
    try {
      const result = await codeEnhancementSuggestions({ code: generatedCode });
      setEnhancementResult(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get enhancement suggestions. Please try again.",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(
      () => {
        toast({
          title: "Copied!",
          description: "Code copied to clipboard.",
        });
      },
      (err) => {
        console.error("Failed to copy: ", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to copy code to clipboard.",
        });
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        onEnhance={handleEnhanceCode}
        onExport={handleCopyCode}
        isEnhancing={isEnhancing}
        codeExists={!!generatedCode}
      />
      <main className="flex-1 grid md:grid-cols-2 gap-6 p-4 md:p-6 overflow-y-auto">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Your Design</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {imageDataUri ? (
              <div className="w-full h-full relative rounded-lg overflow-hidden border">
                <Image
                  src={imageDataUri}
                  alt="Uploaded design"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            ) : (
              <ImageUploadCard
                onImageUpload={handleImageUpload}
                isGenerating={isGenerating}
              />
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline">Generated Code</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <CodeView
              value={generatedCode}
              onChange={(e) => setGeneratedCode(e.target.value)}
              isGenerating={isGenerating}
            />
          </CardContent>
        </Card>
      </main>

      {enhancementResult && (
        <EnhancementDialog
          result={enhancementResult}
          onAccept={() => {
            setGeneratedCode(enhancementResult.enhancedCode);
            setEnhancementResult(null);
            toast({
              title: "Code Updated",
              description: "The enhanced code has been applied.",
            });
          }}
          onOpenChange={(open) => !open && setEnhancementResult(null)}
        />
      )}
    </div>
  );
}
