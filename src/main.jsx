import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Home, Landmark, PiggyBank, TrendingDown, WalletCards } from 'lucide-react';
import './styles.css';

const formatter = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const money=n=>formatter.format(Number.isFinite(n)?n:0);

function monthlyPI(principal, annualRate, years){
  const n=years*12, r=annualRate/100/12;
  if(!principal||principal<=0)return 0;
  if(!r)return principal/n;
  return principal*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
}

function amortize({principal,annualRate,years,extraMonthly=0}){
  const scheduled=monthlyPI(principal,annualRate,years),r=annualRate/100/12;
  let balance=principal,month=0,totalInterest=0; const rows=[];
  while(balance>0.01&&month<years*12+1200){
    month++;
    const interest=r?balance*r:0;
    const scheduledPrincipal=Math.max(0,scheduled-interest);
    const principalPaid=Math.min(balance,scheduledPrincipal+extraMonthly);
    const payment=interest+principalPaid;
    balance=Math.max(0,balance-principalPaid);
    totalInterest+=interest;
    rows.push({month,payment,principal:principalPaid,interest,balance});
  }
  return {scheduled,totalInterest,months:month,rows};
}

function Field({label,value,onChange,prefix,suffix,step=1}){
  return <label className="field"><span>{label}</span><div className="input-shell">
    {prefix&&<b>{prefix}</b>}<input type="number" value={value} step={step} min="0" onChange={e=>onChange(Number(e.target.value))}/>{suffix&&<b>{suffix}</b>}
  </div></label>
}

function Metric({icon,label,value,helper}){
  return <div className="metric card"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></div>
}

