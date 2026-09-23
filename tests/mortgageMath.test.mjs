import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPI, amortize, monthlyHousingCosts, cashToClose } from '../src/mortgageMath.js';

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


test('PMI is applied below 20 percent down',()=>{
  const costs=monthlyHousingCosts({principal:380000,annualRate:6,years:30,homePrice:400000,downPaymentPct:5,pmiRateAnnual:0.6});
  assert.ok(costs.pmi>0);
});

test('PMI is removed at 20 percent down',()=>{
  const costs=monthlyHousingCosts({principal:320000,annualRate:6,years:30,homePrice:400000,downPaymentPct:20,pmiRateAnnual:0.6});
  assert.equal(costs.pmi,0);
});

test('true monthly cost includes maintenance reserve',()=>{
  const costs=monthlyHousingCosts({principal:320000,annualRate:6,years:30,homePrice:400000,downPaymentPct:20,maintenancePctAnnual:1});
  assert.ok(Math.abs((costs.trueMonthly-costs.mortgageRelated)-333.3333333333)<0.01);
});

test('cash to close uses larger of fallback and itemized closing costs',()=>{
  const c=cashToClose({homePrice:400000,downPaymentPct:20,closingCostPct:3,lenderOriginationFee:1000,appraisalFee:500});
  assert.equal(c.effectiveClosing,12000);
  assert.equal(c.cashToClose,92000);
});

test('cash to close uses itemized costs when they exceed fallback estimate',()=>{
  const c=cashToClose({homePrice:400000,downPaymentPct:10,closingCostPct:2,lenderOriginationFee:5000,appraisalFee:1000,inspectionFee:1000,titleSettlementFee:3000});
  assert.equal(c.effectiveClosing,10000);
  assert.equal(c.cashToClose,50000);
});

test('seller credits reduce cash to close but never below zero',()=>{
  const c=cashToClose({homePrice:200000,downPaymentPct:5,closingCostPct:2,sellerLenderCredits:50000});
  assert.equal(c.cashToClose,0);
});

test('zero principal returns zero payment and empty amortization',()=>{
  assert.equal(monthlyPI(0,6,30),0);
  const a=amortize({principal:0,annualRate:6,years:30});
  assert.equal(a.months,0);
  assert.equal(a.rows.length,0);
});

test('large lump sum cannot create a negative ending balance',()=>{
  const a=amortize({principal:100000,annualRate:6,years:30,lumpSum:200000});
  assert.equal(a.months,1);
  assert.equal(a.rows.at(-1).balance,0);
});
