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
