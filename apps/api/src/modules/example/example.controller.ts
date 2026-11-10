import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { sendSuccess } from "../../common/responses/api-response.js";
import type { ExampleService } from "./example.service.js";
import type {
  ExampleBody,
  ExampleIdParams,
  ExampleItemParams,
  ExampleValidationQuery,
} from "./example.schema.js";

export class ExampleController {
  constructor(private readonly examples: ExampleService) {}

  create = async (_request: Request, response: Response): Promise<void> => {
    const record = await this.examples.create(this.readBody(response));
    sendSuccess(response, 201, "Example created successfully", record);
  };

  list = async (_request: Request, response: Response): Promise<void> => {
    const records = await this.examples.list();
    sendSuccess(response, 200, "Examples retrieved successfully", records);
  };

  getById = async (_request: Request, response: Response): Promise<void> => {
    const { id } = this.readId(response);
    const record = await this.examples.getById(id);
    sendSuccess(response, 200, "Example retrieved successfully", record);
  };

  acceptValidation = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    const body = this.readBody(response);
    const query = this.readQuery(response);
    const data = this.examples.preview({
      ...body,
      currency: query.currency,
    });
    sendSuccess(response, 200, "Validation example accepted", data);
  };

  acceptItemValidation = async (
    _request: Request,
    response: Response,
  ): Promise<void> => {
    const body = this.readBody(response);
    const query = this.readQuery(response);
    const params = this.readItemParams(response);
    const data = this.examples.preview({
      ...body,
      currency: query.currency,
      itemCode: params.itemCode,
    });
    sendSuccess(response, 200, "Validation example accepted", data);
  };

  private readBody(response: Response): ExampleBody {
    return readValidated<ExampleBody>(response, "body");
  }

  private readQuery(response: Response): ExampleValidationQuery {
    return readValidated<ExampleValidationQuery>(response, "query");
  }

  private readItemParams(response: Response): ExampleItemParams {
    return readValidated<ExampleItemParams>(response, "params");
  }

  private readId(response: Response): ExampleIdParams {
    return readValidated<ExampleIdParams>(response, "params");
  }
}

function readValidated<T>(
  response: Response,
  part: "body" | "query" | "params",
): T {
  const value = response.locals.validatedInput?.[part];
  if (value === undefined) {
    throw new AppError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }

  return value as T;
}
