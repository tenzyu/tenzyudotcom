import { NextResponse } from "next/server";

export function errorJson(error: unknown, status = 400): NextResponse {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status },
  );
}

export async function readJsonBody<T extends Record<string, unknown>>(request: Request): Promise<T> {
  const body = (await request.json().catch(() => null)) as unknown;

  if (typeof body !== "object" || body === null) {
    throw new Error("request body must be a JSON object");
  }

  return body as T;
}

export function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required`);
  }

  return value;
}
