import { Platform } from 'react-native';
import { initLlama, releaseAllLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import { MODEL_FILENAME, MODEL_SIZE_BYTES, N_CTX, MAX_TOKENS, SYSTEM_PROMPT } from './modelConfig';
import { checkRamBudget } from './ramBudget';

let context: LlamaContext | null = null;

/**
 * Resolve the absolute path of the bundled .gguf inside the iOS app bundle.
 *
 * The model must have been added to the Xcode target's Copy Bundle Resources
 * phase (see README). RNFS.MainBundlePath gives us the runtime location.
 */
function resolveBundledModelPath(): string {
  if (Platform.OS !== 'ios') {
    throw new Error('This app is iOS-only. Run it on an iOS device or simulator.');
  }
  return `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
}

/**
 * Load the model. Idempotent — calling twice is a no-op.
 *
 * Throws if the 60% RAM budget would be exceeded; the UI surfaces that message.
 */
export async function loadModel(): Promise<void> {
  if (context) return;

  const budget = await checkRamBudget(MODEL_SIZE_BYTES);
  if (!budget.ok) {
    throw new Error(budget.reason);
  }

  const modelPath = resolveBundledModelPath();
  context = await initLlama({
    model: modelPath,
    n_ctx: N_CTX,
    n_gpu_layers: 99, // offload everything we can to Metal
    use_mlock: false, // mmap is fine; mlock would fight the budget
  });
}

export async function unloadModel(): Promise<void> {
  context = null;
  await releaseAllLlama();
}

/**
 * Generate a single response. Non-streaming: resolves with the full text.
 *
 * Uses llama.rn's `messages` API so the model's built-in Llama 3 chat template
 * is applied automatically — no manual <|begin_of_text|> wrangling.
 */
export async function generate(userInput: string): Promise<string> {
  if (!context) {
    throw new Error('Model not loaded. Call loadModel() first.');
  }
  const result = await context.completion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userInput },
    ],
    n_predict: MAX_TOKENS,
    temperature: 0.7,
    top_p: 0.9,
    stop: ['<|eot_id|>', '<|end_of_text|>'],
  });
  return (result.text ?? '').trim();
}
