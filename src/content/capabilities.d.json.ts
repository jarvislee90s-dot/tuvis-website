declare const data: {
  updated: string;
  legend: Record<string, string>;
  tools: string[];
  groups: {
    key: string; name: string; nameEn?: string;
    rows: { name: string; nameEn?: string; key: string; support: Record<string, string>; note?: string }[];
  }[];
};
export default data;
