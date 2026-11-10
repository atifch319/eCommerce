import { Router } from "express";
import { validate } from "../../common/middleware/validate.middleware.js";
import type { ExampleController } from "./example.controller.js";
import {
  exampleBodySchema,
  exampleIdParamsSchema,
  exampleItemParamsSchema,
  exampleValidationQuerySchema,
} from "./example.schema.js";

export function createExampleRouter(controller: ExampleController): Router {
  const router = Router();

  router.post(
    "/validation",
    validate({
      body: exampleBodySchema,
      query: exampleValidationQuerySchema,
    }),
    (request, response, next) => {
      controller.acceptValidation(request, response).catch(next);
    },
  );

  router.post(
    "/validation/:itemCode",
    validate({
      body: exampleBodySchema,
      query: exampleValidationQuerySchema,
      params: exampleItemParamsSchema,
    }),
    (request, response, next) => {
      controller.acceptItemValidation(request, response).catch(next);
    },
  );

  router.post(
    "/",
    validate({ body: exampleBodySchema }),
    (request, response, next) => {
      controller.create(request, response).catch(next);
    },
  );

  router.get("/", (request, response, next) => {
    controller.list(request, response).catch(next);
  });

  router.get(
    "/:id",
    validate({ params: exampleIdParamsSchema }),
    (request, response, next) => {
      controller.getById(request, response).catch(next);
    },
  );

  return router;
}
