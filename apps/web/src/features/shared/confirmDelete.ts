export const DELETE_CONFIRM_PHRASE = "CONFIRM";

export const DEFAULT_DELETE_WARNING =
  "This action is permanent. Once deleted, this data cannot be recovered.";

export function isDeleteConfirmed(input: string): boolean {
  return input.trim().toUpperCase() === DELETE_CONFIRM_PHRASE;
}
