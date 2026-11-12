export type DeveloperReport = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  created_at: string;
};

export function mapDeveloperReports(rows: unknown): DeveloperReport[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id),
      title: String(value.title),
      status: String(value.status),
      updated_at: String(value.updated_at),
      created_at: String(value.created_at),
    };
  });
}
