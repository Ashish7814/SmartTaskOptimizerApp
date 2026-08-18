import { CanDeactivateFn } from '@angular/router';

/** Implemented by any component that wants navigation-away confirmation. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
  confirmDiscard(): Promise<boolean>;
}

/**
 * Generic CanDeactivate guard: if the component reports unsaved changes,
 * ask the user to confirm before leaving the route. Reused by any form
 * page (currently the task create/edit dialog).
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component => {
  if (!component.hasUnsavedChanges()) return true;
  return component.confirmDiscard();
};
