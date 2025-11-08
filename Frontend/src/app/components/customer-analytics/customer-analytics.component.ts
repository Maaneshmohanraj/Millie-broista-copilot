import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CustomerSelectionService } from '../../services/customer-selection.service';

export interface OrderRow {
  ID: string;
  ORDER_ID: string;
  STAND_NAME: string;
  STAND_NUMBER: string;
  BUSINESS_DATE: string;
  ORDER_NUMBER: string;
  RECORD_TYPE: string;
  RECORD_SUBTYPE: string;
  ITEMS__ITEM_TYPE: string;
  ITEMS__FEE_CONFIG__FEE_TYPE: string;
  PATH: string;
  ITEM_NAME: string;
  ITEM_UNIT_AMOUNT: string;
  ITEM_AMOUNT_TOTAL: string;
  ITEM_QUANTITY: string;
  TAXES_TOTAL_EXCLUSIVE: string;
  TAXES_TOTAL_INCLUSIVE: string;
  PAYMENT_TYPE: string;
  TRANSACTION_TYPE: string;
  CREDIT_CARD_TYPE: string;
  TRANSACTION_ID: string;
  MAJOR_CATEGORY: string;
  MINOR_CATEGORY: string;
  DISCOUNT_CODE: string;
  PRODUCT_ID: string;
  DBBATCH_ID: string;
  DBCREATED: string;
  DBMODIFIED: string;
  DBACTIVE: string;
  CUSTOMER_ID?: string;
  CUSTOMER_NAME?: string;
}

export interface CustomerSummary {
  customerId: string;
  customerName?: string;
  totalVisits: number;
  totalSpend: number;
  lastVisit: Date | null;
  avgSpendPerVisit: number;
  totalItemsOrdered: number;
  loyaltyStatus: 'NEW' | 'REGULAR' | 'VIP';
  clv: number;
  engagementScore: number;
  favoriteItems: { name: string; count: number; spend: number; share: number }[];
  orderHistory: { date: Date; orderId: string; itemName: string; qty: number; amount: number }[];
}

