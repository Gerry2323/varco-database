"use strict";

const $ = (id) => document.getElementById(id);
const state = { materials: [] };
const SLOT_COUNT = 3;

function clean(value){const text=String(value??"").trim();return /^(?:|not reported|not specified|n\/?a)$/i.test(text)?"":text}
function numbers(value){return (clean(value).match(/-?\d+(?:\.\d+)?/g)||[]).map(Number).filter(Number.isFinite)}
function rangeFrom(material, direct, low, high){
  const explicitLow=numbers(material[low])[0], explicitHigh=numbers(material[high])[0];
  if(Number.isFinite(explicitLow)||Number.isFinite(explicitHigh)) return [explicitLow??explicitHigh,explicitHigh??explicitLow];
  const found=numbers(material[direct]);
  if(!found.length)return [null,null];
  return found.length>1?[Math.min(...found),Math.max(...found)]:[found[0],found[0]];
}
function midpoint(pair){return pair[0]===null?null:(pair[0]+pair[1])/2}
function field(slot,name){return slot.querySelector(`[data-field="${name}"]`)}

function slotTemplate(index){return `<article class="material-slot" data-slot="${index}">
  <h4>Material ${index+1}${index>0?" (optional)":""}</h4>
  <select class="slot-select" aria-label="Select material ${index+1}"><option value="">Select a database material</option></select>
  <div class="input-grid">
    <label>Density (g/cm³)<input data-field="density" type="number" step="any" min="0"><small data-source="density">Required</small></label>
    <label>Melting point (°C)<input data-field="melting" type="number" step="any"><small data-source="melting">Required</small></label>
    <label>Tensile strength (MPa)<input data-field="tensile" type="number" step="any" min="0"><small data-source="tensile">Required</small></label>
    <label>Specific heat (J/kg·K)<input data-field="heat" type="number" step="any" min="0"><small data-source="heat">Required; manual if absent</small></label>
    <label>Particle temperature (°C)<input data-field="temperature" type="number" step="any" value="25"><small>Estimated immediately before impact</small></label>
    <label>Particle size / D50 (µm)<input data-field="particle" type="number" step="any" min="0"><small data-source="particle">Required; range midpoint if D50 is absent</small></label>
    <label class="process-field" hidden>Impact velocity (m/s)<input data-field="impact" type="number" step="any" min="0"><small>Measured/simulated at entered distance</small></label>
    <label class="process-field" hidden>Substrate factor<input data-field="substrateFactor" type="number" step="0.01" min="0"><small>Use 1.0 only for no adjustment</small></label>
  </div>
</article>`}

function populateSlots(){
  const host=$("material-slots");host.innerHTML=Array.from({length:SLOT_COUNT},(_,i)=>slotTemplate(i)).join("");
  const sorted=[...state.materials].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  host.querySelectorAll(".material-slot").forEach(slot=>{
    const select=slot.querySelector(".slot-select");
    sorted.forEach(material=>{const option=document.createElement("option");option.value=material.id;option.textContent=`${material.name||"Unnamed"}${clean(material.supplier)?` — ${material.supplier}`:""}`;select.appendChild(option)});
    select.addEventListener("change",()=>loadMaterial(slot,select.value));
    slot.querySelectorAll("input[data-field]").forEach(input=>input.addEventListener("input",()=>{
      if(input.value!=="") input.classList.remove("missing");
      const note=slot.querySelector(`[data-source="${input.dataset.field}"]`);
      if(note&&input.value!=="") note.textContent="Manual value—verify and record source";
    }));
  });
  updateAssessmentMode();
}

