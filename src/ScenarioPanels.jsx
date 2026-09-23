import React from 'react';

export function ScenarioManager({
  scenarioName, setScenarioName, propertyAddress, setPropertyAddress,
  saveScenario, updateScenario, activeScenarioId, savedScenarios,
  loadScenario, duplicateScenario, deleteScenario, scenarioMessage, money
}){
  return <section className="scenario-bar card">
    <div className="scenario-save">
      <input value={scenarioName} onChange={e=>setScenarioName(e.target.value)} aria-label="Scenario name" placeholder="Scenario name"/>
      <input className="address-input" value={propertyAddress} onChange={e=>setPropertyAddress(e.target.value)} aria-label="Property address" placeholder="House address"/>
      <button onClick={saveScenario}>Save new</button>
      <button className="secondary update-scenario-btn" onClick={updateScenario} disabled={!activeScenarioId}>{activeScenarioId?"Update / Rename":"Load a house to update"}</button>
      <button className="secondary" onClick={()=>window.print()}>Print / Export PDF</button>
    </div>
    <div className="saved-list">
      {savedScenarios.length?savedScenarios.map(sc=><div className={"saved-scenario "+(activeScenarioId===sc.id?"loaded":"")} key={sc.id}>
        <button onClick={()=>loadScenario(sc)} title={"Load "+sc.name}>{sc.name}<small>{sc.address||"No address"} · {money(sc.monthly)}/mo{sc.cloud?" · Cloud":""}</small></button>
        <div className="scenario-actions">
          <button className="mini-action" onClick={()=>loadScenario(sc)} title="Load this scenario for editing">Edit</button>
          <button className="mini-action" onClick={()=>duplicateScenario(sc)} title="Duplicate">Copy</button>
          <button className="scenario-delete" onClick={()=>deleteScenario(sc)} title={"Delete "+sc.name} aria-label={"Delete "+sc.name}>×</button>
        </div>
      </div>):<span>No saved scenarios yet</span>}
    </div>
    {activeScenarioId&&<div className="editing-message">Editing: <b>{savedScenarios.find(x=>x.id===activeScenarioId)?.name||"loaded scenario"}</b> — change the name, address, or values above, then click <b>Update / Rename</b>.</div>}
    {scenarioMessage&&<div className="scenario-message">{scenarioMessage}</div>}
  </section>;
}

export function PropertyComparison({savedScenarios,compareIds,toggleCompare,money}){
  if(savedScenarios.length<=1)return null;
  const selected=savedScenarios.filter(sc=>compareIds.includes(sc.id));
  return <section className="card panel compact-panel property-compare section-blue">
    <div className="section-title"><div><span>HOUSE-TO-HOUSE COMPARISON</span><h2>Select 2–4 saved properties</h2></div><small>{compareIds.length}/4 selected</small></div>
    <div className="compare-picker">{savedScenarios.map(sc=><label key={sc.id}><input type="checkbox" checked={compareIds.includes(sc.id)} onChange={()=>toggleCompare(sc.id)}/><span>{sc.name}</span></label>)}</div>
    {compareIds.length>=2?<div className="property-compare-grid">{selected.map(sc=><div className="property-compare-card" key={sc.id}>
      <strong>{sc.name}</strong><span className="property-address">{sc.address||"Address not entered"}</span>
      <div><span>Price</span><b>{money(sc.price)}</b></div><div><span>Down</span><b>{sc.downPct}%</b></div>
      <div><span>Rate</span><b>{sc.rate}%</b></div><div><span>Monthly</span><b>{money(sc.monthly)}</b></div>
      <div><span>Cash to close</span><b>{money(sc.cashToClose)}</b></div><div><span>Total interest</span><b>{money(sc.interest)}</b></div>
    </div>)}</div>:<div className="compare-hint">Select at least 2 houses to compare.</div>}
  </section>;
}
