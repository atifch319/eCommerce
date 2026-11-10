declare global {
  // Express publishes its request locals as a namespace that applications augment.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      validatedInput?: Partial<Record<"body" | "query" | "params", unknown>>;
    }
  }
}

export {};
