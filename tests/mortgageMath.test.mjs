import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPI, amortize } from '../src/mortgageMath.js';

test('30-year mortgage payment matches known formula result',()=>{
  const payment=monthlyPI(300000,6,30);
  assert.ok(Math.abs(payment-1798.65)<0.1);
});

test('zero interest divides principal evenly',()=>{
  assert.equal(monthlyPI(120000,0,10),1000);
});

test('amortization reaches zero at scheduled term',()=>{
  const a=amortize({principal:300000,annualRate:6,years:30});
  assert.equal(a.months,360);
  assert.ok(a.rows.at(-1).balance<0.01);
});

test('extra monthly principal shortens payoff and lowers interest',()=>{
  const base=amortize({principal:300000,annualRate:6,years:30});
  const extra=amortize({principal:300000,annualRate:6,years:30,extraMonthly:300});
  assert.ok(extra.months<base.months);
  assert.ok(extra.totalInterest<base.totalInterest);
});

test('lump-sum principal payment lowers lifetime interest',()=>{
  const base=amortize({principal:300000,annualRate:6,years:30});
  const lump=amortize({principal:300000,annualRate:6,years:30,lumpSum:10000});
  assert.ok(lump.totalInterest<base.totalInterest);
});
