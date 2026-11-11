import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const connection = connectionForDriver(databaseUrl);
  const adapter = new PrismaPg(
    { connectionString: connection.connectionString },
    connection.schema === undefined ? undefined : { schema: connection.schema },
  );

  return new PrismaClient({ adapter });
}

function connectionForDriver(databaseUrl: string): {
  connectionString: string;
  schema?: string;
} {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get("schema") ?? undefined;
  url.searchParams.delete("schema");

  return {
    connectionString: url.toString(),
    schema,
  };
}
