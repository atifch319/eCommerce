import { Router } from "express";
import { ExampleController } from "./example.controller.js";
import { InMemoryExampleRepository } from "./example.repository.js";
import { createExampleRouter } from "./example.routes.js";
import { ExampleService } from "./example.service.js";

export function createExampleModule(): Router {
  const repository = new InMemoryExampleRepository();
  const service = new ExampleService(repository);
  const controller = new ExampleController(service);
  return createExampleRouter(controller);
}
