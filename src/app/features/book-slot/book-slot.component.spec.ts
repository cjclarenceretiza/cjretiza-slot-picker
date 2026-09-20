import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookSlotComponent } from './book-slot.component';

describe('BookSlotComponent', () => {
  let component: BookSlotComponent;
  let fixture: ComponentFixture<BookSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookSlotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookSlotComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
