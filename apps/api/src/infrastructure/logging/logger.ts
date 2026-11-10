export const logger = {
  error(error: unknown): void {
    if (error instanceof Error) {
      console.error(error.stack ?? error.message);
      return;
    }

    console.error("Unhandled API error.");
  },
};
