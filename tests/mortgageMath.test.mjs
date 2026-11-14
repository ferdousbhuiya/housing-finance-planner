import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPI, monthlyPIMonths, monthsRemaining, amortize, monthlyHousingCosts, cashToClose } from '../src/mortgageMath.js';

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

test('cash to close uses itemized costs even when smaller than the fallback estimate',()=>{
  const c=cashToClose({homePrice:400000,downPaymentPct:20,closingCostPct:3,lenderOriginationFee:1000,appraisalFee:500});
  assert.equal(c.closingMethod,'itemized');
  assert.equal(c.effectiveClosing,1500);
  assert.equal(c.cashToClose,81500);
});

test('cash to close falls back to the percentage when no items are entered',()=>{
  const c=cashToClose({homePrice:400000,downPaymentPct:20,closingCostPct:3});
  assert.equal(c.closingMethod,'fallback');
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

test('months remaining is derived from balance, rate and payment',()=>{
  const n=monthsRemaining(300000,6,1798.65);
  assert.ok(Math.abs(n-360)<=1);
});

test('months remaining is infinite when the payment cannot cover interest',()=>{
  assert.equal(monthsRemaining(300000,6,100),Infinity);
});

test('a dated extra payment saves less the later it is made',()=>{
  const early=amortize({principal:300000,annualRate:6,years:30,extraPayments:[{month:1,amount:1000}]});
  const late=amortize({principal:300000,annualRate:6,years:30,extraPayments:[{month:120,amount:1000}]});
  const base=amortize({principal:300000,annualRate:6,years:30});
  assert.ok(base.totalInterest-early.totalInterest > base.totalInterest-late.totalInterest);
});

test('several dated extra payments stack up',()=>{
  const base=amortize({principal:300000,annualRate:6,years:30});
  const one=amortize({principal:300000,annualRate:6,years:30,extraPayments:[{month:12,amount:500}]});
  const two=amortize({principal:300000,annualRate:6,years:30,extraPayments:[{month:12,amount:500},{month:24,amount:500}]});
  assert.ok(two.totalInterest<one.totalInterest);
  assert.ok(one.totalInterest<base.totalInterest);
});

test('an owner payment amount is used instead of deriving it from the term',()=>{
  const a=amortize({principal:200000,annualRate:6,months:240,payment:2000});
  assert.equal(a.scheduled,2000);
  assert.ok(a.months<240);
  assert.ok(a.cleared);
});

test('a payment too small to cover interest stops instead of looping forever',()=>{
  const a=amortize({principal:300000,annualRate:6,months:360,payment:100});
  assert.equal(a.cleared,false);
  assert.ok(a.months<5);
});
