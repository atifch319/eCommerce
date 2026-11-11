import type { CreateExampleInput, ExampleRecord } from "./example.types.js";

export interface ExampleRepository {
  create(input: CreateExampleInput): Promise<ExampleRecord>;
  findAll(): Promise<ExampleRecord[]>;
  findById(id: string): Promise<ExampleRecord | undefined>;
}
