export const SYSTEM_PROMPT = Deno.readTextFileSync(
  new URL(".docs/prompt-builder-system-prompts.md", import.meta.url),
);
