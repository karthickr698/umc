import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as employeeService from '../services/employee.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from '../validators/employee.validator.js';

export async function listEmployees(req: Request, res: Response): Promise<void> {
  const query = listEmployeesQuerySchema.parse(req.query);
  sendSuccess(res, await employeeService.list(getAuthUser(req), query));
}

export async function getEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await employeeService.getById(getAuthUser(req), id));
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const input = createEmployeeSchema.parse(req.body);
  sendSuccess(res, await employeeService.create(getAuthUser(req), input), 201);
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateEmployeeSchema.parse(req.body);
  sendSuccess(res, await employeeService.update(getAuthUser(req), id, input));
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await employeeService.remove(getAuthUser(req), id);
  res.status(204).end();
}
