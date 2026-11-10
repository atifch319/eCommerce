import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  exampleItemParamsSchema,
  exampleValidationBodySchema,
  exampleValidationQuerySchema,
  type ExampleItemParams,
  type ExampleValidationBody,
  type ExampleValidationQuery,
} from "../schemas/example-validation.schema.js";

export const exampleValidationRouter = Router();

exampleValidationRouter.post(
  "/validation",
  validate({
    body: exampleValidationBodySchema,
    query: exampleValidationQuerySchema,
  }),
  (_request, response) => {
    response
      .status(200)
      .json(acceptedResponse(response.locals.validatedInput, false));
  },
);

exampleValidationRouter.post(
  "/validation/:itemCode",
  validate({
    body: exampleValidationBodySchema,
    query: exampleValidationQuerySchema,
    params: exampleItemParamsSchema,
  }),
  (_request, response) => {
    response
      .status(200)
      .json(acceptedResponse(response.locals.validatedInput, true));
  },
);

function acceptedResponse(
  input: { body?: unknown; query?: unknown; params?: unknown } | undefined,
  includeItemCode: boolean,
) {
  const body = input?.body as ExampleValidationBody;
  const query = input?.query as ExampleValidationQuery;
  const params = input?.params as ExampleItemParams | undefined;

  return {
    success: true as const,
    message: "Validation example accepted",
    data: {
      name: body.name,
      price: body.price,
      quantity: body.quantity,
      ...(query.currency ? { currency: query.currency } : {}),
      ...(includeItemCode && params ? { itemCode: params.itemCode } : {}),
    },
  };
}
