/** One plotted measure: the data key it reads, its legend label, and its CSS colour. */
export interface ChartSeries<TKey extends string = string> {
  key: TKey;
  label: string;
  color: string;
}
