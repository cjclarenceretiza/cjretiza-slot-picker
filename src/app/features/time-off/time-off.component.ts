import { Component, Input, Output, EventEmitter, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeOffService } from '../../core/services/time-off.service';
import { TimeOff } from '../../core/models';
import {
  localDayBoundsToUtc,
  localDateTimeToUtc,
  formatLocalTime,
  formatLocalTimeInputValue
} from '../../core/utils/date-time.util';

@Component({
  selector: 'app-time-off',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './time-off.component.html'
})
export class TimeOffComponent implements OnChanges {
  @Input({ required: true }) staffId!: string;
  @Input({ required: true }) date!: string;
  @Input({ required: true }) timezone!: string;

  @Output() timeOffChanged = new EventEmitter<void>();

  private timeOffService = inject(TimeOffService);

  entries = signal<TimeOff[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  formStart = signal('09:00');
  formEnd = signal('10:00');
  formReason = signal('');
  saving = signal(false);

  async ngOnChanges() {
    if (!this.staffId || !this.date) {
      this.entries.set([]);
      return;
    }
    this.closeForm();
    await this.load();
  }

  private async load() {
    this.errorMessage.set(null);
    this.loading.set(true);
    try {
      const { dayStartUtc, dayEndUtc } = localDayBoundsToUtc(this.date, this.timezone);
      const result = await this.timeOffService.listTimeOffForStaffOnDate(
        this.staffId, dayStartUtc, dayEndUtc
      );
      this.entries.set(result);
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to load time off.');
    } finally {
      this.loading.set(false);
    }
  }

  formatTime(isoUtc: string): string {
    return formatLocalTime(isoUtc, this.timezone);
  }

  openAddForm() {
    this.editingId.set(null);
    this.formStart.set('09:00');
    this.formEnd.set('10:00');
    this.formReason.set('');
    this.showForm.set(true);
  }

  openEditForm(entry: TimeOff) {
    this.editingId.set(entry.id);
    this.formStart.set(formatLocalTimeInputValue(entry.starts_at, this.timezone));
    this.formEnd.set(formatLocalTimeInputValue(entry.ends_at, this.timezone));
    this.formReason.set(entry.reason ?? '');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  async save() {
    if (this.saving()) return;
    this.errorMessage.set(null);

    if (this.formEnd() <= this.formStart()) {
      this.errorMessage.set('End time must be after start time.');
      return;
    }

    this.saving.set(true);
    try {
      const startsAt = localDateTimeToUtc(this.date, this.formStart(), this.timezone);
      const endsAt = localDateTimeToUtc(this.date, this.formEnd(), this.timezone);

      if (this.editingId()) {
        await this.timeOffService.updateTimeOff(this.editingId()!, {
          starts_at: startsAt,
          ends_at: endsAt,
          reason: this.formReason() || null
        });
      } else {
        await this.timeOffService.createTimeOff({
          staff_id: this.staffId,
          starts_at: startsAt,
          ends_at: endsAt,
          reason: this.formReason() || null
        });
      }

      this.closeForm();
      await this.load();
      this.timeOffChanged.emit();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to save time off.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(entry: TimeOff) {
    this.errorMessage.set(null);
    try {
      await this.timeOffService.deleteTimeOff(entry.id);
      await this.load();
      this.timeOffChanged.emit();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to delete time off.');
    }
  }
}