function rawValue(material, names){for(const name of names){if(clean(material[name]))return material[name];if(clean(material.rawProperties?.[name]))return material.rawProperties[name]}return ""}
function setAuto(slot,name,value){const input=field(slot,name);input.value=Number.isFinite(value)?value:"";input.classList.toggle("missing",!Number.isFinite(value));const note=slot.querySelector(`[data-source="${name}"]`);if(note)note.textContent=Number.isFinite(value)?"Loaded from database":"Missing—enter documented value"}
function loadMaterial(slot,id){
  const material=state.materials.find(item=>String(item.id)===String(id));
  if(!material){["density","melting","tensile","heat","particle"].forEach(name=>setAuto(slot,name,NaN));field(slot,"temperature").value=25;return}
  setAuto(slot,"density",midpoint(rangeFrom(material,"density","densityMin","densityMax")));
  setAuto(slot,"melting",midpoint(rangeFrom(material,"meltingPoint","meltingPointMin","meltingPointMax")));
  setAuto(slot,"tensile",midpoint(rangeFrom(material,"tensileStrength","tensileStrengthMin","tensileStrengthMax")));
  const heat=numbers(rawValue(material,["specificHeat","specific_heat_j_kg_k","Specific Heat (J/kg·K)","Heat Capacity (J/kg·K)"]))[0];
  setAuto(slot,"heat",heat);
  setAuto(slot,"particle",midpoint(rangeFrom(material,"particleSizeAverage","particleSizeMin","particleSizeMax")));
  field(slot,"temperature").value=25;
}

function selectedSlotData(slot){
  const id=slot.querySelector(".slot-select").value;if(!id)return null;
  const material=state.materials.find(item=>String(item.id)===String(id));
  const value=name=>Number(field(slot,name).value);
  return {material,density:value("density"),melting:value("melting"),tensile:value("tensile"),heat:value("heat"),temperature:value("temperature"),particle:value("particle"),impact:value("impact"),substrateFactor:value("substrateFactor")};
}
function criticalVelocity(item){
  if(item.density<=0||item.tensile<=0||item.heat<=0||item.particle<=0||!Number.isFinite(item.melting)||!Number.isFinite(item.temperature)||item.melting<=item.temperature)return NaN;
  const rho=item.density*1000, sigma=item.tensile*1e6;
  const referenceTemperature=20;
  const f1=Number($("factor-f1").value), f2=Number($("factor-f2").value);
  if(!(f1>=0)||!(f2>=0)||item.melting<=referenceTemperature)return NaN;
  const thermalStrengthFactor=1-(item.temperature-referenceTemperature)/(item.melting-referenceTemperature);
  const particleSizeFactor=(item.particle/25)**-0.1;
  const energyTerm=f1*4*sigma*thermalStrengthFactor/rho+f2*item.heat*(item.melting-item.temperature);
  return energyTerm>0?particleSizeFactor*Math.sqrt(energyTerm):NaN;
}
function format(value){return `${Math.round(value).toLocaleString()} m/s`}

