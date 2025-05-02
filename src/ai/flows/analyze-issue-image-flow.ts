
'use server';
/**
 * @fileOverview AI flow for analyzing civic issue images and suggesting details.
 *
 * - analyzeIssueImage - A function that analyzes an image and description of a potential civic issue.
 * - AnalyzeIssueImageInput - The input type for the analyzeIssueImage function.
 * - AnalyzeIssueImageOutput - The return type for the analyzeIssueImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { IssueType, IssuePriority } from '@/types/issue'; // Import IssueType and IssuePriority

const issueTypes: IssueType[] = ["Road", "Garbage", "Streetlight", "Park", "Other"];
const issuePriorities: IssuePriority[] = ["Low", "Medium", "High"];

const AnalyzeIssueImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a potential civic issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
   description: z.string().optional().describe("Optional user-provided description of the issue to provide context for priority assessment."),
});
export type AnalyzeIssueImageInput = z.infer<typeof AnalyzeIssueImageInputSchema>;

const AnalyzeIssueImageOutputSchema = z.object({
    detectedType: z.enum(issueTypes).describe('The most likely type of civic issue detected in the image (Road, Garbage, Streetlight, Park, Other).'),
    suggestedTitle: z.string().describe('A concise, suggested title for the issue report based on the image and description (max 50 characters).'),
    suggestedDescription: z.string().describe('A brief suggested description of the issue based on the image and description (max 150 characters).'),
    suggestedPriority: z.enum(issuePriorities).describe('The suggested priority level (Low, Medium, High) based on the visual severity and description context.'), // Added suggestedPriority
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
  prompt: `Analyze the provided image and optional description of a potential civic issue.

Based *only* on the visual content and the description (if provided), perform the following:
1. Determine the most appropriate category from the following types: ${issueTypes.join(', ')}.
2. Suggest a concise title (max 50 chars).
3. Suggest a brief description (max 150 chars) summarizing the issue. Focus on what is visually evident and mentioned.
4. Suggest a priority level (${issuePriorities.join(', ')}). Consider factors like safety hazards (High), significant disruption (Medium), or minor inconveniences (Low). Use the description for additional context if available.

Image: {{media url=imageDataUri}}
{{#if description}}Description Context: {{{description}}}{{/if}}`,
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
    // Validate suggested priority is within the enum
     if (!issuePriorities.includes(output.suggestedPriority)) {
        console.warn(`AI suggested priority "${output.suggestedPriority}" is invalid. Defaulting to Medium.`);
        output.suggestedPriority = "Medium";
     }
    return output;
  }
);

