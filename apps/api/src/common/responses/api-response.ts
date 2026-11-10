import type { Response } from "express";

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export function sendSuccess<T>(
  response: Response,
  statusCode: number,
  message: string,
  data: T,
): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  response.status(statusCode).json(body);
}