function calculate(){
  const items=[...document.querySelectorAll(".material-slot")].map(selectedSlotData).filter(Boolean);
  if(items.length<1){$("tool-message").textContent="Select at least one material.";$("results").hidden=true;return}
  if(new Set(items.map(item=>item.material.id)).size!==items.length){$("tool-message").textContent="Select different materials for each comparison slot.";return}
  const processMode=$("assessment-mode").value==="process";
  if(processMode&&(!(Number($("standoff-distance").value)>0)||!$("substrate-select").value)){$("tool-message").textContent="Process mode requires a standoff distance and substrate material.";return}
  if(processMode&&items.some(item=>!(item.impact>0)||!(item.substrateFactor>0))){$("tool-message").textContent="Enter a measured/simulated impact velocity and documented substrate factor for every selected powder.";return}
  const invalid=items.filter(item=>!Number.isFinite(criticalVelocity(item)));
  if(invalid.length){$("tool-message").textContent="Complete density, melting point, tensile strength, specific heat, particle temperature, and particle size for every selected material.";return}
  $("tool-message").textContent="";
  const uncertainty=Number($("uncertainty").value);
  const results=items.map(item=>{const base=criticalVelocity(item);const center=base*(processMode?item.substrateFactor:1);return {...item,base,center,low:center*(1-uncertainty),high:center*(1+uncertainty),erosion:3*center*(1-uncertainty),processMode}});
  renderResults(results);$("results").hidden=false;$("results").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderResults(results){
  const processMode=results[0]?.processMode;
  const substrateSelect=$("substrate-select");
  const processSummary=$("process-summary");
  processSummary.hidden=!processMode;
  processSummary.textContent=processMode?`Process evidence: ${$("standoff-distance").value} mm standoff; substrate: ${substrateSelect.options[substrateSelect.selectedIndex]?.textContent||"Not specified"}. Impact velocities and substrate factors are evaluated separately for each powder.`:"";
  const maximum=Math.max(...results.map(r=>r.erosion))*1.05;
  const percent=value=>Math.max(0,Math.min(100,value/maximum*100));
  $("velocity-chart").innerHTML=results.map(r=>`<div class="velocity-row"><div class="velocity-name">${r.material.name}</div><div class="velocity-track"><div class="velocity-operating" style="left:${percent(r.high)}%;width:${percent(r.erosion-r.high)}%"></div><div class="velocity-band" style="left:${percent(r.low)}%;width:${percent(r.high-r.low)}%"></div><div class="velocity-marker" style="left:${percent(r.center)}%"></div><span class="velocity-label" style="left:${percent(r.center)}%">${format(r.center)}</span></div></div>`).join("")+`<div class="chart-scale"><span>0 m/s</span><span>${format(maximum)}</span></div>`;
  const sharedLow=Math.max(...results.map(r=>r.high));
  const sharedHigh=Math.min(...results.map(r=>r.erosion));
  $("shared-window-value").textContent=results.length===1?`${format(results[0].low)} – ${format(results[0].high)}`:(sharedLow<sharedHigh?`${format(sharedLow)} – ${format(sharedHigh)}`:"No shared screening window");
  $("result-cards").innerHTML=results.map(r=>`<article class="result-card"><h4>${r.material.name}</h4><dl><dt>Base Schmidt threshold</dt><dd>${format(r.base)}</dd>${r.processMode?`<dt>Substrate-adjusted threshold</dt><dd>${format(r.center)}</dd><dt>Impact velocity</dt><dd>${format(r.impact)}</dd><dt>Velocity margin</dt><dd>${format(r.impact-r.high)}</dd><dt>Screening outcome</dt><dd>${r.impact>=r.high&&r.impact<=r.erosion?"Candidate window":"Outside candidate window"}</dd>`:""}<dt>Threshold band</dt><dd>${format(r.low)}–${format(r.high)}</dd><dt>Density</dt><dd>${r.density} g/cm³</dd><dt>Melting point</dt><dd>${r.melting} °C</dd><dt>Tensile strength</dt><dd>${r.tensile} MPa</dd><dt>Specific heat</dt><dd>${r.heat} J/kg·K</dd><dt>Particle temperature</dt><dd>${r.temperature} °C</dd><dt>Particle size</dt><dd>${r.particle>0?`${r.particle} µm`:"Not reported"}</dd></dl></article>`).join("");
}

function updateAssessmentMode(){
  const processMode=$("assessment-mode").value==="process";
  $("process-options").hidden=!processMode;
  document.querySelectorAll(".process-field").forEach(element=>element.hidden=!processMode);
}

async function initialize(){
  try{state.materials=await window.varcoApi.listMaterials();$("loaded-count").textContent=state.materials.length;populateSlots();const substrate=$("substrate-select");[...state.materials].sort((a,b)=>String(a.name).localeCompare(String(b.name))).forEach(material=>{const option=document.createElement("option");option.value=material.id;option.textContent=material.name||"Unnamed material";substrate.appendChild(option)})}
  catch(error){console.error(error);$("tool-message").textContent="Materials could not be loaded from the shared database."}
}
$("calculate-button").addEventListener("click",calculate);
$("assessment-mode").addEventListener("change",updateAssessmentMode);
$("reset-button").addEventListener("click",()=>{populateSlots();$("results").hidden=true;$("tool-message").textContent=""});
initialize();