import { Types, type Model } from 'mongoose';

interface CompanyScoped {
  companyId: Types.ObjectId;
}

/** Owning company of any tenant-scoped record; `null` when the id is invalid or not found. */
export async function findCompanyIdOf<T extends CompanyScoped>(
  model: Model<T>,
  id: string,
): Promise<string | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const record = await model.findById(id).select('companyId').lean<CompanyScoped>().exec();
  return record ? record.companyId.toString() : null;
}
