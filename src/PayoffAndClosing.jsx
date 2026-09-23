import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function PayoffAndClosing({
  Field, extraMonthly, setExtraMonthly, lumpSum, setLumpSum,
  payoffBase, payoffExtra, monthsSaved, interestSaved, calc, yearly, money,
  closingPct, setClosingPct, sellerCredit, setSellerCredit,
  lenderFee, setLenderFee, appraisalFee, setAppraisalFee,
  inspectionFee, setInspectionFee, titleFee, setTitleFee,
  recordingFee, setRecordingFee, prepaidInterest, setPrepaidInterest,
  initialEscrow, setInitialEscrow
}){
  return <section className="payoff-layout">
    <div className="payoff-pair">
      <div className="card panel compact-panel section-green">
        <div className="section-title"><div><span>EXTRA PRINCIPAL</span><h2>Payoff accelerator</h2></div></div>
        <div className="form-grid">
          <Field label="Extra every month" value={extraMonthly} onChange={setExtraMonthly} prefix="$" step={50}/>
          <Field label="One-time principal payment" value={lumpSum} onChange={setLumpSum} prefix="$" step={500}/>
        </div>
        <div className="payoff-strip"><span>Scheduled payoff <b>{payoffBase}</b></span><span>Accelerated payoff <b>{payoffExtra}</b></span></div>
        <div className="impact-grid">
          <div><span>Time saved</span><strong>{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</strong></div>
          <div><span>Interest saved</span><strong>{money(interestSaved)}</strong></div>
          <div><span>New payoff</span><strong>{Math.floor(calc.extra.months/12)}y {calc.extra.months%12}m</strong><small>{payoffExtra}</small></div>
        </div>
      </div>
      <div className="card panel compact-panel balance-card section-slate">
        <div className="section-title"><div><span>BALANCE OVER TIME</span><h2>Extra principal impact</h2></div></div>
        <ResponsiveContainer width="100%" height={190}>
          <AreaChart data={yearly} margin={{top:0,right:8,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"}/>
            <Tooltip formatter={v=>money(v)}/><Legend/>
            <Area type="monotone" dataKey="normal" name="Scheduled" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.38}/>
            <Area type="monotone" dataKey="extra" name="Extra principal" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.34}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="card panel compact-panel section-gold closing-card">
      <div className="section-title"><div><span>CASH TO CLOSE</span><h2>Purchase costs</h2></div><strong>{money(calc.cashToClose)}</strong></div>
      <div className="closing-fields">
        <Field label="Closing cost fallback" value={closingPct} onChange={setClosingPct} suffix="%" step={0.25} max={15}/>
        <Field label="Seller / lender credits" value={sellerCredit} onChange={setSellerCredit} prefix="$" step={500}/>
        <Field label="Lender / origination" value={lenderFee} onChange={setLenderFee} prefix="$" step={100}/>
        <Field label="Appraisal" value={appraisalFee} onChange={setAppraisalFee} prefix="$" step={50}/>
        <Field label="Inspection" value={inspectionFee} onChange={setInspectionFee} prefix="$" step={50}/>
        <Field label="Title / settlement" value={titleFee} onChange={setTitleFee} prefix="$" step={100}/>
        <Field label="Recording / government" value={recordingFee} onChange={setRecordingFee} prefix="$" step={50}/>
        <Field label="Prepaid interest" value={prepaidInterest} onChange={setPrepaidInterest} prefix="$" step={50}/>
        <Field label="Initial escrow" value={initialEscrow} onChange={setInitialEscrow} prefix="$" step={100}/>
      </div>
      <div className="mini-breakdown closing-summary"><span>Down payment <b>{money(calc.down)}</b></span><span>Itemized closing <b>{money(calc.itemizedClosing)}</b></span><span>Fallback % estimate <b>{money(calc.closingCosts)}</b></span><span>Used in estimate <b>{money(calc.effectiveClosing)}</b></span><span>Credits <b>− {money(sellerCredit)}</b></span></div>
    </div>
  </section>;
}