@Component({
  selector: 'app-customer-analytics',
  standalone: true,
  templateUrl: './customer-analytics.component.html',
  styleUrls: ['./customer-analytics.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, DatePipe, DecimalPipe]
})
export class CustomerAnalyticsComponent implements OnInit, OnDestroy {
  public Math = Math;

  // CONFIG
  csvAssetPath = 'demo_customer_orders_under50.csv';
  regularVisitThreshold = 3;
  retentionFactor = 1.2;

  // UI state
  loading = false;
  errorMsg = '';
  customers: Map<string, OrderRow[]> = new Map();
  customerIds: string[] = [];
  selectedCustomerId = new FormControl<string>('');
  summary: CustomerSummary | null = null;

  private sub?: Subscription;
  /** holds a scanned ID until data is ready */
  private pendingSearchId: string | null = null;

  constructor(
    private http: HttpClient,
    private sel: CustomerSelectionService
  ) {}

  ngOnInit(): void {
    this.loadFromAssets();

    // React to a scanned/selected customer id from the QR tab
    this.sub = this.sel.selectedId$
      .pipe(filter((v): v is string => !!v && v.trim().length > 0))
      .subscribe((id) => {
        const clean = id.trim().toUpperCase();
        if (!this.isReady()) {
          this.pendingSearchId = clean;         // queue until CSV is ready
        } else {
          this.searchCustomer(clean);            // run immediately
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /** public method so parent could call it too */
  public searchCustomer(id: string) {
    const value = (id || '').trim().toUpperCase();
    if (!value) return;
    this.selectedCustomerId.setValue(value);
    this.onSearch();
  }

  // ---------- data loading ----------
  private isReady(): boolean {
    return !this.loading && this.customers.size > 0;
  }

  private loadFromAssets() {
    this.loading = true;
    this.errorMsg = '';
    this.http.get(this.csvAssetPath, { responseType: 'text' }).subscribe({
      next: (csv) => {
        try {
          this.ingestCsv(csv);
        } catch (e: any) {
          this.errorMsg = 'Parse error: ' + (e?.message || e);
        } finally {
          this.loading = false;

          // if a scan happened while loading, run it now
          if (this.pendingSearchId) {
            const id = this.pendingSearchId;
            this.pendingSearchId = null;
            queueMicrotask(() => this.searchCustomer(id));
          }
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Could not load CSV from assets.';
      }
    });
  }

  private parseCsv(csvText: string): OrderRow[] {
    const rows: OrderRow[] = [];
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (!lines.length) return rows;
    const header = this.splitCsvLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cells = this.splitCsvLine(line);
      const obj: any = {};
      header.forEach((h, idx) => (obj[h.trim()] = cells[idx] ?? ''));
      rows.push(obj as OrderRow);
    }
    return rows;
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQ = false; }
        } else { cur += ch; }
      } else {
        if (ch === ',') { out.push(cur); cur = ''; }
        else if (ch === '"') { inQ = true; }
        else { cur += ch; }
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  }

  private ingestCsv(csvText: string) {
    const rows = this.parseCsv(csvText);
    const customers = new Map<string, OrderRow[]>();

    for (const r of rows) {
      const custIdRaw = (r as any)['CUSTOMER_ID']?.trim() || this.deriveCustomerId(r);
      const custId = custIdRaw.toUpperCase();  // normalize keys to uppercase
      if (!custId) continue;
      if (!customers.has(custId)) customers.set(custId, []);
      customers.get(custId)!.push(r);
    }

    this.customers = customers;
    this.customerIds = Array.from(customers.keys()).sort();

    const initial = this.customerIds[0] || '';
    this.selectedCustomerId.setValue(initial, { emitEvent: false });
    if (initial) this.computeSummary(initial);
  }

  private deriveCustomerId(r: OrderRow): string {
    const tx = (r.TRANSACTION_ID || '').trim();
    if (tx.includes('-')) return tx.split('-')[0].toUpperCase();
    if (tx) return ('CUST' + tx.slice(-4)).toUpperCase();
    return 'UNKNOWN';
  }

  onSearch() {
    const id = (this.selectedCustomerId.value || '').trim().toUpperCase();
    if (!id) return;

    if (!this.isReady()) {
      this.pendingSearchId = id;
      return;
    }

    if (!this.customers.has(id)) {
      this.errorMsg = `Customer ${id} not found in dataset.`;
      this.summary = null;
      return;
    }
    this.errorMsg = '';
    this.computeSummary(id);
  }

  clearSearch() {
    this.selectedCustomerId.setValue('');
    this.summary = null;
  }

  private computeSummary(customerId: string) {
    const rows = this.customers.get(customerId) || [];
    const byOrder = new Map<string, OrderRow[]>();
    const byItem = new Map<string, { count: number; spend: number }>();

    let totalSpend = 0;
    let totalItems = 0;
    let lastVisit: Date | null = null;

    for (const r of rows) {
      const orderId = r.ORDER_ID || r.ORDER_NUMBER;
      if (!byOrder.has(orderId)) byOrder.set(orderId, []);
      byOrder.get(orderId)!.push(r);

      const spend = Number(r.ITEM_AMOUNT_TOTAL || r.ITEM_UNIT_AMOUNT || 0) || 0;
      const qty = Number(r.ITEM_QUANTITY || 1) || 1;
      const date = this.parseDate(r.BUSINESS_DATE);

      totalSpend += spend;
      totalItems += qty;
      if (!lastVisit || (date && date > lastVisit)) lastVisit = date;

      const key = (r.ITEM_NAME || 'Unknown').trim();
      const cur = byItem.get(key) || { count: 0, spend: 0 };
      cur.count += qty;
      cur.spend += spend;
      byItem.set(key, cur);
    }

    const totalVisits = byOrder.size;
    const avgSpendPerVisit = totalVisits ? totalSpend / totalVisits : 0;

    const favArray = Array.from(byItem.entries())
      .map(([name, v]) => ({
        name,
        count: v.count,
        spend: v.spend,
        share: totalItems ? (v.count / totalItems) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const loyaltyStatus: 'NEW' | 'REGULAR' | 'VIP' =
      totalVisits >= this.regularVisitThreshold ? 'REGULAR' : 'NEW';
    const clv = totalSpend * this.retentionFactor;
    const engagementScore = this.computeEngagement(rows);

    const orderHistory = Array.from(byOrder.values())
      .map(orderRows => {
        const r0 = orderRows[0];
        return {
          date: this.parseDate(r0.BUSINESS_DATE)!,
          orderId: r0.ORDER_ID || r0.ORDER_NUMBER,
          itemName: r0.ITEM_NAME,
          qty: Number(r0.ITEM_QUANTITY || 1) || 1,
          amount: Number(r0.ITEM_AMOUNT_TOTAL || r0.ITEM_UNIT_AMOUNT || 0) || 0
        };
      })
      .sort((a, b) => (b.date.getTime() - a.date.getTime()));

    const name = (rows[0]?.CUSTOMER_NAME || '') || undefined;

    this.summary = {
      customerId,
      customerName: name,
      totalVisits,
      totalSpend,
      lastVisit,
      avgSpendPerVisit,
      totalItemsOrdered: totalItems,
      loyaltyStatus,
      clv,
      engagementScore,
      favoriteItems: favArray,
      orderHistory
    };
  }

  private computeEngagement(rows: OrderRow[]): number {
    if (!rows.length) return 0;
    const dates = rows.map(r => this.parseDate(r.BUSINESS_DATE)!).filter(Boolean) as Date[];
    dates.sort((a, b) => a.getTime() - b.getTime());
    const first = dates[0];
    const last = dates[dates.length - 1];
    const daysSpan = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    const visits = new Set(rows.map(r => r.ORDER_ID)).size;
    const freq = visits / daysSpan;
    const recencyDays = Math.max(0, (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    const recencyFactor = Math.max(0, 1 - Math.min(recencyDays / 30, 1));
    const score = Math.min(100, Math.round((freq * 120 + recencyFactor * 80)));
    return score;
  }

  private parseDate(s: string): Date | null {
    if (!s) return null;
    const iso = Date.parse(s);
    if (!Number.isNaN(iso)) return new Date(iso);
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s.trim());
    if (m) {
      const mm = +m[1] - 1; const dd = +m[2]; const yy = +m[3];
      const yyyy = yy < 100 ? 2000 + yy : yy;
      return new Date(yyyy, mm, dd);
    }
    return null;
  }
}
