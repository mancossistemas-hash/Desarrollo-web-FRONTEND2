import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mayor } from './mayor';

describe('Mayor', () => {
  let component: Mayor;
  let fixture: ComponentFixture<Mayor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mayor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mayor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
