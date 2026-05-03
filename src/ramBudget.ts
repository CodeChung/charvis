import DeviceInfo from 'react-native-device-info';

/** Hard cap: model + runtime overhead must fit under 60% of total physical RAM. */
export const RAM_BUDGET_FRACTION = 0.6;

/**
 * Multiplier applied to the model's on-disk size to estimate its loaded footprint.
 * GGUF Q4_K_M weights are roughly memory-mapped, but we add a 15% margin for the
 * KV cache (sized by n_ctx) and llama.cpp's working buffers.
 */
const FOOTPRINT_MULTIPLIER = 1.15;

export type BudgetCheck =
  | { ok: true; totalRamBytes: number; budgetBytes: number; estimatedBytes: number }
  | {
      ok: false;
      reason: string;
      totalRamBytes: number;
      budgetBytes: number;
      estimatedBytes: number;
    };

/**
 * Decide whether a model of `modelSizeBytes` is allowed to load on this device.
 *
 * The check is intentionally conservative: a model that *just barely* fits the
 * budget will likely OOM under generation pressure, so the 1.15x margin treats
 * the budget as a hard ceiling, not a target.
 */
export async function checkRamBudget(modelSizeBytes: number): Promise<BudgetCheck> {
  const totalRamBytes = await DeviceInfo.getTotalMemory(); // bytes
  const budgetBytes = Math.floor(totalRamBytes * RAM_BUDGET_FRACTION);
  const estimatedBytes = Math.ceil(modelSizeBytes * FOOTPRINT_MULTIPLIER);

  if (estimatedBytes > budgetBytes) {
    return {
      ok: false,
      reason:
        `Model needs ~${formatMB(estimatedBytes)} but the 60% RAM budget on this ` +
        `device is only ${formatMB(budgetBytes)} ` +
        `(total RAM: ${formatMB(totalRamBytes)}).`,
      totalRamBytes,
      budgetBytes,
      estimatedBytes,
    };
  }

  return { ok: true, totalRamBytes, budgetBytes, estimatedBytes };
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}
