import { TestBed } from '@angular/core/testing';

import { TimeOffService } from './time-off.service';

describe('TimeOffService', () => {
  let service: TimeOffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeOffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
