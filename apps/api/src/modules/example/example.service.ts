import { AppError } from "../../common/errors/app-error.js";
import type { ExampleRepository } from "./example.repository.js";
import type {
  CreateExampleInput,
  ExampleRecord,
  ExampleValidationResult,
} from "./example.types.js";

type ValidationPreview = CreateExampleInput & {
  currency?: string;
  itemCode?: string;
};

export class ExampleService {
  constructor(private readonly examples: ExampleRepository) {}

  async create(input: CreateExampleInput): Promise<ExampleRecord> {
    return this.examples.create(input);
  }

  async list(): Promise<ExampleRecord[]> {
    return this.examples.findAll();
  }

  async getById(id: string): Promise<ExampleRecord> {
    const record = await this.examples.findById(id);
    if (!record) {
      throw new AppError({
        statusCode: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "Example not found",
      });
    }

    return record;
  }

  preview(input: ValidationPreview): ExampleValidationResult {
    return {
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      ...(input.currency ? { currency: input.currency } : {}),
      ...(input.itemCode ? { itemCode: input.itemCode } : {}),
    };
  }
}
