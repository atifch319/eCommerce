import { throwMappedDatabaseError } from "../../infrastructure/database/database-errors.js";
import { Prisma, type PrismaClient } from "../../generated/prisma/client.js";
import type { CreateExampleInput, ExampleRecord } from "./example.types.js";
import type { ExampleRepository } from "./example.repository.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ExampleRow = {
  id: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
};

const exampleColumns = {
  id: true,
  name: true,
  price: true,
  quantity: true,
} as const;

export class PrismaExampleRepository implements ExampleRepository {
  constructor(private readonly database: PrismaClient) {}

  async create(input: CreateExampleInput): Promise<ExampleRecord> {
    try {
      const row = await this.database.example.create({
        data: {
          name: input.name,
          price: toStoredPrice(input.price),
          quantity: input.quantity,
        },
        select: exampleColumns,
      });
      return toExampleRecord(row);
    } catch (error) {
      throwMappedDatabaseError(error);
    }
  }

  async findAll(): Promise<ExampleRecord[]> {
    try {
      const rows = await this.database.example.findMany({
        select: exampleColumns,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      return rows.map((row) => toExampleRecord(row));
    } catch (error) {
      throwMappedDatabaseError(error);
    }
  }

  async findById(id: string): Promise<ExampleRecord | undefined> {
    if (!UUID_PATTERN.test(id)) {
      return undefined;
    }

    try {
      const row = await this.database.example.findUnique({
        where: { id },
        select: exampleColumns,
      });
      return row ? toExampleRecord(row) : undefined;
    } catch (error) {
      throwMappedDatabaseError(error);
    }
  }
}

function toStoredPrice(price: number): Prisma.Decimal {
  if (!Number.isFinite(price)) {
    throw new Error("Price must be a finite number.");
  }

  return new Prisma.Decimal(price.toFixed(2));
}

function fromStoredPrice(price: Prisma.Decimal): number {
  const value = price.toNumber();
  if (!Number.isFinite(value)) {
    throw new Error("Stored price could not be read as a number.");
  }

  return value;
}

function toExampleRecord(row: ExampleRow): ExampleRecord {
  return {
    id: row.id,
    name: row.name,
    price: fromStoredPrice(row.price),
    quantity: row.quantity,
  };
}
