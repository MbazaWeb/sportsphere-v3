// ─── Backup Engine Stub ────────────────────────────────────
// Placeholder — full implementation pending.
// The backup routes exist in the API but the engine is not yet built.

export async function createBackup(_adminId: string, _tables?: string[]) {
  return { id: 'stub', status: 'stub', size: 0, tableCount: 0, createdAt: new Date().toISOString() };
}
export async function listBackups(_limit = 20, _offset = 0) {
  return { backups: [], total: 0 };
}
export async function getDataStatus() {
  return { tables: [], totalSize: 0 };
}
export async function getDeletionRecords(_limit = 50) {
  return { records: [], total: 0 };
}
export async function restoreBackup(_id: string, _tables?: string[], _mode?: string) {
  return { success: false, error: 'Backup engine not yet implemented.' };
}
export async function deleteBackup(_id: string) {
  return { success: false, error: 'Backup engine not yet implemented.' };
}
export async function getBackup(_id: string) {
  return null;
}
export async function restoreDeletedRecord(_id: string) {
  return { success: false, error: 'Backup engine not yet implemented.' };
}
