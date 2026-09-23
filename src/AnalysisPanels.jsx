import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AnalysisPanels({
  Field, principalInterestData, termComparison, rateComparison, pointsPct, setPointsPct,
  pointsRateReduction, setPointsRateReduction, pointsAnalysis, extraCashComparison,
  extraCashAmount, setExtraCashAmount,
  currentBalance, setCurrentBalance, currentRate, setCurrentRate, remainingYears, setRemainingYears,
  afterPurchase, money
}){
  return <>
    <section className="analysis-grid">
      <div className="card panel compact-panel section-blue">
        <div className="section-title"><div><span>PRINCIPAL VS. INTEREST</span><h2>How the payment changes over time</h2></div></div>
        <ResponsiveContainer width="100%" height={210}><BarChart data={principalInterestData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year"/><YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"}/><Tooltip formatter={v=>money(v)}/><Legend/><Bar dataKey="principal" name="Principal" stackId="a" fill="#0f766e"/><Bar dataKey="interest" name="Interest" stackId="a" fill="#f59e0b"/></BarChart></ResponsiveContainer>
      </div>
      <div className="card panel compact-panel section-purple">
        <div className="section-title"><div><span>LOAN TERM COMPARISON</span><h2>15 vs. 20 vs. 30 years</h2></div></div>
        <div className="compare-cards">{termComparison.map(x=><div key={x.term}><strong>{x.term}</strong><span>{money(x.payment)}/mo P&I</span><small>{money(x.interest)} total interest</small></div>)}</div>
      </div>
      <div className="card panel compact-panel section-green">
        <div className="section-title"><div><span>INTEREST RATE SENSITIVITY</span><h2>Payment at nearby rates</h2></div></div>
        <ResponsiveContainer width="100%" height={210}><LineChart data={rateComparison}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="rate" tickFormatter={v=>v+"%"}/><YAxis tickFormatter={v=>"$"+v}/><Tooltip labelFormatter={v=>"Rate: "+v+"%"} formatter={v=>money(v)}/><Line type="monotone" dataKey="payment" name="Monthly P&I" stroke="#2563eb" strokeWidth={3}/></LineChart></ResponsiveContainer>
      </div>
    </section>

    <section className="analysis-grid">
      <div className="card panel compact-panel section-gold">
        <div className="section-title"><div><span>POINTS BREAK-EVEN</span><h2>Rate buydown analysis</h2></div></div>
        <div className="form-grid"><Field label="Points paid" value={pointsPct} onChange={setPointsPct} suffix="% of loan" step={0.25}/><Field label="Rate reduction" value={pointsRateReduction} onChange={setPointsRateReduction} suffix="%" step={0.125}/></div>
        <div className="mini-breakdown"><span>Upfront points cost <b>{money(pointsAnalysis.pointsCost)}</b></span><span>New rate <b>{pointsAnalysis.reducedRate.toFixed(3)}%</b></span><span>Monthly P&I saving <b>{money(pointsAnalysis.monthlySavings)}</b></span><span>Break-even <b>{pointsAnalysis.breakEven?pointsAnalysis.breakEven+" months":"N/A"}</b></span></div>
      </div>
      <div className="card panel compact-panel section-savings">
        <div className="section-title"><div><span>EXTRA CASH COMPARISON</span><h2>What does another {money(extraCashAmount)} change?</h2></div></div>
        <div className="extra-cash-control">
          <label><span>Extra cash amount</span><select value={extraCashAmount} onChange={e=>setExtraCashAmount(Number(e.target.value))}>
            {[5000,10000,15000,20000,25000,30000,40000,50000].map(v=><option key={v} value={v}>{money(v)}</option>)}
          </select></label>
          <input type="range" min="5000" max="50000" step="5000" value={extraCashAmount} onChange={e=>setExtraCashAmount(Number(e.target.value))}/>
        </div>
        <div className="compare-cards two-up"><div><strong>Use at purchase</strong><span>{money(extraCashComparison.downMonthlySavings)}/mo lower housing payment</span><small>Includes estimated PMI effect</small></div><div><strong>Pay principal after purchase</strong><span>{money(extraCashComparison.afterInterestSavings)} interest saved</span><small>{Math.floor(extraCashComparison.afterMonthsSaved/12)}y {extraCashComparison.afterMonthsSaved%12}m sooner</small></div></div>
      </div>
      <div className="card panel compact-panel section-slate">
        <div className="section-title"><div><span>AFTER-PURCHASE MODE</span><h2>Track an existing mortgage</h2></div></div>
        <div className="three-fields"><Field label="Current balance" value={currentBalance} onChange={setCurrentBalance} prefix="$" step={1000}/><Field label="Current rate" value={currentRate} onChange={setCurrentRate} suffix="%" step={0.125}/><Field label="Years remaining" value={remainingYears} onChange={setRemainingYears} suffix="years"/></div>
        {afterPurchase?<div className="mini-breakdown"><span>Current P&I <b>{money(afterPurchase.base.scheduled)}/mo</b></span><span>Interest remaining <b>{money(afterPurchase.base.totalInterest)}</b></span><span>With current extra-payment settings <b>{Math.max(0,afterPurchase.base.months-afterPurchase.accelerated.months)} months sooner</b></span><span>Interest saved <b>{money(Math.max(0,afterPurchase.base.totalInterest-afterPurchase.accelerated.totalInterest))}</b></span></div>:<div className="empty-hint">Enter balance, rate and remaining years to analyze the existing loan.</div>}
      </div>
    </section>
  </>;
}
