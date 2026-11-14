import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function PrincipalVsInterest({principalInterestData,money}){
  return <div className="card panel compact-panel section-blue">
    <div className="section-title"><div><span>PRINCIPAL VS. INTEREST</span><h2>How the payment changes over time</h2></div></div>
    <ResponsiveContainer width="100%" height={210}><BarChart data={principalInterestData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year"/><YAxis tickFormatter={v=>"$"+Math.round(v/1000)+"k"}/><Tooltip formatter={v=>money(v)}/><Legend/><Bar dataKey="principal" name="Principal" stackId="a" fill="#0f766e"/><Bar dataKey="interest" name="Interest" stackId="a" fill="#f59e0b"/></BarChart></ResponsiveContainer>
  </div>;
}

export function TermComparison({termComparison,money}){
  return <div className="card panel compact-panel section-purple">
    <div className="section-title"><div><span>LOAN TERM COMPARISON</span><h2>15 vs. 20 vs. 30 years</h2></div></div>
    <div className="compare-cards">{termComparison.map(x=><div key={x.term}><strong>{x.term}</strong><span>{money(x.payment)}/mo P&I</span><small>{money(x.interest)} total interest</small></div>)}</div>
    <small className="panel-note">All three use your current rate. Lenders often give 15-year loans a lower rate, so ask for a quote.</small>
  </div>;
}

export function RateSensitivity({rateComparison,money}){
  return <div className="card panel compact-panel section-green">
    <div className="section-title"><div><span>INTEREST RATE SENSITIVITY</span><h2>Payment at nearby rates</h2></div></div>
    <ResponsiveContainer width="100%" height={210}><LineChart data={rateComparison}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="rate" interval={0} tick={{fontSize:11}} tickFormatter={v=>v+"%"}/><YAxis tickFormatter={v=>"$"+v}/><Tooltip labelFormatter={v=>"Rate: "+v+"%"} formatter={v=>money(v)}/><Line type="monotone" dataKey="payment" name="Monthly P&I" stroke="#2563eb" strokeWidth={3}/></LineChart></ResponsiveContainer>
  </div>;
}

export function PointsBreakEven({Field,pointsPct,setPointsPct,pointsRateReduction,setPointsRateReduction,pointsAnalysis,money}){
  return <div className="card panel compact-panel section-gold">
    <div className="section-title"><div><span>POINTS BREAK-EVEN</span><h2>Rate buydown analysis</h2></div></div>
    <div className="form-grid"><Field label="Points paid (% of loan)" value={pointsPct} onChange={setPointsPct} suffix="%" step={0.25} max={10}/><Field label="Rate reduction" value={pointsRateReduction} onChange={setPointsRateReduction} suffix="%" step={0.125} max={5}/></div>
    <div className="mini-breakdown"><span>Upfront points cost <b>{money(pointsAnalysis.pointsCost)}</b></span><span>New rate <b>{pointsAnalysis.reducedRate.toFixed(3)}%</b></span><span>Monthly P&I saving <b>{money(pointsAnalysis.monthlySavings)}</b></span><span>Break-even <b>{pointsAnalysis.breakEven?pointsAnalysis.breakEven+" months":"N/A"}</b></span></div>
    <small className="panel-note">Break-even is how long you must keep the loan before the points pay for themselves.</small>
  </div>;
}

export function ExtraCashComparison({extraCashComparison,extraCashAmount,setExtraCashAmount,money}){
  const x=extraCashComparison;
  const better=x.afterInterestSavings>x.downInterestSavings?"after":"down";
  return <div className="card panel compact-panel section-savings">
    <div className="section-title"><div><span>EXTRA CASH: PURCHASE VS. AFTER PURCHASE</span><h2>Where should an extra {money(extraCashAmount)} go?</h2></div></div>
    <div className="extra-cash-control">
      <label><span>Extra cash amount</span><select value={extraCashAmount} onChange={e=>setExtraCashAmount(Number(e.target.value))}>
        {[5000,10000,15000,20000,25000,30000,40000,50000].map(v=><option key={v} value={v}>{money(v)}</option>)}
      </select></label>
      <input type="range" min="5000" max="50000" step="5000" value={extraCashAmount} onChange={e=>setExtraCashAmount(Number(e.target.value))}/>
    </div>
    <div className="compare-cards two-up option-cards">
      <div className={better==="down"?"option-better":""}>
        <strong>Option 1 · Add to down payment</strong>
        <div className="option-rows">
          <div><span>Monthly payment</span><b>{money(x.downMonthlySavings)}/mo lower</b></div>
          <div><span>Total interest saved</span><b>{money(x.downInterestSavings)}</b></div>
          <div><span>Payoff sooner</span><b>{x.downMonthsSaved?Math.floor(x.downMonthsSaved/12)+"y "+x.downMonthsSaved%12+"m":"Same date"}</b></div>
        </div>
        <small>Applied at purchase; includes estimated PMI effect</small>
      </div>
      <div className={better==="after"?"option-better":""}>
        <strong>Option 2 · Pay principal after closing</strong>
        <div className="option-rows">
          <div><span>Monthly payment</span><b>No change</b></div>
          <div><span>Total interest saved</span><b>{money(x.afterInterestSavings)}</b></div>
          <div><span>Payoff sooner</span><b>{Math.floor(x.afterMonthsSaved/12)}y {x.afterMonthsSaved%12}m</b></div>
        </div>
        <small>Applied after purchase; the monthly payment stays the same</small>
      </div>
    </div>
    <small className="panel-note">Option 1 lowers what you pay every month. Option 2 saves more interest overall but your payment stays the same. Pick Option 1 if monthly cash flow matters most.</small>
  </div>;
}
