'use server';
/**
 * @fileOverview AI flow for analyzing civic issue images.
 *
 * - analyzeIssueImage - A function that analyzes an image of a potential civic issue.
 * - AnalyzeIssueImageInput - The input type for the analyzeIssueImage function.
 * - AnalyzeIssueImageOutput - The return type for the analyzeIssueImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { IssueType } from '@/types/issue'; // Import IssueType

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];

const AnalyzeIssueImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a potential civic issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeIssueImageInput = z.infer<typeof AnalyzeIssueImageInputSchema>;

const AnalyzeIssueImageOutputSchema = z.object({
    detectedType: z.enum(issueTypes).describe('The most likely type of civic issue detected in the image (Road, Garbage, Streetlight, Park, Other).'),
    suggestedTitle: z.string().describe('A concise, suggested title for the issue report based on the image (max 50 characters).'),
    suggestedDescription: z.string().describe('A brief suggested description of the issue based on the image (max 150 characters).'),
});
export type AnalyzeIssueImageOutput = z.infer<typeof AnalyzeIssueImageOutputSchema>;

export async function analyzeIssueImage(input: AnalyzeIssueImageInput): Promise<AnalyzeIssueImageOutput> {
  return analyzeIssueImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeIssueImagePrompt',
  input: {
    schema: AnalyzeIssueImageInputSchema,
  },
  output: {
    schema: AnalyzeIssueImageOutputSchema,
  },
  prompt: `Analyze the provided image of a potential civic issue. Based *only* on the visual content of the image, determine the most appropriate category from the following types: ${issueTypes.join(', ')}.

Also, provide a concise title (max 50 chars) and a brief description (max 150 chars) summarizing the issue shown in the image. Focus on what is visually evident.

Image: {{media url=imageDataUri}}`,
});

const analyzeIssueImageFlow = ai.defineFlow<
  typeof AnalyzeIssueImageInputSchema,
  typeof AnalyzeIssueImageOutputSchema
>(
  {
    name: 'analyzeIssueImageFlow',
    inputSchema: AnalyzeIssueImageInputSchema,
    outputSchema: AnalyzeIssueImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure output is not null, providing default values or handling errors if necessary
    if (!output) {
      throw new Error("AI analysis failed to produce an output.");
    }
    return output;
  }
);
