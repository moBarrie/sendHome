'use server';

/**
 * @fileOverview Converts an image of a UI design into code.
 *
 * - imageToCode - A function that converts the image to code.
 * - ImageToCodeInput - The input type for the imageToCode function.
 * - ImageToCodeOutput - The return type for the imageToCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToCodeInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a UI design, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToCodeInput = z.infer<typeof ImageToCodeInputSchema>;

const ImageToCodeOutputSchema = z.object({
  code: z.string().describe('The generated code for the UI design.'),
});
export type ImageToCodeOutput = z.infer<typeof ImageToCodeOutputSchema>;

export async function imageToCode(input: ImageToCodeInput): Promise<ImageToCodeOutput> {
  return imageToCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageToCodePrompt',
  input: {schema: ImageToCodeInputSchema},
  output: {schema: ImageToCodeOutputSchema},
  prompt: `You are an expert UI developer that can convert an image of a UI design into code.

  Based on the image, generate the corresponding code.

  Image: {{media url=imageDataUri}}`,
});

const imageToCodeFlow = ai.defineFlow(
  {
    name: 'imageToCodeFlow',
    inputSchema: ImageToCodeInputSchema,
    outputSchema: ImageToCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
