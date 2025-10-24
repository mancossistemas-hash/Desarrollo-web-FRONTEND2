import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BancosCaja } from './bancos-caja';

describe('BancosCaja', () => {
  let component: BancosCaja;
  let fixture: ComponentFixture<BancosCaja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BancosCaja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BancosCaja);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
