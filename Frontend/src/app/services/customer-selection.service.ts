import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerSelectionService {
  // holds the last scanned/selected id (or null)
  private _selectedId$ = new BehaviorSubject<string | null>(null);

  /** Observable you can subscribe to in CustomerAnalyticsComponent */
  readonly selectedId$: Observable<string | null> = this._selectedId$.asObservable();

  /** Push a new id from the QR tab (or anywhere) */
  set(id: string) {
    this._selectedId$.next(id);
  }

  /** Read the current value synchronously if you need it */
  peek(): string | null {
    return this._selectedId$.value;
  }
}
