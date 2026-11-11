import { Router } from "express";
import { ExampleController } from "./example.controller.js";
import type { ExampleRepository } from "./example.repository.js";
import { createExampleRouter } from "./example.routes.js";
import { ExampleService } from "./example.service.js";

export function createExampleModule(examples: ExampleRepository): Router {
  const service = new ExampleService(examples);
  const controller = new ExampleController(service);
  return createExampleRouter(controller);
}
