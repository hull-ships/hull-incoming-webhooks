// @flow
import type { $Request, $Response } from "express";
import check from "syntax-error";
import _ from "lodash";

export default function statusCheck(req: $Request, res: $Response) {
  const { ship, client } = req.hull;
  const messages = [];
  let status = "ok";
  if (!_.get(ship.private_settings, "code")) {
    status = "error";
    messages.push(
      "No code is stored. Start by sending a webhook and writing some code"
    );
  }

  const err = check(ship.private_settings.code);
  if (err) {
    status = "error";
    messages.push("Your code seems to have errors.");
  }

  res.json({ messages, status });
  return client.put(`${ship.id}/status`, { status, messages });
}
