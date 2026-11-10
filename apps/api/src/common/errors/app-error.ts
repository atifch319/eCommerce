export type FieldErrorDetail = {
  path: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FieldErrorDetail[];
  };
};

type AppErrorOptions = {
  statusCode: number;
  code: string;
  message: string;
  details?: FieldErrorDetail[];
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: FieldErrorDetail[];

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}
