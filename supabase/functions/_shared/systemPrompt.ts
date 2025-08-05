export const SYSTEM_PROMPT = Deno.readTextFileSync(
  new URL("../../../.docs/prompt_builder_system_prompts.md", import.meta.url),
);
