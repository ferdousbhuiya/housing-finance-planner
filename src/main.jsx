import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Home, Landmark, PiggyBank, TrendingDown, WalletCards } from 'lucide-react';
import './styles.css';
import { monthlyPI, amortize, monthlyHousingCosts, cashToClose } from './mortgageMath.js';
import { supabase } from './supabase.js';
import AuthPanel from './AuthPanel.jsx';
import { ScenarioManager, PropertyComparison } from './ScenarioPanels.jsx';
import { PayoffAndClosing } from './PayoffAndClosing.jsx';
import AnalysisPanels from './AnalysisPanels.jsx';

const formatter = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const money=n=>formatter.format(Number.isFinite(n)?n:0);
const monthYearFromNow=months=>{
  const d=new Date();
  d.setMonth(d.getMonth()+Math.max(0,Math.round(months)));
  return d.toLocaleDateString('en-US',{month:'short',year:'numeric'});
};
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));

function Field({label,value,onChange,prefix,suffix,step=1,min=0,max=100000000}){
  return <label className="field"><span>{label}</span><div className="input-shell">
    {prefix&&<b>{prefix}</b>}<input type="number" value={value} step={step} min={min} max={max} onChange={e=>onChange(clamp(Number(e.target.value),min,max))}/>{suffix&&<b>{suffix}</b>}
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
  const [lumpSum,setLumpSum]=useState(0);
  const [closingPct,setClosingPct]=useState(3);
  const [sellerCredit,setSellerCredit]=useState(0);
  const [floodAnnual,setFloodAnnual]=useState(0);
  const [maintenancePct,setMaintenancePct]=useState(1);
  const [pointsPct,setPointsPct]=useState(0);
  const [pointsRateReduction,setPointsRateReduction]=useState(0.25);
  const [currentBalance,setCurrentBalance]=useState(0);
  const [currentRate,setCurrentRate]=useState(0);
  const [remainingYears,setRemainingYears]=useState(0);
  const [lenderFee,setLenderFee]=useState(1500);
  const [appraisalFee,setAppraisalFee]=useState(650);
  const [inspectionFee,setInspectionFee]=useState(500);
  const [titleFee,setTitleFee]=useState(1800);
  const [recordingFee,setRecordingFee]=useState(350);
  const [prepaidInterest,setPrepaidInterest]=useState(700);
  const [initialEscrow,setInitialEscrow]=useState(2500);
  const [scenarioName,setScenarioName]=useState("Scenario 1");
  const [propertyAddress,setPropertyAddress]=useState("");
  const [savedScenarios,setSavedScenarios]=useState([]);
  const [session,setSession]=useState(null);
  const [scenarioMessage,setScenarioMessage]=useState("");
  const [activeScenarioId,setActiveScenarioId]=useState(null);
  const [compareIds,setCompareIds]=useState([]);

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
  },[]);

  useEffect(()=>{
    if(!session?.user?.id){
      setSavedScenarios([]);
      setActiveScenarioId(null);
      setCompareIds([]);
      setScenarioMessage("");
      return;
    }
    if(!supabase) return;
    let active=true;
    const loadCloudScenarios=async()=>{
      const {data,error}=await supabase
        .from("housing_scenarios")
        .select("*, housing_properties(property_name,address)")
        .eq("user_id",session.user.id)
        .order("created_at",{ascending:false});
      if(!active) return;
      if(error){setScenarioMessage("Cloud loading failed: "+error.message);return;}
      const cloud=(data||[]).map(row=>({
        id:row.id,propertyId:row.property_id,name:row.scenario_name,
        address:row.housing_properties?.address||"",
        price:Number(row.home_price),downPct:Number(row.down_payment_pct),
        rate:Number(row.interest_rate),years:Number(row.loan_term_years),
        taxAnnual:Number(row.property_tax_annual),insuranceAnnual:Number(row.homeowners_insurance_annual),
        hoa:Number(row.hoa_monthly),pmiRate:Number(row.pmi_rate_annual),
        floodAnnual:Number(row.flood_wind_insurance_annual),maintenancePct:Number(row.maintenance_pct_annual),
        extraMonthly:Number(row.extra_monthly_principal),lumpSum:Number(row.lump_sum_principal),
        closingPct:Number(row.closing_cost_pct),sellerCredit:Number(row.seller_lender_credits),
        lenderFee:Number(row.lender_origination_fee),appraisalFee:Number(row.appraisal_fee),
        inspectionFee:Number(row.inspection_fee),titleFee:Number(row.title_settlement_fee),
        recordingFee:Number(row.recording_government_fee),prepaidInterest:Number(row.prepaid_interest),
        initialEscrow:Number(row.initial_escrow),monthly:Number(row.estimated_monthly_cost),
        cashToClose:Number(row.estimated_cash_to_close),interest:Number(row.estimated_total_interest),
        cloud:true
      }));
      setSavedScenarios(cloud);
      setCompareIds(cloud.slice(0,Math.min(4,cloud.length)).map(x=>x.id));
      setScenarioMessage(cloud.length?"Cloud scenarios loaded.":"No cloud scenarios saved yet.");
    };
    loadCloudScenarios();
    return()=>{active=false};
  },[session?.user?.id]);

  const calc=useMemo(()=>{
    const down=price*downPct/100, principal=Math.max(0,price-down);
    const base=amortize({principal,annualRate:rate,years});
    const extra=amortize({principal,annualRate:rate,years,extraMonthly,lumpSum});
    const housing=monthlyHousingCosts({
      principal,annualRate:rate,years,propertyTaxAnnual:taxAnnual,homeownersInsuranceAnnual:insuranceAnnual,
      floodWindInsuranceAnnual:floodAnnual,hoaMonthly:hoa,downPaymentPct:downPct,pmiRateAnnual:pmiRate,
      maintenancePctAnnual:maintenancePct,homePrice:price
    });
    const closing=cashToClose({
      homePrice:price,downPaymentPct:downPct,closingCostPct:closingPct,sellerLenderCredits:sellerCredit,
      lenderOriginationFee:lenderFee,appraisalFee,inspectionFee,titleSettlementFee:titleFee,
      recordingGovernmentFee:recordingFee,prepaidInterest,initialEscrow
    });
    return {
      down,principal,base,extra,tax:housing.tax,insurance:housing.insurance,flood:housing.floodWind,
      maintenance:housing.maintenance,pmi:housing.pmi,closingCosts:closing.fallbackClosing,
      itemizedClosing:closing.itemizedClosing,effectiveClosing:closing.effectiveClosing,
      cashToClose:closing.cashToClose,totalMonthly:housing.mortgageRelated,trueMonthly:housing.trueMonthly
    };
  },[price,downPct,rate,years,taxAnnual,insuranceAnnual,floodAnnual,hoa,pmiRate,extraMonthly,lumpSum,closingPct,sellerCredit,maintenancePct,lenderFee,appraisalFee,inspectionFee,titleFee,recordingFee,prepaidInterest,initialEscrow]);

  const downData=useMemo(()=>[5,10,15,20,25,30,35,40].map(pct=>{
    const loan=price*(1-pct/100);
    const scenarioPmi=pct<20 ? loan*(pmiRate/100)/12 : 0;
    return {pct:pct+'%',payment:Math.round(monthlyPI(loan,rate,years)+taxAnnual/12+insuranceAnnual/12+floodAnnual/12+hoa+scenarioPmi)};
  }),[price,rate,years,taxAnnual,insuranceAnnual,floodAnnual,hoa,pmiRate]);

  const downDollarData=useMemo(()=>[5,10,15,20,25,30,35,40].map(pct=>{
    const amount=price*pct/100;
    const loan=price-amount;
    const scenarioPmi=pct<20 ? loan*(pmiRate/100)/12 : 0;
    return {amount:Math.round(amount),payment:Math.round(monthlyPI(loan,rate,years)+taxAnnual/12+insuranceAnnual/12+floodAnnual/12+hoa+scenarioPmi)};
  }),[price,rate,years,taxAnnual,insuranceAnnual,floodAnnual,hoa,pmiRate]);

  const incrementalDownData=useMemo(()=>{
    const step=5000;
    const maxDown=Math.min(price*0.4, Math.max(step, price-1));
    const rows=[];
    const monthlyForDown=(downAmount)=>{
      const loan=Math.max(0,price-downAmount);
      const pct=price>0 ? downAmount/price*100 : 0;
      const scenarioPmi=pct<20 ? loan*(pmiRate/100)/12 : 0;
      return monthlyPI(loan,rate,years)+taxAnnual/12+insuranceAnnual/12+floodAnnual/12+hoa+scenarioPmi;
    };
    for(let amount=0;amount<=maxDown;amount+=step){
      const next=Math.min(amount+step,maxDown);
      if(next<=amount) break;
      const nextPayment=monthlyForDown(next);
      const currentPct=price>0 ? amount/price*100 : 0;
      const nextPct=price>0 ? next/price*100 : 0;
      rows.push({
        down:next,
        savings:Math.max(0,Math.round(monthlyForDown(amount)-nextPayment)),
        monthlyPayment:Math.round(nextPayment),
        crossesPmi:currentPct<20 && nextPct>=20,
        downPct:nextPct
      });
    }
    return rows;
  },[price,rate,years,taxAnnual,insuranceAnnual,floodAnnual,hoa,pmiRate]);

  const yearly=useMemo(()=>{
    const max=Math.max(calc.base.rows.length,calc.extra.rows.length),out=[];
    for(let i=12;i<=max;i+=12)out.push({year:i/12,normal:Math.round(calc.base.rows[Math.min(i-1,calc.base.rows.length-1)]?.balance||0),extra:Math.round(calc.extra.rows[Math.min(i-1,calc.extra.rows.length-1)]?.balance||0)});
    return out;
  },[calc]);

  const principalInterestData=useMemo(()=>{
    const out=[];
    for(let year=1;year<=years;year++){
      const slice=calc.base.rows.slice((year-1)*12,year*12);
      if(!slice.length) break;
      out.push({
        year,
        principal:Math.round(slice.reduce((a,r)=>a+r.principal,0)),
        interest:Math.round(slice.reduce((a,r)=>a+r.interest,0))
      });
    }
    return out;
  },[calc.base.rows,years]);

  const termComparison=useMemo(()=>[15,20,30].map(term=>{
    const a=amortize({principal:calc.principal,annualRate:rate,years:term});
    return {term:term+" yr",payment:Math.round(a.scheduled),interest:Math.round(a.totalInterest),total:Math.round(calc.principal+a.totalInterest)};
  }),[calc.principal,rate]);

  const rateComparison=useMemo(()=>{
    const start=Math.max(0.25,rate-1.5),out=[];
    for(let r=start;r<=rate+1.5001;r+=0.5){
      const a=amortize({principal:calc.principal,annualRate:r,years});
      out.push({rate:Number(r.toFixed(3)),payment:Math.round(a.scheduled),interest:Math.round(a.totalInterest)});
    }
    return out;
  },[calc.principal,rate,years]);

  const pointsAnalysis=useMemo(()=>{
    const pointsCost=calc.principal*(pointsPct/100);
    const reducedRate=Math.max(0,rate-pointsRateReduction);
    const reducedPayment=monthlyPI(calc.principal,reducedRate,years);
    const monthlySavings=Math.max(0,calc.base.scheduled-reducedPayment);
    const breakEven=monthlySavings>0?Math.ceil(pointsCost/monthlySavings):0;
    return {pointsCost,reducedRate,reducedPayment,monthlySavings,breakEven};
  },[calc.principal,calc.base.scheduled,pointsPct,pointsRateReduction,rate,years]);

  const extraCashComparison=useMemo(()=>{
    const cash=10000;
    const newDown=Math.min(price,calc.down+cash);
    const loan=Math.max(0,price-newDown);
    const pct=price?newDown/price*100:0;
    const pmi=pct<20?loan*(pmiRate/100)/12:0;
    const downPayment=monthlyPI(loan,rate,years)+calc.tax+calc.insurance+calc.flood+hoa+pmi;
    const afterPurchase=amortize({principal:calc.principal,annualRate:rate,years,lumpSum:cash});
    return {
      cash,
      downMonthly:downPayment,
      downMonthlySavings:Math.max(0,calc.totalMonthly-downPayment),
      afterInterestSavings:Math.max(0,calc.base.totalInterest-afterPurchase.totalInterest),
      afterMonthsSaved:Math.max(0,calc.base.months-afterPurchase.months)
    };
  },[price,calc,rate,years,pmiRate,hoa]);

  const afterPurchase=useMemo(()=>{
    if(currentBalance<=0||currentRate<=0||remainingYears<=0)return null;
    const base=amortize({principal:currentBalance,annualRate:currentRate,years:remainingYears});
    const accelerated=amortize({principal:currentBalance,annualRate:currentRate,years:remainingYears,extraMonthly,lumpSum});
    return {base,accelerated};
  },[currentBalance,currentRate,remainingYears,extraMonthly,lumpSum]);

  const pmiMilestone=useMemo(()=>{
    if(downPct>=20)return {base:0,extra:0,needed:0};
    const target=price*0.8;
    const baseRow=calc.base.rows.find(r=>r.balance<=target);
    const extraRow=calc.extra.rows.find(r=>r.balance<=target);
    return {
      base:baseRow?.month||0,
      extra:extraRow?.month||0,
      needed:Math.max(0,calc.principal-target)
    };
  },[downPct,price,calc.principal,calc.base.rows,calc.extra.rows]);

  const payoffBase=monthYearFromNow(calc.base.months);
  const payoffExtra=monthYearFromNow(calc.extra.months);

  const validationIssues=[
    ...(downPct>100?["Down payment cannot exceed 100%."]:[]),
    ...(rate<0?["Interest rate cannot be negative."]:[]),
    ...(years<=0?["Loan term must be greater than zero."]:[]),
    ...(sellerCredit>calc.down+calc.effectiveClosing?["Credits exceed estimated cash required."]:[])
  ];

  const saveScenario=async()=>{
    const name=scenarioName||("Scenario "+(savedScenarios.length+1));
    const address=propertyAddress.trim();
    const localScenario={
      id:Date.now(),name,address,price,downPct,rate,years,taxAnnual,insuranceAnnual,hoa,pmiRate,floodAnnual,maintenancePct,
      extraMonthly,lumpSum,closingPct,sellerCredit,lenderFee,appraisalFee,inspectionFee,titleFee,recordingFee,prepaidInterest,initialEscrow,
      monthly:calc.totalMonthly,cashToClose:calc.cashToClose,interest:calc.base.totalInterest
    };
    if(!supabase||!session?.user?.id){
      setScenarioMessage("Please sign in to save a scenario. Cloud scenarios are available only to the signed-in account.");
      return;
    }
    setScenarioMessage("Saving to cloud...");
    const userId=session.user.id;
    const {data:property,error:propertyError}=await supabase.from("housing_properties").insert({
      user_id:userId,property_name:name,address
    }).select("id").single();
    if(propertyError){setScenarioMessage("Cloud save failed: "+propertyError.message);return;}
    const {data:row,error}=await supabase.from("housing_scenarios").insert({
      user_id:userId,property_id:property.id,scenario_name:name,
      home_price:price,down_payment_pct:downPct,interest_rate:rate,loan_term_years:years,
      property_tax_annual:taxAnnual,homeowners_insurance_annual:insuranceAnnual,hoa_monthly:hoa,
      pmi_rate_annual:pmiRate,flood_wind_insurance_annual:floodAnnual,maintenance_pct_annual:maintenancePct,
      extra_monthly_principal:extraMonthly,lump_sum_principal:lumpSum,closing_cost_pct:closingPct,
      seller_lender_credits:sellerCredit,lender_origination_fee:lenderFee,appraisal_fee:appraisalFee,
      inspection_fee:inspectionFee,title_settlement_fee:titleFee,recording_government_fee:recordingFee,
      prepaid_interest:prepaidInterest,initial_escrow:initialEscrow,
      estimated_monthly_cost:calc.totalMonthly,estimated_cash_to_close:calc.cashToClose,
      estimated_total_interest:calc.base.totalInterest
    }).select("id").single();
    if(error){
      await supabase.from("housing_properties").delete().eq("id",property.id);
      setScenarioMessage("Cloud save failed: "+error.message);return;
    }
    setSavedScenarios(prev=>[{...localScenario,id:row.id,propertyId:property.id,cloud:true},...prev].slice(0,12));
    setScenarioMessage("Saved to cloud.");
  };
  const updateScenario=async()=>{
    if(!session?.user?.id||!activeScenarioId){setScenarioMessage("Load a cloud scenario first, then click Update.");return;}
    const sc=savedScenarios.find(x=>x.id===activeScenarioId);
    if(!sc?.cloud){setScenarioMessage("Only cloud scenarios can be updated.");return;}
    setScenarioMessage("Updating cloud scenario...");
    const {error:propertyError}=await supabase.from("housing_properties").update({
      property_name:scenarioName||"Scenario",address:propertyAddress.trim()
    }).eq("id",sc.propertyId).eq("user_id",session.user.id);
    if(propertyError){setScenarioMessage("Update failed: "+propertyError.message);return;}
    const patch={
      scenario_name:scenarioName||"Scenario",home_price:price,down_payment_pct:downPct,interest_rate:rate,loan_term_years:years,
      property_tax_annual:taxAnnual,homeowners_insurance_annual:insuranceAnnual,hoa_monthly:hoa,pmi_rate_annual:pmiRate,
      flood_wind_insurance_annual:floodAnnual,maintenance_pct_annual:maintenancePct,extra_monthly_principal:extraMonthly,
      lump_sum_principal:lumpSum,closing_cost_pct:closingPct,seller_lender_credits:sellerCredit,lender_origination_fee:lenderFee,
      appraisal_fee:appraisalFee,inspection_fee:inspectionFee,title_settlement_fee:titleFee,recording_government_fee:recordingFee,
      prepaid_interest:prepaidInterest,initial_escrow:initialEscrow,estimated_monthly_cost:calc.totalMonthly,
      estimated_cash_to_close:calc.cashToClose,estimated_total_interest:calc.base.totalInterest
    };
    const {error}=await supabase.from("housing_scenarios").update(patch).eq("id",sc.id).eq("user_id",session.user.id);
    if(error){setScenarioMessage("Update failed: "+error.message);return;}
    setSavedScenarios(prev=>prev.map(x=>x.id===sc.id?{...x,name:scenarioName||"Scenario",address:propertyAddress.trim(),price,downPct,rate,years,taxAnnual,insuranceAnnual,hoa,pmiRate,floodAnnual,maintenancePct,extraMonthly,lumpSum,closingPct,sellerCredit,lenderFee,appraisalFee,inspectionFee,titleFee,recordingFee,prepaidInterest,initialEscrow,monthly:calc.totalMonthly,cashToClose:calc.cashToClose,interest:calc.base.totalInterest}:x));
    setScenarioMessage("Cloud scenario updated.");
  };

  const duplicateScenario=async sc=>{
    if(!sc?.cloud||!session?.user?.id){setScenarioMessage("Load a cloud scenario first.");return;}
    const copyName=copyName;
    const userId=session.user.id;
    const {data:property,error:pe}=await supabase.from("housing_properties").insert({user_id:userId,property_name:copyName,address:sc.address||""}).select("id").single();
    if(pe){setScenarioMessage("Duplicate failed: "+pe.message);return;}
    const {data:source,error:se}=await supabase.from("housing_scenarios").select("*").eq("id",sc.id).eq("user_id",userId).single();
    if(se){await supabase.from("housing_properties").delete().eq("id",property.id);setScenarioMessage("Duplicate failed: "+se.message);return;}
    const {id,created_at,updated_at,property_id,...copy}=source;
    const {data:newRow,error}=await supabase.from("housing_scenarios").insert({...copy,property_id:property.id,scenario_name:copyName}).select("id").single();
    if(error){await supabase.from("housing_properties").delete().eq("id",property.id);setScenarioMessage("Duplicate failed: "+error.message);return;}
    const clone={...sc,id:newRow.id,propertyId:property.id,name:copyName};
    setSavedScenarios(prev=>[clone,...prev]);
    setCompareIds(prev=>prev.length<4?[newRow.id,...prev]:prev);
    loadScenario(clone);
    setScenarioMessage("Scenario duplicated and loaded for editing.");
  };

  const toggleCompare=id=>{
    setCompareIds(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=4){setScenarioMessage("You can compare up to 4 houses at a time.");return prev;}
      return [...prev,id];
    });
  };

  const deleteScenario=async sc=>{
    if(sc.cloud&&supabase&&session?.user?.id){
      const {error}=await supabase.from("housing_properties").delete().eq("id",sc.propertyId).eq("user_id",session.user.id);
      if(error){setScenarioMessage("Delete failed: "+error.message);return;}
    }
    setSavedScenarios(prev=>prev.filter(x=>x.id!==sc.id));
    setCompareIds(prev=>prev.filter(id=>id!==sc.id));
    if(activeScenarioId===sc.id)setActiveScenarioId(null);
    setScenarioMessage(sc.cloud?"Cloud scenario deleted.":"Local scenario deleted.");
  };
  const loadScenario=sc=>{
    setActiveScenarioId(sc.id);
    setScenarioName(sc.name);setPropertyAddress(sc.address||"");setPrice(sc.price);setDownPct(sc.downPct);setRate(sc.rate);setYears(sc.years);
    setTaxAnnual(sc.taxAnnual);setInsuranceAnnual(sc.insuranceAnnual);setHoa(sc.hoa);setPmiRate(sc.pmiRate);
    setFloodAnnual(sc.floodAnnual);setMaintenancePct(sc.maintenancePct);
    if(sc.extraMonthly!==undefined)setExtraMonthly(sc.extraMonthly);if(sc.lumpSum!==undefined)setLumpSum(sc.lumpSum);
    if(sc.closingPct!==undefined)setClosingPct(sc.closingPct);if(sc.sellerCredit!==undefined)setSellerCredit(sc.sellerCredit);
    if(sc.lenderFee!==undefined)setLenderFee(sc.lenderFee);if(sc.appraisalFee!==undefined)setAppraisalFee(sc.appraisalFee);
    if(sc.inspectionFee!==undefined)setInspectionFee(sc.inspectionFee);if(sc.titleFee!==undefined)setTitleFee(sc.titleFee);
    if(sc.recordingFee!==undefined)setRecordingFee(sc.recordingFee);if(sc.prepaidInterest!==undefined)setPrepaidInterest(sc.prepaidInterest);
    if(sc.initialEscrow!==undefined)setInitialEscrow(sc.initialEscrow);
  };

  const breakdown=[
    {name:'Principal + interest',value:Math.round(calc.base.scheduled)},
    {name:'Property tax',value:Math.round(calc.tax)},
    {name:'Insurance',value:Math.round(calc.insurance)},
    {name:'Flood / wind',value:Math.round(calc.flood)},
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
    <section className="account-bar card">
      <div><span className="account-label">CLOUD ACCOUNT</span><small>{session?"Account connected. Your saved properties sync through Supabase.":"Sign in to view and save your properties."}</small></div>
      <AuthPanel session={session} onSessionChange={setSession}/>
    </section>
    <ScenarioManager
      scenarioName={scenarioName} setScenarioName={setScenarioName}
      propertyAddress={propertyAddress} setPropertyAddress={setPropertyAddress}
      saveScenario={saveScenario} updateScenario={updateScenario}
      activeScenarioId={activeScenarioId} savedScenarios={savedScenarios}
      loadScenario={loadScenario} duplicateScenario={duplicateScenario}
      deleteScenario={deleteScenario} scenarioMessage={scenarioMessage} money={money}
    />

    <PropertyComparison
      savedScenarios={savedScenarios} compareIds={compareIds}
      toggleCompare={toggleCompare} money={money}
    />

    <section className="metrics">
      <Metric icon={<Landmark/>} label="Loan amount" value={money(calc.principal)} helper={downPct+'% down'}/>
      <Metric icon={<WalletCards/>} label="Monthly housing cost" value={money(calc.totalMonthly)} helper="P&I + tax + insurance + HOA + PMI"/>
      <Metric icon={<PiggyBank/>} label="Est. cash to close" value={money(calc.cashToClose)} helper={money(calc.down)+" down + costs − credits"}/>
      <Metric icon={<TrendingDown/>} label="Scheduled interest" value={money(calc.base.totalInterest)} helper={calc.base.months+' payments'}/>
    </section>

    <section className="grid two">
      <div className="card panel section-inputs">
        <div className="section-title"><div><span>PURCHASE ASSUMPTIONS</span><h2>Build your scenario</h2></div></div>
        <div className="form-grid">
          <Field label="Home price" value={price} onChange={setPrice} prefix="$" step={5000}/>
          <Field label="Down payment" value={downPct} onChange={setDownPct} suffix="%" max={100}/>
          <Field label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.125} max={30}/>
          <Field label="Loan term" value={years} onChange={setYears} suffix="years" step={5} min={1} max={50}/>
          <Field label="Property tax / year" value={taxAnnual} onChange={setTaxAnnual} prefix="$" step={100}/>
          <Field label="Insurance / year" value={insuranceAnnual} onChange={setInsuranceAnnual} prefix="$" step={100}/>
          <Field label="HOA / month" value={hoa} onChange={setHoa} prefix="$" step={10}/>
          <Field label="Flood / wind insurance / year" value={floodAnnual} onChange={setFloodAnnual} prefix="$" step={100}/>
          <Field label="Maintenance reserve / year" value={maintenancePct} onChange={setMaintenancePct} suffix="% of value" step={0.25}/>
          <Field label="PMI rate / year" value={pmiRate} onChange={setPmiRate} suffix="%" step={0.1}/>
          <div className={"pmi-status "+(downPct<20?"active":"clear")}>
            <div><strong>{downPct<20?"PMI included":"No PMI estimated"}</strong><span>{downPct<20?"Because the down payment is below 20%.":"Down payment is 20% or more."}</span></div>
            <b>{downPct<20?money(calc.pmi)+"/mo":"$0/mo"}</b>
          </div>
        </div>
        <div className="slider-wrap"><div><span>Down payment explorer</span><strong>{downPct}% · {money(calc.down)}</strong></div><input className="slider" type="range" min="3" max="40" value={downPct} onChange={e=>setDownPct(Number(e.target.value))}/></div>
        {downPct<20&&<div className="pmi-milestone"><span>Estimated PMI threshold balance: <b>{money(price*0.8)}</b></span><span>Scheduled: <b>{pmiMilestone.base?monthYearFromNow(pmiMilestone.base):"N/A"}</b></span><span>With extra payments: <b>{pmiMilestone.extra?monthYearFromNow(pmiMilestone.extra):"N/A"}</b></span></div>}
        {validationIssues.length>0&&<div className="validation-box">{validationIssues.map((x,i)=><span key={i}>{x}</span>)}</div>}
      </div>

      <div className="card panel section-cost">
        <div className="section-title"><div><span>MONTHLY COST</span><h2>Where the payment goes</h2></div><strong>{money(calc.totalMonthly)}/mo</strong></div>
        <ResponsiveContainer width="100%" height={230}><BarChart data={breakdown} layout="vertical" margin={{left:18,right:24}}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={v=>'$'+v}/><YAxis type="category" dataKey="name" width={126}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="value" radius={[0,8,8,0]} fill="#2c7a7b"/>
        </BarChart></ResponsiveContainer>
        <div className="cost-strip"><span>Mortgage-related monthly cost <b>{money(calc.totalMonthly)}</b></span><span>+ maintenance reserve <b>{money(calc.maintenance)}</b></span><strong>True planning cost {money(calc.trueMonthly)}</strong></div>
      </div>
    </section>

    <section className="grid two chart-grid">
      <div className="card panel compact-panel section-blue">
        <div className="section-title"><div><span>DOWN PAYMENT IMPACT</span><h2>Monthly payment vs. down payment %</h2></div></div>
        <ResponsiveContainer width="100%" height={205}>
          <LineChart data={downData} margin={{top:5,right:16,left:4,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="pct"/>
            <YAxis tickFormatter={v => `$${v}`}/>
            <Tooltip formatter={v => money(v)}/>
            <Line type="monotone" dataKey="payment" name="Monthly payment" stroke="#2563eb" strokeWidth={3} dot={{r:4}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card panel compact-panel section-purple">
        <div className="section-title"><div><span>CASH DOWN IMPACT</span><h2>Monthly payment vs. down payment $</h2></div></div>
        <ResponsiveContainer width="100%" height={205}>
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

    <section className="card panel compact-panel incremental-card section-savings">
      <div className="section-title">
        <div><span>EXTRA DOWN PAYMENT VALUE</span><h2>Monthly payment reduction for each additional $5,000 down</h2></div>
        <small>Includes the PMI change when a step crosses 20% down</small>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={incrementalDownData} margin={{top:4,right:12,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey="down" tickFormatter={v => "$"+Math.round(v/1000)+"k"}/>
          <YAxis tickFormatter={v => "$"+v}/>
          <Tooltip
            labelFormatter={(v,payload) => {
              const row=payload?.[0]?.payload;
              return row ? "Down payment: "+money(v)+" ("+row.downPct.toFixed(1)+"%)" : "Down payment: "+money(v);
            }}
            formatter={(v,name,item) => {
              const row=item?.payload;
              if(name==="Monthly payment reduction") return [money(v)+"/mo","Reduction from prior $5,000 step"];
              return [money(v)+"/mo",name];
            }}
            content={({active,payload,label})=>{
              if(!active||!payload?.length)return null;
              const row=payload[0].payload;
              return <div className="custom-tooltip">
                <strong>Down payment: {money(label)} ({row.downPct.toFixed(1)}%)</strong>
                <span>Monthly payment: <b>{money(row.monthlyPayment)}/mo</b></span>
                <span>Reduction from prior $5,000: <b>{money(row.savings)}/mo</b></span>
                {row.crossesPmi&&<em>20% reached · estimated PMI removed</em>}
              </div>
            }}
          />
          <Bar dataKey="savings" name="Monthly payment reduction" radius={[5,5,0,0]}>
            {incrementalDownData.map((row,index)=><Cell key={index} fill={row.crossesPmi?"#e11d48":row.downPct<20?"#0f766e":"#2563eb"}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="threshold-legend">
        <span><i className="dot below"></i>Below 20% down</span>
        <span><i className="dot threshold"></i>20% PMI-removal step</span>
        <span><i className="dot above"></i>20%+ down</span>
      </div>
    </section>

    <PayoffAndClosing
      Field={Field} extraMonthly={extraMonthly} setExtraMonthly={setExtraMonthly}
      lumpSum={lumpSum} setLumpSum={setLumpSum} payoffBase={payoffBase} payoffExtra={payoffExtra}
      monthsSaved={monthsSaved} interestSaved={interestSaved} calc={calc} yearly={yearly} money={money}
      closingPct={closingPct} setClosingPct={setClosingPct} sellerCredit={sellerCredit} setSellerCredit={setSellerCredit}
      lenderFee={lenderFee} setLenderFee={setLenderFee} appraisalFee={appraisalFee} setAppraisalFee={setAppraisalFee}
      inspectionFee={inspectionFee} setInspectionFee={setInspectionFee} titleFee={titleFee} setTitleFee={setTitleFee}
      recordingFee={recordingFee} setRecordingFee={setRecordingFee} prepaidInterest={prepaidInterest} setPrepaidInterest={setPrepaidInterest}
      initialEscrow={initialEscrow} setInitialEscrow={setInitialEscrow}
    />

    <AnalysisPanels
      Field={Field} principalInterestData={principalInterestData} termComparison={termComparison}
      rateComparison={rateComparison} pointsPct={pointsPct} setPointsPct={setPointsPct}
      pointsRateReduction={pointsRateReduction} setPointsRateReduction={setPointsRateReduction}
      pointsAnalysis={pointsAnalysis} extraCashComparison={extraCashComparison}
      currentBalance={currentBalance} setCurrentBalance={setCurrentBalance}
      currentRate={currentRate} setCurrentRate={setCurrentRate}
      remainingYears={remainingYears} setRemainingYears={setRemainingYears}
      afterPurchase={afterPurchase} money={money}
    />

    <section className="card panel compact-panel amort-card section-amort">
      <div className="section-title"><div><span>AMORTIZATION SNAPSHOT</span><h2>How principal takes over from interest</h2></div><small>Selected yearly checkpoints</small></div>
      <div className="table-wrap"><table><thead><tr><th>Year</th><th>Annual principal</th><th>Annual interest</th><th>Ending balance</th></tr></thead><tbody>
        {[1,5,10,15,20,25,years].filter((v,i,a)=>v<=years&&a.indexOf(v)===i).map(y=>{
          const end=Math.min(y*12,calc.base.rows.length), start=Math.max(0,end-12), slice=calc.base.rows.slice(start,end);
          const principalPaid=slice.reduce((a,r)=>a+r.principal,0), interestPaid=slice.reduce((a,r)=>a+r.interest,0), balance=calc.base.rows[end-1]?.balance||0;
          return <tr key={y}><td>Year {y}</td><td>{money(principalPaid)}</td><td>{money(interestPaid)}</td><td>{money(balance)}</td></tr>
        })}
      </tbody></table></div>
    </section>

    <section className="notice"><strong>Planning estimate</strong><span>Planning estimates are editable. PMI, taxes, insurance, maintenance and closing costs vary by property, borrower and lender. Saved scenarios, authentication and lender-product rules will be connected in the persistence phase.</span></section>
  </main>
}
createRoot(document.getElementById('root')).render(<App/>);
