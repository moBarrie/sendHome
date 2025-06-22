'use server';

/**
 * @fileOverview AI-powered code enhancement suggestions.
 *
 * - codeEnhancementSuggestions - A function that provides code enhancement suggestions based on best practices.
 * - CodeEnhancementInput - The input type for the codeEnhancementSuggestions function.
 * - CodeEnhancementOutput - The return type for the codeEnhancementSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeEnhancementInputSchema = z.object({
  code: z.string().describe('The code to be enhanced.'),
});
export type CodeEnhancementInput = z.infer<typeof CodeEnhancementInputSchema>;

const CodeEnhancementOutputSchema = z.object({
  enhancedCode: z.string().describe('The enhanced code with improvements.'),
  suggestions: z.array(z.string()).describe('Specific suggestions for improvement.'),
});
export type CodeEnhancementOutput = z.infer<typeof CodeEnhancementOutputSchema>;

export async function codeEnhancementSuggestions(input: CodeEnhancementInput): Promise<CodeEnhancementOutput> {
  return codeEnhancementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeEnhancementPrompt',
  input: {schema: CodeEnhancementInputSchema},
  output: {schema: CodeEnhancementOutputSchema},
  prompt: `You are an AI code enhancement tool. Given the following code, provide enhanced code with improvements based on best practices, and list specific suggestions for the improvements.\n\nCode:\n\n{{{code}}}`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const codeEnhancementFlow = ai.defineFlow(
  {
    name: 'codeEnhancementFlow',
    inputSchema: CodeEnhancementInputSchema,
    outputSchema: CodeEnhancementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
