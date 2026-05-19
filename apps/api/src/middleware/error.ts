import type { Context } from "hono";
import type { ZodError } from "zod";

import { ApiError } from "../utils/errors";

const isZodError = (error: unknown): error is ZodError =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name?: string }).name === "ZodError";

export const onError = (error: Error, c: Context): Response => {
  if (error instanceof ApiError) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }),
      {
        status: error.statusCode,
        headers: {
          "content-type": "application/json"
        }
      }
    );
  }

  if (isZodError(error)) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.issues
        }
      },
      400
    );
  }

  console.error(
    JSON.stringify({
      level: "error",
      message: error.message,
      requestId: c.get("requestId")
    })
  );

  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred."
      }
    },
    500
  );
};

export const notFoundHandler = (c: Context): Response =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found."
      }
    },
    404
  );
