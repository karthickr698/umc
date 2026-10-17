import { Types, type PipelineStage } from 'mongoose';

type FacetStage = PipelineStage.FacetPipelineStage;

// Aggregation bypasses Mongoose casting, so ids must be ObjectIds there.
export const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);

/** `$match` condition for an inclusive range of stored calendar days; `undefined` when open. */
export function dateRangeCondition(from?: Date, to?: Date): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  return { ...(from && { $gte: from }), ...(to && { $lte: to }) };
}

/**
 * Copies `fields` of the document `localField` points at in collection `from` onto each row,
 * under the names in `rename` when given.
 */
export function nameLookup(
  from: string,
  localField: string,
  fields: Record<string, 1>,
  rename: Readonly<Record<string, string>> = {},
): FacetStage[] {
  return [
    {
      $lookup: {
        from,
        localField,
        foreignField: '_id',
        pipeline: [{ $project: { _id: 0, ...fields } }],
        as: 'ref',
      },
    },
    {
      $set: Object.fromEntries(
        Object.keys(fields).map((field) => [rename[field] ?? field, { $first: `$ref.${field}` }]),
      ),
    },
    { $unset: 'ref' },
  ];
}
