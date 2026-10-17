import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as userController from '../controllers/user.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as userService from '../services/user.service.js';

/** Mounted behind `authenticate`. */
export const userRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewUsers);
const canManage = requireRoles(ROLE_ACCESS.manageUsers);
const ownsUser = requireCompanyOwnership({
  param: 'id',
  resource: 'User',
  findCompanyId: userService.findCompanyId,
});

userRouter.get(API_ROUTES.users.list, canView, userController.listUsers);
userRouter.post(API_ROUTES.users.list, canManage, userController.createUser);
userRouter.get(API_ROUTES.users.byId, canView, ownsUser, userController.getUser);
userRouter.patch(API_ROUTES.users.byId, canManage, ownsUser, userController.updateUser);
