/**
 * Utility to check if a withdrawal has notes stored in localStorage.
 * Used by withdrawal list views to show a note indicator icon.
 */
export function hasWithdrawalNotes(withdrawalId: string): boolean {
  try {
    const stored = localStorage.getItem(`withdrawal-notes-${withdrawalId}`);
    if (!stored) return false;
    const notes = JSON.parse(stored);
    return Array.isArray(notes) && notes.length > 0;
  } catch {
    return false;
  }
}

export function getWithdrawalNotesCount(withdrawalId: string): number {
  try {
    const stored = localStorage.getItem(`withdrawal-notes-${withdrawalId}`);
    if (!stored) return 0;
    const notes = JSON.parse(stored);
    return Array.isArray(notes) ? notes.length : 0;
  } catch {
    return 0;
  }
}
