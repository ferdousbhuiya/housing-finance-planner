import React, { useState, useEffect, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { money, groupDigits, yearsMonths } from './format.js';

// Compact money box for the payment log rows, where a full labelled Field would be noisy.
function AmountInput({value,onChange,ariaLabel}){
  const [text,setText]=useState(String(value||0));
  const [focused,setFocused]=useState(false);
  useEffect(()=>{setText(t=>Number(t)===value?t:String(value||0))},[value]);
  const handle=e=>{
    const raw=e.target.value.replace(/,/g,"").replace(/^0+(?=\d)/,"");
    if(raw!==""&&!/^\d*\.?\d*$/.test(raw))return;
    setText(raw);
    onChange(raw===""?0:Number(raw));
  };
  return <div className="input-shell"><b>$</b>
    <input type="text" inputMode="decimal" aria-label={ariaLabel} value={focused||text===""?text:groupDigits(text)}
      onChange={handle} onFocus={()=>setFocused(true)} onBlur={()=>{setFocused(false);if(text==="")setText("0")}}/>
  </div>;
}

export default function OwnerMode({
  Field, ownBalance, setOwnBalance, ownRate, setOwnRate, ownPayment, setOwnPayment,
  ownExtraMonthly, setOwnExtraMonthly, ownPayments, setOwnPayments,
  ownFirstPayment, setOwnFirstPayment,
  ownTaxAnnual, setOwnTaxAnnual, ownInsuranceAnnual, setOwnInsuranceAnnual,
  ownHoaMonthly, setOwnHoaMonthly, ownOtherMonthly, setOwnOtherMonthly,
  ownYear, setOwnYear, monthLabelFrom,
  ownLoan, ownBalanceSeries, monthOptions
}){
  const addPayment=()=>setOwnPayments(prev=>[...prev,{id:Date.now()+Math.random(),month:0,paid:Math.round(ownLoan?.scheduledPayment||0)}]);
  const updatePayment=(id,patch)=>setOwnPayments(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));
  const removePayment=id=>setOwnPayments(prev=>prev.filter(p=>p.id!==id));

  const ready=ownLoan&&!ownLoan.tooSmall;
  const rows=ready?ownLoan.withExtra.rows:[];
  const totalYears=Math.max(1,Math.ceil(rows.length/12));
  const year=Math.min(Math.max(1,ownYear),totalYears);
  const slice=rows.slice((year-1)*12,year*12);
  const perMonthOther=ready?ownLoan.escrowMonthly+ownLoan.otherMonthly:0;

  const yearTotals=useMemo(()=>slice.reduce((a,r)=>({
    principal:a.principal+(r.principal-(r.extra||0)),
    interest:a.interest+r.interest,
    extra:a.extra+(r.extra||0),
    paid:a.paid+r.payment+perMonthOther
  }),{principal:0,interest:0,extra:0,paid:0}),[slice,perMonthOther]);

  return <>
    <section className="analysis-grid two-col">
      <div className="card panel compact-panel section-owner">
        <div className="section-title"><div><span>MY LOAN TODAY</span><h2>Where your mortgage stands</h2></div></div>
        <div className="owner-fields">
          <Field label="Balance at that date" value={ownBalance} onChange={setOwnBalance} prefix="$" step={1000}/>
          <Field label="Interest rate" value={ownRate} onChange={setOwnRate} suffix="%" step={0.125} max={30}/>
          <Field label="Payment (P&I only)" value={ownPayment} onChange={setOwnPayment} prefix="$" step={50}/>
          <label className="field"><span>First installment</span><div className="input-shell">
            <input type="month" value={ownFirstPayment} aria-label="Month of the first installment"
              onChange={e=>setOwnFirstPayment(e.target.value)}/>
          </div></label>
        </div>
        <small className="panel-note">Enter principal and interest only — if your lender collects tax and insurance in escrow, leave that part out. The balance should be what you owe at the first installment shown, so any extra payments made before that date are already inside it.</small>

        {!ownLoan&&<div className="empty-hint">Fill in your balance, rate and monthly payment to see where you stand.</div>}
        {ownLoan?.tooSmall&&<div className="validation-box"><span>That payment does not cover one month of interest ({money(ownLoan.firstInterest)}). Check the amount — remember to enter principal and interest only.</span></div>}

        {ready&&<>
          <div className="mini-breakdown">
            <span>Payments left <b>{ownLoan.base.months} ({yearsMonths(ownLoan.base.months)})</b></span>
            <span>First installment <b>{ownLoan.firstLabel}</b></span>
            <span>Last payment as scheduled <b>{ownLoan.basePayoff}</b></span>
            <span>Interest still to pay <b>{money(ownLoan.base.totalInterest)}</b></span>
            <span>Of your next payment, principal is <b>{money(ownLoan.nextPrincipal)}</b> and interest is <b>{money(ownLoan.firstInterest)}</b></span>
          </div>
          <div className="form-grid">
            <Field label="Extra every month from now on" value={ownExtraMonthly} onChange={setOwnExtraMonthly} prefix="$" step={25}/>
          </div>
        </>}
      </div>

      <div className="card panel compact-panel section-owner-cost">
        <div className="section-title"><div><span>WHAT YOU ACTUALLY PAY</span><h2>Your whole monthly cost</h2></div>
          {ready&&<strong>{money(ownLoan.totalMonthly)}/mo</strong>}</div>
        <div className="form-grid">
          <Field label="Property tax / year" value={ownTaxAnnual} onChange={setOwnTaxAnnual} prefix="$" step={100}/>
          <Field label="Insurance / year" value={ownInsuranceAnnual} onChange={setOwnInsuranceAnnual} prefix="$" step={100}/>
          <Field label="HOA / month" value={ownHoaMonthly} onChange={setOwnHoaMonthly} prefix="$" step={10}/>
          <Field label="Flood, wind, CDD etc. / month" value={ownOtherMonthly} onChange={setOwnOtherMonthly} prefix="$" step={10}/>
        </div>
        {ready?<>
          <div className="ownership-cost-details owner-cost-list">
            <div><span>Principal &amp; interest</span><b>{money(ownLoan.scheduledPayment)}/mo</b></div>
            <div><span>Property tax</span><b>{money(ownLoan.taxMonthly)}/mo</b></div>
            <div><span>Insurance</span><b>{money(ownLoan.insuranceMonthly)}/mo</b></div>
            <div><span>HOA</span><b>{money(ownLoan.hoaMonthly)}/mo</b></div>
            <div><span>Flood, wind, CDD etc.</span><b>{money(ownLoan.otherMonthly)}/mo</b></div>
            <div className="ownership-total"><span>What leaves your account</span><b>{money(ownLoan.totalMonthly)}/mo</b></div>
            {ownExtraMonthly>0&&<div className="ownership-total"><span>With your extra {money(ownExtraMonthly)}</span><b>{money(ownLoan.totalMonthlyWithExtra)}/mo</b></div>}
          </div>
          <small className="panel-note">Escrow (tax + insurance) is {money(ownLoan.escrowMonthly)}/mo of that. HOA and the other costs are usually billed to you separately, not through the lender.</small>
        </>:<div className="empty-hint">Fill in the loan details first.</div>}
      </div>
    </section>

    <section className="analysis-grid two-col">
      <div className="card panel compact-panel section-owner-result">
        <div className="section-title"><div><span>WHERE YOU END UP</span><h2>After your extra payments</h2></div></div>
        {ready?<>
          <div className="impact-grid">
            <div><span>Last payment</span><strong>{ownLoan.newPayoff}</strong><small>was {ownLoan.basePayoff}</small></div>
            <div><span>Interest saved</span><strong>{money(ownLoan.interestSaved)}</strong></div>
            <div><span>Time saved</span><strong>{yearsMonths(ownLoan.monthsSaved)}</strong></div>
          </div>
          <div className="mini-breakdown">
            <span>Extra paid in total <b>{money(ownLoan.totalExtra)}</b></span>
            <span>Interest you still pay <b>{money(ownLoan.withExtra.totalInterest)}</b></span>
            <span>Payments left <b>{ownLoan.withExtra.months} ({yearsMonths(ownLoan.withExtra.months)})</b></span>
          </div>
          {ownBalanceSeries.length>1&&<ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ownBalanceSeries} margin={{top:6,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}} tickFormatter={v=>"$"+Math.round(v/1000)+"k"}/>
              <Tooltip formatter={v=>money(v)} labelFormatter={v=>"Year "+v}/><Legend/>
              <Area type="monotone" dataKey="scheduled" name="As scheduled" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.4}/>
              <Area type="monotone" dataKey="withExtra" name="With extra" stroke="#4f46e5" fill="#c7d2fe" fillOpacity={0.45}/>
            </AreaChart>
          </ResponsiveContainer>}
        </>:<div className="empty-hint">Your results appear here once the loan details are filled in.</div>}
      </div>

      <div className="card panel compact-panel section-owner-log">
        <div className="section-title">
          <div><span>EXTRA PAYMENTS</span><h2>Paying more than the usual amount</h2></div>
          <small>{ownPayments.length} {ownPayments.length===1?"entry":"entries"}</small>
        </div>
        <small className="panel-note">Put in what you actually paid that month. If your normal payment is {money(ownLoan?.scheduledPayment||0)} and you pay {money(Math.round((ownLoan?.scheduledPayment||0)+88))}, the extra {money(88)} comes straight off the balance. Only list the first installment month or later — anything paid before that is already inside the balance above.</small>

        {ownPayments.length>0&&<div className="pay-log">
          <div className="pay-row pay-head"><span>Month</span><span>Amount you paid</span><span>Extra off the balance</span><span/></div>
          {ownPayments.map(p=>{
            const extra=Math.max(0,(Number(p.paid)||0)-(ownLoan?.scheduledPayment||0));
            return <div className="pay-row" key={p.id}>
              <select value={p.month} aria-label="Month of payment" onChange={e=>updatePayment(p.id,{month:Number(e.target.value)})}>
                {monthOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <AmountInput value={p.paid} ariaLabel="Amount paid" onChange={v=>updatePayment(p.id,{paid:v})}/>
              <span className={extra>0?"pay-extra on":"pay-extra"}>{extra>0?"+"+money(extra):"no extra"}</span>
              <button type="button" className="scenario-delete" aria-label="Remove this payment" onClick={()=>removePayment(p.id)}>×</button>
            </div>;
          })}
        </div>}

        <button type="button" className="secondary add-payment" onClick={addPayment}>+ Add a payment</button>
        {ownPayments.length===0&&<div className="empty-hint">No extra payments yet. Add one to see what it does to your payoff date.</div>}
      </div>
    </section>

    {ready&&<section className="card panel compact-panel section-owner-history">
      <div className="section-title">
        <div><span>PAYMENT HISTORY</span><h2>Every payment, month by month</h2></div>
        <label className="year-pick"><span>Year</span>
          <select value={year} aria-label="Which year to show" onChange={e=>setOwnYear(Number(e.target.value))}>
            {Array.from({length:totalYears},(_,i)=>i+1).map(y=>{
              const from=monthLabelFrom(ownFirstPayment,(y-1)*12);
              const toIdx=Math.min(y*12,rows.length)-1;
              return <option key={y} value={y}>{"Year "+y+" · "+from+" – "+monthLabelFrom(ownFirstPayment,toIdx)}</option>;
            })}
          </select>
        </label>
      </div>
      <div className="table-wrap"><table className="history-table">
        <thead><tr>
          <th>Date</th><th>Principal</th><th>Interest</th><th>Extra</th><th>Balance left</th><th>Total you paid</th>
        </tr></thead>
        <tbody>
          {slice.map(r=><tr key={r.month}>
            <td>{monthLabelFrom(ownFirstPayment,r.month-1)}</td>
            <td>{money(r.principal-(r.extra||0))}</td>
            <td>{money(r.interest)}</td>
            <td className={r.extra>0?"extra-cell on":"extra-cell"}>{r.extra>0?money(r.extra):"—"}</td>
            <td>{money(r.balance)}</td>
            <td><b>{money(r.payment+perMonthOther)}</b></td>
          </tr>)}
          <tr className="year-total">
            <td>Year {year} total</td>
            <td>{money(yearTotals.principal)}</td>
            <td>{money(yearTotals.interest)}</td>
            <td>{yearTotals.extra>0?money(yearTotals.extra):"—"}</td>
            <td>{money(slice.length?slice[slice.length-1].balance:0)}</td>
            <td><b>{money(yearTotals.paid)}</b></td>
          </tr>
        </tbody>
      </table></div>
      <small className="panel-note">"Total you paid" includes escrow, HOA and the other costs above, so it is the amount that actually left your account that month. Principal, interest and extra are the parts that go to the loan.</small>
    </section>}
  </>;
}
