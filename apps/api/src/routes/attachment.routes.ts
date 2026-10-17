import type { RequestHandler, Router } from 'express';
import type { AttachmentController } from '../controllers/attachment.controller.js';
import { uploadAttachments } from '../middlewares/upload-attachments.js';

export interface AttachmentRouteOptions {
  routes: { attachments: string; attachmentById: string };
  canView: RequestHandler;
  canManage: RequestHandler;
  /** `requireCompanyOwnership` guard for the owning record's `:id`. */
  owns: RequestHandler;
  controller: AttachmentController;
}

/**
 * Registers list / upload / delete attachment routes on a feature router. Files are parsed only
 * after the role and ownership guards have passed.
 */
export function registerAttachmentRoutes(
  router: Router,
  { routes, canView, canManage, owns, controller }: AttachmentRouteOptions,
): void {
  router.get(routes.attachments, canView, owns, controller.listAttachments);
  router.post(routes.attachments, canManage, owns, uploadAttachments, controller.uploadAttachments);
  router.delete(routes.attachmentById, canManage, owns, controller.deleteAttachment);
}
