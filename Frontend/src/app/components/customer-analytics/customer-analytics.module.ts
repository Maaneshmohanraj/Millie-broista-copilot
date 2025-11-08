import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { CustomerAnalyticsComponent } from './customer-analytics.component'; // standalone: true

const routes: Routes = [
  { path: '', component: CustomerAnalyticsComponent } // lazy-loaded entry
];

@NgModule({
  // ❌ Do not declare a standalone component
  // declarations: [CustomerAnalyticsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,

    // ✅ Import the standalone component
    CustomerAnalyticsComponent,

    RouterModule.forChild(routes)
  ],
  // ✅ Re-export is fine because it's in imports
  exports: [CustomerAnalyticsComponent]
})
export class CustomerAnalyticsModule {}
