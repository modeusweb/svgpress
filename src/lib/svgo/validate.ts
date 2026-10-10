import { z } from 'zod';

/**
 * Schema for validating a user-provided advanced SVGO config JSON. We accept a
 * permissive shape (plugin names + params) but explicitly forbid anything that
 * could execute code. Function plugins cannot appear in JSON anyway; the `fn`
 * guard in the optimizer is defense-in-depth.
 */
const pluginParamValue: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

const pluginSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    active: z.boolean().optional(),
    params: z.record(z.string(), pluginParamValue).optional(),
  }),
]);

export const customConfigSchema = z
  .object({
    plugins: z.array(pluginSchema).optional(),
    floatPrecision: z.number().int().min(0).max(8).optional(),
    multipass: z.boolean().optional(),
  })
  .strict();

export type CustomConfigValid = z.infer<typeof customConfigSchema>;

export interface ValidationOutcome {
  ok: boolean;
  error?: string;
}

/** Validate a raw custom-config JSON string. */
export function validateCustomConfig(raw: string): ValidationOutcome {
  if (!raw.trim()) return { ok: true };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  const result = customConfigSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join('.') || 'config';
    return { ok: false, error: `${path ? `${path}: ` : ''}${first?.message ?? 'invalid value'}` };
  }
  return { ok: true };
}
