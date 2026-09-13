import type { Request, Response } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { UnauthorizedError } from "../../common/errors";
import { param } from "../../common/params";
import { toOrderDTO } from "./order.mapper";
import * as ordersService from "./orders.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const order = await ordersService.createOrder(req.user._id.toString(), req.body);
  const populated = await order.populate("eventId");
  sendSuccess(res, toOrderDTO(populated as never), 201);
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const order = await ordersService.getOrderForOwner(param(req, "id"), req.user);
  sendSuccess(res, toOrderDTO(order as never));
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const orders = await ordersService.listMyOrders(req.user._id.toString());
  sendSuccess(res, orders.map((o) => toOrderDTO(o as never)));
});
