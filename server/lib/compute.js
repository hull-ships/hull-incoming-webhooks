/* @flow */
import type { Result, ComputeOptions } from "../../types";

import run from "./sandbox";

export default async function compute({
  payload,
  ship,
  client,
  preview,
  code
}: ComputeOptions): Promise<Result> {
  const response = await run({
    context: payload,
    ship,
    client,
    code,
    preview
  });

  return {
    ...response,
    success: true
  };
}
