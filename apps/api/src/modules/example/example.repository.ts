import { randomUUID } from "node:crypto";
import type { CreateExampleInput, ExampleRecord } from "./example.types.js";

export interface ExampleRepository {
  create(input: CreateExampleInput): Promise<ExampleRecord>;
  findAll(): Promise<ExampleRecord[]>;
  findById(id: string): Promise<ExampleRecord | undefined>;
}

export class InMemoryExampleRepository implements ExampleRepository {
  private readonly records: ExampleRecord[] = [];

  async create(input: CreateExampleInput): Promise<ExampleRecord> {
    const record: ExampleRecord = {
      id: randomUUID(),
      name: input.name,
      price: input.price,
      quantity: input.quantity,
    };
    this.records.push(record);
    return copyRecord(record);
  }

  async findAll(): Promise<ExampleRecord[]> {
    return this.records.map((record) => copyRecord(record));
  }

  async findById(id: string): Promise<ExampleRecord | undefined> {
    const record = this.records.find((item) => item.id === id);
    return record ? copyRecord(record) : undefined;
  }
}

function copyRecord(record: ExampleRecord): ExampleRecord {
  return { ...record };
}
