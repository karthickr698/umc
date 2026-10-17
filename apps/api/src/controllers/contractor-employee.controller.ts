import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as contractorEmployeeService from '../services/contractor-employee.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createContractorEmployeeSchema,
  listContractorEmployeesQuerySchema,
  updateContractorEmployeeSchema,
} from '../validators/contractor-employee.validator.js';

export async function listContractorEmployees(req: Request, res: Response): Promise<void> {
  const query = listContractorEmployeesQuerySchema.parse(req.query);
  sendSuccess(res, await contractorEmployeeService.list(getAuthUser(req), query));
}

export async function getContractorEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await contractorEmployeeService.getById(getAuthUser(req), id));
}

export async function createContractorEmployee(req: Request, res: Response): Promise<void> {
  const input = createContractorEmployeeSchema.parse(req.body);
  sendSuccess(res, await contractorEmployeeService.create(getAuthUser(req), input), 201);
}

export async function updateContractorEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateContractorEmployeeSchema.parse(req.body);
  sendSuccess(res, await contractorEmployeeService.update(getAuthUser(req), id, input));
}

export async function deleteContractorEmployee(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await contractorEmployeeService.remove(getAuthUser(req), id);
  res.status(204).end();
}
