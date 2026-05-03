/**
 * Model bundled inside the app's iOS Resources.
 *
 * The .gguf file is dragged into Xcode and added to the LocalLlamaApp target.
 * At runtime, RN resolves it via the main bundle path.
 */
export const MODEL_FILENAME = 'Llama-3.2-1B-Instruct-Q4_K_M.gguf';

/** Approximate on-disk size in bytes. Used by the RAM budget pre-check. */
export const MODEL_SIZE_BYTES = 770 * 1024 * 1024; // ~770 MB

/** Context window. Smaller = less KV-cache RAM. 2048 is plenty for chat. */
export const N_CTX = 2048;

/** Generation cap so we don't run forever. */
export const MAX_TOKENS = 512;

/**
 * Llama 3.2 Instruct uses the standard Llama 3 chat template.
 * llama.rn applies the model's built-in chat template when you pass `messages`,
 * but we expose the raw template here in case you want to switch to `prompt`.
 */
export const SYSTEM_PROMPT =
  'You are a concise, helpful assistant. Answer clearly in one or two short paragraphs.';
