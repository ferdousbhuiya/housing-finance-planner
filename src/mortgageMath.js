export function monthlyPI(principal, annualRate, years){
  const n=years*12, r=annualRate/100/12;
  if(!principal||principal<=0||!years||years<=0)return 0;
  if(!r)return principal/n;
  return principal*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
}

export function amortize({principal,annualRate,years,extraMonthly=0,lumpSum=0}){
  const scheduled=monthlyPI(principal,annualRate,years),r=annualRate/100/12;
  let balance=principal,month=0,totalInterest=0; const rows=[];
  while(balance>0.01&&month<years*12+1200){
    month++;
    const interest=r?balance*r:0;
    const scheduledPrincipal=Math.max(0,scheduled-interest);
    const oneTime=month===1?lumpSum:0;
    const principalPaid=Math.min(balance,scheduledPrincipal+extraMonthly+oneTime);
    const payment=interest+principalPaid;
    balance=Math.max(0,balance-principalPaid);
    totalInterest+=interest;
    rows.push({month,payment,principal:principalPaid,interest,balance});
  }
  return {scheduled,totalInterest,months:month,rows};
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
  const effectiveClosing=Math.max(fallbackClosing,itemizedClosing);
  return {
    downPayment,
    fallbackClosing,
    itemizedClosing,
    effectiveClosing,
    cashToClose:Math.max(0,downPayment+effectiveClosing-sellerLenderCredits)
  };
}
