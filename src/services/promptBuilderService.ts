import { supabase } from "@/integrations/supabase/client";

export interface PromptBuilderPayload {
  goal: string;
  input_type: string[];
  input_description: string;
  output_format: string[];
  output_description: string;
  constraints: string[];
  custom_constraints: string;
  tone: string;
  custom_tone: string;
  clarifications?: string[];
}

export interface FollowUpResponse {
  followup_questions?: string[];
  prompt?: string;
}

export interface GenerateResponse {
  prompt: string;
}

export class PromptBuilderService {
  static buildPayload({
    goalInput,
    inputTypes,
    outputFormats,
    constraints,
    tone,
    customInputType,
    customOutputFormat,
    customConstraints,
    customTone,
    clarifications = []
  }: {
    goalInput: string;
    inputTypes: string[];
    outputFormats: string[];
    constraints: string[];
    tone: string;
    customInputType: string;
    customOutputFormat: string;
    customConstraints: string;
    customTone: string;
    clarifications?: string[];
  }): PromptBuilderPayload {
    return {
      goal: goalInput,
      input_type: inputTypes,
      input_description: customInputType || inputTypes.join(", "),
      output_format: outputFormats,
      output_description: customOutputFormat || outputFormats.join(", "),
      constraints: constraints,
      custom_constraints: customConstraints,
      tone: tone,
      custom_tone: customTone,
      clarifications
    };
  }

  static async getFollowUps(payload: PromptBuilderPayload): Promise<FollowUpResponse> {
    const { data, error } = await supabase.functions.invoke('prompt_builder_followups', {
      body: payload
    });

    if (error) {
      throw new Error(`Failed to get follow-ups: ${error.message}`);
    }

    try {
      const response = typeof data === 'string' ? JSON.parse(data) : data;
      return response;
    } catch (parseError) {
      throw new Error('Invalid response format from follow-ups API');
    }
  }

  static async generatePrompt(payload: PromptBuilderPayload): Promise<GenerateResponse> {
    const { data, error } = await supabase.functions.invoke('prompt_builder_generate', {
      body: payload
    });

    if (error) {
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }

    try {
      const response = typeof data === 'string' ? JSON.parse(data) : data;
      if (!response.prompt) {
        throw new Error('Generated response missing prompt field');
      }
      return response;
    } catch (parseError) {
      throw new Error('Invalid response format from generate API');
    }
  }
}