function App(){
  const [price,setPrice]=useState(425000);
  const [downPct,setDownPct]=useState(20);
  const [rate,setRate]=useState(6.25);
  const [years,setYears]=useState(30);
  const [taxAnnual,setTaxAnnual]=useState(7200);
  const [insuranceAnnual,setInsuranceAnnual]=useState(3600);
  const [hoa,setHoa]=useState(220);
  const [pmiRate,setPmiRate]=useState(0.6);
  const [extraMonthly,setExtraMonthly]=useState(300);

  const calc=useMemo(()=>{
    const down=price*downPct/100, principal=Math.max(0,price-down);
    const base=amortize({principal,annualRate:rate,years});
    const extra=amortize({principal,annualRate:rate,years,extraMonthly});
    const tax=taxAnnual/12,insurance=insuranceAnnual/12;
    const pmi=downPct<20 ? principal*(pmiRate/100)/12 : 0;
    return {down,principal,base,extra,tax,insurance,pmi,totalMonthly:base.scheduled+tax+insurance+hoa+pmi};
  },[price,downPct,rate,years,taxAnnual,insuranceAnnual,hoa,pmiRate,extraMonthly]);

  const downData=useMemo(()=>[5,10,15,20,25,30,35,40].map(pct=>{
    const loan=price*(1-pct/100);
    const scenarioPmi=pct<20 ? loan*(pmiRate/100)/12 : 0;
    return {pct:pct+'%',payment:Math.round(monthlyPI(loan,rate,years)+taxAnnual/12+insuranceAnnual/12+hoa+scenarioPmi)};
  }),[price,rate,years,taxAnnual,insuranceAnnual,hoa,pmiRate]);

  const downDollarData=useMemo(()=>[5,10,15,20,25,30,35,40].map(pct=>{
    const amount=price*pct/100;
    const loan=price-amount;
    const scenarioPmi=pct<20 ? loan*(pmiRate/100)/12 : 0;
    return {amount:Math.round(amount),payment:Math.round(monthlyPI(loan,rate,years)+taxAnnual/12+insuranceAnnual/12+hoa+scenarioPmi)};
  }),[price,rate,years,taxAnnual,insuranceAnnual,hoa,pmiRate]);

  const yearly=useMemo(()=>{
    const max=Math.max(calc.base.rows.length,calc.extra.rows.length),out=[];
    for(let i=12;i<=max;i+=12)out.push({year:i/12,normal:Math.round(calc.base.rows[Math.min(i-1,calc.base.rows.length-1)]?.balance||0),extra:Math.round(calc.extra.rows[Math.min(i-1,calc.extra.rows.length-1)]?.balance||0)});
    return out;
  },[calc]);

  const breakdown=[
    {name:'Principal + interest',value:Math.round(calc.base.scheduled)},
    {name:'Property tax',value:Math.round(calc.tax)},
    {name:'Insurance',value:Math.round(calc.insurance)},
    {name:'HOA',value:Math.round(hoa)},
    {name:'PMI',value:Math.round(calc.pmi)}
  ];
  const monthsSaved=Math.max(0,calc.base.months-calc.extra.months);
  const interestSaved=Math.max(0,calc.base.totalInterest-calc.extra.totalInterest);

  return <main>
    <header className="hero compact-hero">
      <div className="brand-row"><div className="brand-icon"><Home size={22}/></div><div><div className="eyebrow">HOUSING FINANCE PLANNER</div><h1>Mortgage Decision Dashboard</h1><p>Change an assumption and see the financial effect instantly.</p></div></div>
      <div className="hero-badge"><Home size={18}/> Mortgage Lab</div>
    </header>

    <section className="metrics">
      <Metric icon={<Landmark/>} label="Loan amount" value={money(calc.principal)} helper={downPct+'% down'}/>
      <Metric icon={<WalletCards/>} label="Monthly housing cost" value={money(calc.totalMonthly)} helper="P&I + tax + insurance + HOA + PMI"/>
      <Metric icon={<PiggyBank/>} label="Cash down" value={money(calc.down)} helper="Before closing costs"/>
      <Metric icon={<TrendingDown/>} label="Scheduled interest" value={money(calc.base.totalInterest)} helper={calc.base.months+' payments'}/>
    </section>

    <section className="grid two">
      <div className="card panel">
        <div className="section-title"><div><span>PURCHASE ASSUMPTIONS</span><h2>Build your scenario</h2></div></div>
        <div className="form-grid">
          <Field label="Home price" value={price} onChange={setPrice} prefix="$" step={5000}/>
          <Field label="Down payment" value={downPct} onChange={setDownPct} suffix="%" />
          <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.125}/>
          <Field label="Loan term" value={years} onChange={setYears} suffix="years" step={5}/>
          <Field label="Property tax / year" value={taxAnnual} onChange={setTaxAnnual} prefix="$" step={100}/>
          <Field label="Insurance / year" value={insuranceAnnual} onChange={setInsuranceAnnual} prefix="$" step={100}/>
          <Field label="HOA / month" value={hoa} onChange={setHoa} prefix="$" step={10}/>
          <Field label="PMI rate / year" value={pmiRate} onChange={setPmiRate} suffix="%" step={0.1}/>
          <div className={"pmi-status "+(downPct<20?"active":"clear")}>
            <div><strong>{downPct<20?"PMI included":"No PMI estimated"}</strong><span>{downPct<20?"Because the down payment is below 20%.":"Down payment is 20% or more."}</span></div>
            <b>{downPct<20?money(calc.pmi)+"/mo":"$0/mo"}</b>
          </div>
        </div>
        <div className="slider-wrap"><div><span>Down payment explorer</span><strong>{downPct}% · {money(calc.down)}</strong></div><input className="slider" type="range" min="3" max="40" value={downPct} onChange={e=>setDownPct(Number(e.target.value))}/></div>
      </div>

      <div className="card panel">
        <div className="section-title"><div><span>MONTHLY COST</span><h2>Where the payment goes</h2></div><strong>{money(calc.totalMonthly)}/mo</strong></div>
        <ResponsiveContainer width="100%" height={310}><BarChart data={breakdown} layout="vertical" margin={{left:18,right:24}}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={v=>'$'+v}/><YAxis type="category" dataKey="name" width={126}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="value" radius={[0,8,8,0]} fill="#2c7a7b"/>
        </BarChart></ResponsiveContainer>
      </div>
    </section>

    <section className="grid two chart-grid">
      <div className="card panel compact-panel">
        <div className="section-title"><div><span>DOWN PAYMENT IMPACT</span><h2>Monthly payment vs. down payment %</h2></div></div>
        <ResponsiveContainer width="100%" height={245}>
          <LineChart data={downData} margin={{top:5,right:16,left:4,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="pct"/>
            <YAxis tickFormatter={v => `$${v}`}/>
            <Tooltip formatter={v => money(v)}/>
            <Line type="monotone" dataKey="payment" name="Monthly payment" stroke="#2563eb" strokeWidth={3} dot={{r:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card panel compact-panel">
        <div className="section-title"><div><span>CASH DOWN IMPACT</span><h2>Monthly payment vs. down payment $</h2></div></div>
        <ResponsiveContainer width="100%" height={245}>
          <LineChart data={downDollarData} margin={{top:5,right:16,left:4,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="amount" tickFormatter={v => `$${Math.round(v/1000)}k`}/>
            <YAxis tickFormatter={v => `$${v}`}/>
            <Tooltip labelFormatter={v => `Down payment: ${money(v)}`} formatter={v => money(v)}/>
            <Line type="monotone" dataKey="payment" name="Monthly payment" stroke="#7c3aed" strokeWidth={3} dot={{r:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="grid two">
      <div className="card panel">
        <div className="section-title"><div><span>EXTRA PRINCIPAL</span><h2>How much sooner can the loan end?</h2></div></div>
        <Field label="Extra payment every month" value={extraMonthly} onChange={setExtraMonthly} prefix="$" step={50}/>
        <div className="impact-grid">
          <div><span>Time saved</span><strong>{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</strong></div>
          <div><span>Interest saved</span><strong>{money(interestSaved)}</strong></div>
          <div><span>New payoff length</span><strong>{Math.floor(calc.extra.months/12)}y {calc.extra.months%12}m</strong></div>
        </div>
      </div>
      <div className="card panel">
        <div className="section-title"><div><span>BALANCE OVER TIME</span><h2>Scheduled vs. extra-payment path</h2></div></div>
        <ResponsiveContainer width="100%" height={310}><AreaChart data={yearly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'}/><Tooltip formatter={v=>money(v)}/><Legend/><Area type="monotone" dataKey="normal" name="Scheduled payment" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.48}/><Area type="monotone" dataKey="extra" name="With extra principal" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.42}/></AreaChart></ResponsiveContainer>
      </div>
    </section>

    <section className="notice"><strong>Planning estimate</strong><span>Next phases add closing costs, points, credits, loan products, PMI rules, lump-sum payments, scenario saving, Supabase accounts and Florida-specific ownership costs.</span></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
+v}/><Tooltip formatter={v=>money(v)}/><Line type="monotone" dataKey="payment" name="Monthly payment" stroke="#2563eb" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer>
      </div>
      <div className="card panel compact-panel">
        <div className="section-title"><div><span>CASH DOWN IMPACT</span><h2>Monthly payment vs. down payment $</h2></div></div>
        <ResponsiveContainer width="100%" height={245}><LineChart data={downDollarData} margin={{top:5,right:16,left:4,bottom:0}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="amount" tickFormatter={v=>'

    <section className="grid two">
      <div className="card panel">
        <div className="section-title"><div><span>EXTRA PRINCIPAL</span><h2>How much sooner can the loan end?</h2></div></div>
        <Field label="Extra payment every month" value={extraMonthly} onChange={setExtraMonthly} prefix="$" step={50}/>
        <div className="impact-grid">
          <div><span>Time saved</span><strong>{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</strong></div>
          <div><span>Interest saved</span><strong>{money(interestSaved)}</strong></div>
          <div><span>New payoff length</span><strong>{Math.floor(calc.extra.months/12)}y {calc.extra.months%12}m</strong></div>
        </div>
      </div>
      <div className="card panel">
        <div className="section-title"><div><span>BALANCE OVER TIME</span><h2>Scheduled vs. extra-payment path</h2></div></div>
        <ResponsiveContainer width="100%" height={310}><AreaChart data={yearly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'}/><Tooltip formatter={v=>money(v)}/><Legend/><Area type="monotone" dataKey="normal" name="Scheduled payment" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.48}/><Area type="monotone" dataKey="extra" name="With extra principal" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.42}/></AreaChart></ResponsiveContainer>
      </div>
    </section>

    <section className="notice"><strong>Planning estimate</strong><span>Next phases add closing costs, points, credits, loan products, PMI rules, lump-sum payments, scenario saving, Supabase accounts and Florida-specific ownership costs.</span></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
+Math.round(v/1000)+'k'}/><YAxis tickFormatter={v=>'

    <section className="grid two">
      <div className="card panel">
        <div className="section-title"><div><span>EXTRA PRINCIPAL</span><h2>How much sooner can the loan end?</h2></div></div>
        <Field label="Extra payment every month" value={extraMonthly} onChange={setExtraMonthly} prefix="$" step={50}/>
        <div className="impact-grid">
          <div><span>Time saved</span><strong>{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</strong></div>
          <div><span>Interest saved</span><strong>{money(interestSaved)}</strong></div>
          <div><span>New payoff length</span><strong>{Math.floor(calc.extra.months/12)}y {calc.extra.months%12}m</strong></div>
        </div>
      </div>
      <div className="card panel">
        <div className="section-title"><div><span>BALANCE OVER TIME</span><h2>Scheduled vs. extra-payment path</h2></div></div>
        <ResponsiveContainer width="100%" height={310}><AreaChart data={yearly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'}/><Tooltip formatter={v=>money(v)}/><Legend/><Area type="monotone" dataKey="normal" name="Scheduled payment" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.48}/><Area type="monotone" dataKey="extra" name="With extra principal" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.42}/></AreaChart></ResponsiveContainer>
      </div>
    </section>

    <section className="notice"><strong>Planning estimate</strong><span>Next phases add closing costs, points, credits, loan products, PMI rules, lump-sum payments, scenario saving, Supabase accounts and Florida-specific ownership costs.</span></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
+v}/><Tooltip labelFormatter={v=>'Down payment: '+money(v)} formatter={v=>money(v)}/><Line type="monotone" dataKey="payment" name="Monthly payment" stroke="#7c3aed" strokeWidth={3} dot={{r:4}}/></LineChart></ResponsiveContainer>
      </div>
    </section>

    <section className="grid two">
      <div className="card panel">
        <div className="section-title"><div><span>EXTRA PRINCIPAL</span><h2>How much sooner can the loan end?</h2></div></div>
        <Field label="Extra payment every month" value={extraMonthly} onChange={setExtraMonthly} prefix="$" step={50}/>
        <div className="impact-grid">
          <div><span>Time saved</span><strong>{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</strong></div>
          <div><span>Interest saved</span><strong>{money(interestSaved)}</strong></div>
          <div><span>New payoff length</span><strong>{Math.floor(calc.extra.months/12)}y {calc.extra.months%12}m</strong></div>
        </div>
      </div>
      <div className="card panel">
        <div className="section-title"><div><span>BALANCE OVER TIME</span><h2>Scheduled vs. extra-payment path</h2></div></div>
        <ResponsiveContainer width="100%" height={310}><AreaChart data={yearly}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="year"/><YAxis tickFormatter={v=>'$'+Math.round(v/1000)+'k'}/><Tooltip formatter={v=>money(v)}/><Legend/><Area type="monotone" dataKey="normal" name="Scheduled payment" stroke="#64748b" fill="#cbd5e1" fillOpacity={0.48}/><Area type="monotone" dataKey="extra" name="With extra principal" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.42}/></AreaChart></ResponsiveContainer>
      </div>
    </section>

    <section className="notice"><strong>Planning estimate</strong><span>Next phases add closing costs, points, credits, loan products, PMI rules, lump-sum payments, scenario saving, Supabase accounts and Florida-specific ownership costs.</span></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
