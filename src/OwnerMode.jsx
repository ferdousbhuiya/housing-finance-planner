import React, { useState, useEffect } from 'react';
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
  ownLoan, ownBalanceSeries, monthOptions
}){
  const addPayment=()=>setOwnPayments(prev=>[...prev,{id:Date.now()+Math.random(),month:0,paid:Math.round(ownLoan?.scheduledPayment||0)}]);
  const updatePayment=(id,patch)=>setOwnPayments(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));
  const removePayment=id=>setOwnPayments(prev=>prev.filter(p=>p.id!==id));

  return <>
    <section className="analysis-grid two-col">
      <div className="card panel compact-panel section-owner">
        <div className="section-title"><div><span>MY LOAN TODAY</span><h2>Where your mortgage stands</h2></div></div>
        <div className="three-fields">
          <Field label="Current balance" value={ownBalance} onChange={setOwnBalance} prefix="$" step={1000}/>
          <Field label="Interest rate" value={ownRate} onChange={setOwnRate} suffix="%" step={0.125} max={30}/>
          <Field label="Payment (P&I only)" value={ownPayment} onChange={setOwnPayment} prefix="$" step={50}/>
        </div>
        <small className="panel-note">Enter principal and interest only. If your lender collects tax and insurance in escrow, leave that part out — the balance is what matters here. Your balance is as of today, so extra payments you already made are inside it.</small>

        {!ownLoan&&<div className="empty-hint">Fill in your balance, rate and monthly payment to see where you stand.</div>}
        {ownLoan?.tooSmall&&<div className="validation-box"><span>That payment does not cover one month of interest ({money(ownLoan.firstInterest)}). Check the amount — remember to enter principal and interest only.</span></div>}

        {ownLoan&&!ownLoan.tooSmall&&<>
          <div className="mini-breakdown">
            <span>Payments left <b>{ownLoan.base.months} ({yearsMonths(ownLoan.base.months)})</b></span>
            <span>Payoff date as scheduled <b>{ownLoan.basePayoff}</b></span>
            <span>Interest still to pay <b>{money(ownLoan.base.totalInterest)}</b></span>
            <span>Of your next payment, principal is <b>{money(ownLoan.nextPrincipal)}</b> and interest is <b>{money(ownLoan.firstInterest)}</b></span>
          </div>
          <div className="form-grid">
            <Field label="Extra every month from now on" value={ownExtraMonthly} onChange={setOwnExtraMonthly} prefix="$" step={25}/>
          </div>
        </>}
      </div>

      <div className="card panel compact-panel section-owner-result">
        <div className="section-title"><div><span>WHERE YOU END UP</span><h2>After your extra payments</h2></div></div>
        {ownLoan&&!ownLoan.tooSmall?<>
          <div className="impact-grid">
            <div><span>New payoff</span><strong>{ownLoan.newPayoff}</strong><small>was {ownLoan.basePayoff}</small></div>
            <div><span>Interest saved</span><strong>{money(ownLoan.interestSaved)}</strong></div>
            <div><span>Time saved</span><strong>{yearsMonths(ownLoan.monthsSaved)}</strong></div>
          </div>
          <div className="mini-breakdown">
            <span>Extra paid in total <b>{money(ownLoan.totalExtra)}</b></span>
            <span>Interest you still pay <b>{money(ownLoan.withExtra.totalInterest)}</b></span>
            <span>Payments left <b>{ownLoan.withExtra.months} ({yearsMonths(ownLoan.withExtra.months)})</b></span>
          </div>
          {ownLoan.totalExtra>0&&<small className="panel-note">Every {money(1)} of extra principal removes more than {money(1)} of future interest, because you stop paying interest on it for the rest of the loan.</small>}
          {ownBalanceSeries.length>1&&<ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ownBalanceSeries} margin={{top:6,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year" tick={{fontSize:11}} label={{value:"Years from now",position:"insideBottom",offset:-2,fontSize:10}}/>
              <YAxis tick={{fontSize:11}} tickFormatter={v=>"$"+Math.round(v/1000)+"k"}/>
              <Tooltip formatter={v=>money(v)} labelFormatter={v=>"Year "+v}/><Legend/>
              <Area type="monotone" dataKey="scheduled" name="As scheduled" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.4}/>
              <Area type="monotone" dataKey="withExtra" name="With extra" stroke="#4f46e5" fill="#c7d2fe" fillOpacity={0.45}/>
            </AreaChart>
          </ResponsiveContainer>}
        </>:<div className="empty-hint">Your results appear here once the loan details are filled in.</div>}
      </div>
    </section>

    <section className="card panel compact-panel section-owner-log">
      <div className="section-title">
        <div><span>EXTRA PAYMENTS</span><h2>Paying more than the usual amount</h2></div>
        <small>{ownPayments.length} {ownPayments.length===1?"entry":"entries"}</small>
      </div>
      <small className="panel-note">Put in what you actually paid that month. If your normal payment is {money(ownLoan?.scheduledPayment||0)} and you pay {money(Math.round((ownLoan?.scheduledPayment||0)+88))}, the extra {money(88)} comes straight off the balance. Only list this month and later — anything you paid before is already inside your current balance.</small>

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
    </section>
  </>;
}
