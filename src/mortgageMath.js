export function monthlyPIMonths(principal, annualRate, n){
  const r=annualRate/100/12;
  if(!principal||principal<=0||!n||n<=0)return 0;
  if(!r)return principal/n;
  return principal*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
}

export function monthlyPI(principal, annualRate, years){
  if(!years||years<=0)return 0;
  return monthlyPIMonths(principal, annualRate, years*12);
}

// How many payments are left, worked out from the balance, the rate and the
// payment the owner actually makes. Returns Infinity when the payment cannot
// even cover one month of interest.
export function monthsRemaining(balance, annualRate, payment){
  if(!(balance>0)||!(payment>0))return 0;
  const r=annualRate/100/12;
  if(!r)return Math.ceil(balance/payment);
  if(payment<=balance*r)return Infinity;
  return Math.ceil(-Math.log(1-(r*balance)/payment)/Math.log(1+r));
}

export function amortize({principal,annualRate,years,months,payment,extraMonthly=0,lumpSum=0,extraPayments=[]}){
  const term=Number.isFinite(months)&&months>0?months:(years||0)*12;
  // `payment` lets an existing owner give the payment they actually make,
  // instead of it being derived from the term.
  const scheduled=Number.isFinite(payment)&&payment>0?payment:monthlyPIMonths(principal,annualRate,term);
  const r=annualRate/100/12;
  // Extra payments are keyed by the month they land in (month 1 = the next payment).
  const dated=new Map();
  for(const p of extraPayments||[]){
    const m=Math.max(1,Math.round(Number(p?.month)||1));
    const amt=Math.max(0,Number(p?.amount)||0);
    if(amt>0)dated.set(m,(dated.get(m)||0)+amt);
  }
  let balance=principal,month=0,totalInterest=0; const rows=[];
  const cap=term+1200;
  while(balance>0.01&&month<cap){
    month++;
    const interest=r?balance*r:0;
    const scheduledPrincipal=Math.max(0,scheduled-interest);
    const oneTime=(month===1?lumpSum:0)+(dated.get(month)||0);
    const principalPaid=Math.min(balance,scheduledPrincipal+extraMonthly+oneTime);
    if(principalPaid<=0)break; // payment cannot cover the interest; stop instead of looping
    const paid=interest+principalPaid;
    balance=Math.max(0,balance-principalPaid);
    totalInterest+=interest;
    rows.push({month,payment:paid,principal:principalPaid,interest,balance,
      extra:Math.max(0,principalPaid-scheduledPrincipal)});
  }
  return {scheduled,totalInterest,months:month,rows,cleared:balance<=0.01};
}


export function monthlyHousingCosts({
  principal,
  annualRate,
  years,
  propertyTaxAnnual=0,
  homeownersInsuranceAnnual=0,
  floodWindInsuranceAnnual=0,
  hoaMonthly=0,
  downPaymentPct=0,
  pmiRateAnnual=0,
  maintenancePctAnnual=0,
  homePrice=0
}){
  const pi=monthlyPI(principal,annualRate,years);
  const tax=propertyTaxAnnual/12;
  const insurance=homeownersInsuranceAnnual/12;
  const floodWind=floodWindInsuranceAnnual/12;
  const pmi=downPaymentPct<20?principal*(pmiRateAnnual/100)/12:0;
  const maintenance=homePrice*(maintenancePctAnnual/100)/12;
  const mortgageRelated=pi+tax+insurance+floodWind+hoaMonthly+pmi;
  return {pi,tax,insurance,floodWind,hoa:hoaMonthly,pmi,maintenance,mortgageRelated,trueMonthly:mortgageRelated+maintenance};
}

export function cashToClose({
  homePrice,
  downPaymentPct,
  closingCostPct=0,
  sellerLenderCredits=0,
  lenderOriginationFee=0,
  appraisalFee=0,
  inspectionFee=0,
  titleSettlementFee=0,
  recordingGovernmentFee=0,
  prepaidInterest=0,
  initialEscrow=0
}){
  const downPayment=homePrice*(downPaymentPct/100);
  const fallbackClosing=homePrice*(closingCostPct/100);
  const itemizedClosing=lenderOriginationFee+appraisalFee+inspectionFee+titleSettlementFee+recordingGovernmentFee+prepaidInterest+initialEscrow;
  // Use the user's itemized costs when any are entered; the % estimate is only a fallback.
  const closingMethod=itemizedClosing>0?"itemized":"fallback";
  const effectiveClosing=closingMethod==="itemized"?itemizedClosing:fallbackClosing;
  return {
    downPayment,
    fallbackClosing,
    itemizedClosing,
    effectiveClosing,
    closingMethod,
    cashToClose:Math.max(0,downPayment+effectiveClosing-sellerLenderCredits)
  };
}
