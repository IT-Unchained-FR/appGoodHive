/**
 * Asks the server to re-read a job's escrow balance from the chain and store
 * it. Best-effort: the stored copy is only a mirror, so failures are ignored.
 */
export function requestEscrowSync(jobId: string | number | null | undefined): void {
  if (!jobId) return;
  void fetch(`/api/jobs/${jobId}/sync-escrow`, { method: "POST" }).catch(() => {});
}
