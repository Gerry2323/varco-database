"use strict";

/* =========================================================
   BROWSER STORAGE SETTINGS

   Keep these names synchronized with the CSV Files page and
   the Material Details image uploader. Changing a name here
   would make this page look in a different browser database.
   ========================================================= */

const FILE_DB_NAME = "varcoFileDatabase";
const FILE_STORE_NAME = "files";
const IMAGE_DB_NAME = "varcoMaterialImages";
const IMAGE_STORE_NAME = "images";
const COMPARE_KEY = "varcoComparisonMaterials";

/* =========================================================
   CSV COLUMN ALIASES

   Add a new spelling here when a spreadsheet uses a different
   heading for an existing material property.
   ========================================================= */

const aliases = {
  name: ["Material Name", "Name", "Material", "Powder Name", "Material Designation", "Feedstock Name"],
  category: ["Category", "Material Category", "Classification", "Class"],
  composition: [
    "Composition as Reported",
    "Composition",
    "Chemical Composition",
  ],
  compositionBasis: ["Composition Basis"],
  manufacturingMethods: ["Manufacturing Methods", "Manufacturing Method"],
  feedstockForm: ["Feedstock Form", "Form"],
  particleSizeMin: [
    "Particle Size Min (µm)",
    "Particle Size Min",
    "Minimum Particle Size",
  ],
  particleSizeMax: [
    "Particle Size Max (µm)",
    "Particle Size Max",
    "Maximum Particle Size",
  ],
  particleSizeAverage: [
    "Particle Size Average (µm)",
    "Particle Size Average",
    "D50",
  ],
  particleSizeReported: ["Particle Size Range Reported", "Particle Size as Reported", "particle_size_range_reported"],
  morphology: ["Morphology", "Morphologies", "Particle Morphology"],
  apparentDensity: ["Apparent Density (g/cm³)", "Apparent Density"],
  density: ["Density (g/cm³)", "Density", "Material Density"],
  densityMin: ["Density Min (g/cm³)", "Density Minimum (g/cm³)", "density_min_g_cm3"],
  densityMax: ["Density Max (g/cm³)", "Density Maximum (g/cm³)", "density_max_g_cm3"],
  densityReported: ["Density Value Reported", "Density as Reported", "density_value_reported"],
  porosity: ["Porosity (%)", "Porosity"],
  hardnessValue: ["Hardness Value", "Hardness"],
  hardnessScaleLoad: ["Hardness Scale and Load", "Hardness Scale"],
  youngsModulus: [
    "Young's Modulus (GPa)",
    "Young’s Modulus (GPa)",
    "Youngs Modulus",
    "Young's Modulus",
  ],
  youngsModulusMin: ["Young's Modulus Min (GPa)", "Young’s Modulus Min (GPa)", "youngs_modulus_min_gpa", "young_modulus_min_gpa"],
  youngsModulusMax: ["Young's Modulus Max (GPa)", "Young’s Modulus Max (GPa)", "youngs_modulus_max_gpa", "young_modulus_max_gpa"],
  youngsModulusReported: ["Young's Modulus as Reported", "youngs_modulus_as_reported"],
  tensileStrength: ["Tensile Strength (MPa)", "Tensile Strength"],
  tensileStrengthMin: ["Tensile Strength Min (MPa)", "tensile_strength_min_mpa"],
  tensileStrengthMax: ["Tensile Strength Max (MPa)", "tensile_strength_max_mpa"],
  meltingPoint: ["Melting Point (°C)", "Melting Point"],
  meltingPointMin: ["Melting Point Min (°C)", "Melting Temperature Min (°C)", "melting_point_min_c"],
  meltingPointMax: ["Melting Point Max (°C)", "Melting Temperature Max (°C)", "melting_point_max_c"],
  meltingPointReported: ["Melting Point Reported", "Melting Point as Reported", "Melting Temperature as Reported", "melting_point_reported", "melting_temperature_as_reported"],
  yieldStressMin: ["Yield Stress Min (MPa)", "yield_stress_min_mpa"],
  yieldStressMax: ["Yield Stress Max (MPa)", "yield_stress_max_mpa"],
  compressiveStrengthMin: ["Compressive Strength Min (MPa)", "compressive_strength_min_mpa"],
  compressiveStrengthMax: ["Compressive Strength Max (MPa)", "compressive_strength_max_mpa"],
  fractureToughnessMin: ["Fracture Toughness Min (MPa·m^0.5)", "fracture_toughness_min_mpa_m05", "fracture_toughness_min_mpa_sqrt_m"],
  fractureToughnessMax: ["Fracture Toughness Max (MPa·m^0.5)", "fracture_toughness_max_mpa_m05", "fracture_toughness_max_mpa_sqrt_m"],
  softeningTemperatureMin: ["Softening Temperature Min (°C)", "Glass Transition / Softening Min (°C)", "glass_transition_softening_min_c", "softening_temperature_min_c"],
  softeningTemperatureMax: ["Softening Temperature Max (°C)", "Glass Transition / Softening Max (°C)", "glass_transition_softening_max_c", "softening_temperature_max_c"],
  crystalStructure: ["Crystal Structure at 20°C", "Crystal Structure", "crystal_structure_20c"],
  classification: ["Classification", "classification"],
  applications: ["Applications", "Intended Applications", "applications"],
  supplier: ["Supplier", "Manufacturer"],
  productName: ["Product Name"],
  sprayProcesses: ["Recommended Spray Processes", "Recommended Spray Process", "Spray Processes", "spray_processes"],
  sourceType: ["Source Type", "Source", "Data Source Group", "data_source_group"],
  dataQualityStatus: [
    "Data Quality Status",
    "Verification Status",
    "Quality Status",
    "Evidence Class",
    "evidence_class",
  ],
  sourceTitle: ["Source Title", "Reference", "Citation", "Article Title"],
  sourceFilename: ["Source Filename", "Reference Filename", "CSV File", "Source File", "source_file"],
  parentMaterial: ["Parent Material", "parent_material", "Material Family"],
  productCode: ["Product Code", "product_code", "Product ID"],
  dataSourceGroup: ["Data Source Group", "data_source_group", "Source Group"],
  powderFamily: ["Powder Family", "powder_family"],
  maxServiceTemperature: ["Maximum Service Temperature (°C)", "Max Service Temp (°C)", "max_service_temp_c"],
  flammabilityRating: ["Flammability Rating", "flammability_rating"],
  freshWaterRating: ["Fresh Water Rating", "fresh_water_rating"],
  saltWaterRating: ["Salt Water Rating", "salt_water_rating"],
  sunlightUvRating: ["Sunlight / UV Rating", "Sunlight UV Rating", "sunlight_uv_rating"],
  wearResistanceRating: ["Wear Resistance Rating", "wear_resistance_rating"],
  environmentRatingScale: ["Environmental Rating Scale", "Environment Rating Scale", "environment_rating_scale"],
  documentLink: [
    "Document Link",
    "Source Link",
    "Reference Link",
    "DOI or URL",
    "URL",
    "Source URL",
    "source_url",
  ],
  dateAdded: ["Date Added"],
};

/* =========================================================
   PAGE STATE AND HTML CONTROLS
   ========================================================= */

const state = {
  materials: [],
  filtered: [],
  selected: new Set(readComparison()),
};
const $ = (id) => document.getElementById(id);
const controls = {
  search: $("selector-search"),
  category: $("selector-category"),
  feedstock: $("selector-feedstock"),
  basis: $("selector-composition-basis"),
  method: $("selector-method"),
  morphology: $("selector-morphology"),
  supplier: $("selector-supplier"),
  sprayProcess: $("selector-spray-process"),
  sourceType: $("selector-source-type"),
  quality: $("selector-quality"),
  particleMin: $("particle-filter-min"),
  particleMax: $("particle-filter-max"),
  particleUnit: $("particle-filter-unit"),
  densityMin: $("density-filter-min"),
  densityMax: $("density-filter-max"),
  densityUnit: $("density-filter-unit"),
  hardnessMin: $("hardness-filter-min"),
  hardnessMax: $("hardness-filter-max"),
  modulusMin: $("modulus-filter-min"),
  modulusMax: $("modulus-filter-max"),
  modulusUnit: $("modulus-filter-unit"),
  porosityMin: $("porosity-filter-min"),
  porosityMax: $("porosity-filter-max"),
  tensileMin: $("tensile-filter-min"),
  tensileMax: $("tensile-filter-max"),
  tensileUnit: $("tensile-filter-unit"),
  meltingMin: $("melting-filter-min"),
  meltingMax: $("melting-filter-max"),
  meltingUnit: $("melting-filter-unit"),
  sort: $("selector-sort"),
};

/* Add newer range filters without requiring a replacement HTML file. */
function addRangeControl(id, label, unit, options = [["mpa", "MPa"], ["gpa", "GPa"], ["pa", "Pa"]]) {
  const stack = document.querySelector(".filter-stack");
  if (!stack || $(`${id}-filter-min`)) return;
  const fieldset = document.createElement("fieldset");
  fieldset.className = "range-filter";
  const legend = document.createElement("legend");
  legend.textContent = label;
  const row = document.createElement("div");
  row.className = "range-controls";
  const makeNumber = (which) => {
    const wrapper = document.createElement("label");
    wrapper.append(document.createTextNode(which === "min" ? "Minimum" : "Maximum"));
    const input = document.createElement("input");
    input.id = `${id}-filter-${which}`;
    input.type = "number";
    input.step = "any";
    input.placeholder = which === "min" ? "Min" : "Max";
    wrapper.appendChild(input);
    return wrapper;
  };
  row.append(makeNumber("min"), makeNumber("max"));
  if (unit) {
    const wrapper = document.createElement("label");
    wrapper.className = "unit-field";
    wrapper.append(document.createTextNode("Unit"));
    const select = document.createElement("select");
    select.id = `${id}-filter-unit`;
    options.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    wrapper.appendChild(select);
    row.appendChild(wrapper);
  }
  fieldset.append(legend, row);
  stack.appendChild(fieldset);
}

addRangeControl("yield", "Yield Strength", "mpa");
addRangeControl("compressive", "Compressive Strength", "mpa");
addRangeControl("fracture", "Fracture Toughness", "mpasqrtm", [["mpasqrtm", "MPa·√m"]]);
addRangeControl("softening", "Softening Temperature", "c", [["c", "°C"], ["k", "K"], ["f", "°F"]]);
addRangeControl("service-temperature", "Maximum Service Temperature", "c", [["c", "°C"], ["k", "K"], ["f", "°F"]]);
Object.assign(controls, {
  yieldMin: $("yield-filter-min"), yieldMax: $("yield-filter-max"), yieldUnit: $("yield-filter-unit"),
  compressiveMin: $("compressive-filter-min"), compressiveMax: $("compressive-filter-max"), compressiveUnit: $("compressive-filter-unit"),
  fractureMin: $("fracture-filter-min"), fractureMax: $("fracture-filter-max"), fractureUnit: $("fracture-filter-unit"),
  softeningMin: $("softening-filter-min"), softeningMax: $("softening-filter-max"), softeningUnit: $("softening-filter-unit"),
  serviceTemperatureMin: $("service-temperature-filter-min"), serviceTemperatureMax: $("service-temperature-filter-max"), serviceTemperatureUnit: $("service-temperature-filter-unit"),
});

/* =========================================================
   SMALL DATA-CLEANING HELPERS
   ========================================================= */

function clean(value) {
  const text = String(value ?? "").trim();
  return text && !/^not (reported|specified)\b/i.test(text) ? text : "";
}
function key(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function list(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value).split(/[;|,]/).map(clean).filter(Boolean);
}
function number(value) {
  const match = String(value ?? "")
    .replace(/,/g, "")
    .match(/-?\d*\.?\d+(?:e[+-]?\d+)?/i);
  return match ? Number(match[0]) : null;
}
function readComparison() {
  try {
    const value = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function saveComparison() {
  localStorage.setItem(COMPARE_KEY, JSON.stringify([...state.selected]));
}

// Read materials entered through the Add New Material form.
function manualMaterials() {
  try {
    const parsed = JSON.parse(localStorage.getItem("varcoMaterials") || "[]");
    return Array.isArray(parsed)
      ? parsed.map((m, i) => ({
          ...m,
          id: m.id || `manual:${i}`,
          origin: "manual",
        }))
      : [];
  } catch {
    return [];
  }
}
function valueFromRow(headers, row, field) {
  const accepted = (aliases[field] || []).map(key);
  const index = headers.findIndex((header) => accepted.includes(key(header)));
  return index >= 0 ? clean(row[index]) : "";
}
function preserveCompleteRow(headers, row) {
  const complete = {};
  headers.forEach((header, index) => {
    const heading = clean(header);
    const value = clean(row[index]);
    if (heading && value) complete[heading] = value;
  });
  return complete;
}
function openDatabase(name, version, onUpgrade) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => onUpgrade?.(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* =========================================================
   LOAD CSV/XLSX MATERIALS AND MATERIAL IMAGES
   ========================================================= */

async function spreadsheetMaterials() {
  try {
    const db = await openDatabase(FILE_DB_NAME, 1, (d) => {
      if (!d.objectStoreNames.contains(FILE_STORE_NAME))
        d.createObjectStore(FILE_STORE_NAME, { keyPath: "id" });
    });
    const files = await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE_NAME, "readonly");
      const req = tx.objectStore(FILE_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const records = [];
    files.forEach((file) => {
      const rows = Array.isArray(file.rows) ? file.rows : [];
      if (rows.length < 2) return;
      const headers = rows[0];
      rows.slice(1).forEach((row, index) => {
        const name = valueFromRow(headers, row, "name");
        if (!name) return;
        const record = {
          id: `csv:${file.id}:${index + 1}`,
          name,
          origin: "csv",
          dateAdded: file.dateAdded,
          importedFields: preserveCompleteRow(headers, row),
        };
        Object.assign(record, record.importedFields);
        Object.keys(aliases).forEach((field) => {
          if (field !== "name")
            record[field] = valueFromRow(headers, row, field);
        });
        record.manufacturingMethods = list(record.manufacturingMethods);
        record.density = record.density || record.densityReported;
        record.youngsModulus = record.youngsModulus || record.youngsModulusReported;
        record.meltingPoint = record.meltingPoint || record.meltingPointReported;
        if ((!record.particleSizeMin || !record.particleSizeMax) && record.particleSizeReported) {
          const values = clean(record.particleSizeReported).match(/-?\d+(?:\.\d+)?/g) || [];
          if (!record.particleSizeMin && values[0]) record.particleSizeMin = values[0];
          if (!record.particleSizeMax && values[1]) record.particleSizeMax = values[1];
        }
        if (!record.sourceTitle) record.sourceTitle = file.name;
        if (!record.sourceFilename) record.sourceFilename = file.name;
        records.push(record);
      });
    });
    return records;
  } catch (error) {
    console.error("Spreadsheet materials could not be loaded.", error);
    return [];
  }
}
async function firstImages() {
  const map = new Map();
  try {
    const db = await openDatabase(IMAGE_DB_NAME, 1, (d) => {
      if (!d.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        const store = d.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
        store.createIndex("materialId", "materialId", { unique: false });
      }
    });
    const images = await new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, "readonly");
      const req = tx.objectStore(IMAGE_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    images
      .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
      .forEach((image) => {
        if (!map.has(image.materialId)) map.set(image.materialId, image.file);
      });
  } catch (error) {
    console.error("Material images could not be loaded.", error);
  }
  return map;
}

/* =========================================================
   BUILD FILTER OPTIONS
   ========================================================= */

function unique(field, isList = false) {
  return [
    ...new Set(
      state.materials
        .flatMap((m) => (isList ? list(m[field]) : [clean(m[field])]))
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}
function fillSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}
function selectedList(value, selected) {
  return (
    !selected ||
    list(value).some((item) => item.toLowerCase() === selected.toLowerCase())
  );
}

/* =========================================================
   UNIT CONVERSION AND RANGE MATCHING

   Database base units: particle size = µm, density = g/cm³,
   modulus = GPa, tensile strength = MPa, temperature = °C.
   User-entered limits are converted to those units first.
   ========================================================= */

function convert(value, unit, type) {
  if (value === null) return null;
  if (type === "particle")
    return unit === "mm" ? value * 1000 : unit === "nm" ? value / 1000 : value;
  if (type === "density") return unit === "kgm3" ? value / 1000 : value;
  if (type === "modulus")
    return unit === "mpa" ? value / 1000 : unit === "pa" ? value / 1e9 : value;
  if (type === "tensile")
    return unit === "gpa" ? value * 1000 : unit === "pa" ? value / 1e6 : value;
  if (type === "temperature")
    return unit === "k"
      ? value - 273.15
      : unit === "f"
        ? ((value - 32) * 5) / 9
        : value;
  return value;
}
function rangeMatches(materialMin, materialMax, wantedMin, wantedMax) {
  if (wantedMin === null && wantedMax === null) return true;
  if (materialMin === null && materialMax === null) return false;
  const low = materialMin ?? materialMax,
    high = materialMax ?? materialMin;
  return (
    (wantedMin === null || high >= wantedMin) &&
    (wantedMax === null || low <= wantedMax)
  );
}
function queryRange(minControl, maxControl, unitControl, type) {
  return [
    convert(number(minControl.value), unitControl?.value, type),
    convert(number(maxControl.value), unitControl?.value, type),
  ];
}

/* =========================================================
   APPLY ALL ACTIVE FILTERS AND SORT THE RESULTS
   ========================================================= */

function applyFilters() {
  const query = controls.search.value.trim().toLowerCase();
  const [particleMin, particleMax] = queryRange(
    controls.particleMin,
    controls.particleMax,
    controls.particleUnit,
    "particle",
  );
  const [densityMin, densityMax] = queryRange(
    controls.densityMin,
    controls.densityMax,
    controls.densityUnit,
    "density",
  );
  const hardnessMin = number(controls.hardnessMin.value),
    hardnessMax = number(controls.hardnessMax.value);
  const [modulusMin, modulusMax] = queryRange(
    controls.modulusMin,
    controls.modulusMax,
    controls.modulusUnit,
    "modulus",
  );
  const porosityMin = number(controls.porosityMin.value),
    porosityMax = number(controls.porosityMax.value);
  const [tensileMin, tensileMax] = queryRange(
    controls.tensileMin,
    controls.tensileMax,
    controls.tensileUnit,
    "tensile",
  );
  const [meltingMin, meltingMax] = queryRange(
    controls.meltingMin,
    controls.meltingMax,
    controls.meltingUnit,
    "temperature",
  );
  const [yieldMin, yieldMax] = queryRange(controls.yieldMin, controls.yieldMax, controls.yieldUnit, "tensile");
  const [compressiveMin, compressiveMax] = queryRange(controls.compressiveMin, controls.compressiveMax, controls.compressiveUnit, "tensile");
  const fractureMin = number(controls.fractureMin.value),
    fractureMax = number(controls.fractureMax.value);
  const [softeningMin, softeningMax] = queryRange(controls.softeningMin, controls.softeningMax, controls.softeningUnit, "temperature");
  const [serviceMin, serviceMax] = queryRange(controls.serviceTemperatureMin, controls.serviceTemperatureMax, controls.serviceTemperatureUnit, "temperature");
  state.filtered = state.materials.filter(
    (m) =>
      (!query ||
        Object.values(m).flat().join(" ").toLowerCase().includes(query)) &&
      (!controls.category.value ||
        clean(m.category) === controls.category.value) &&
      (!controls.feedstock.value ||
        clean(m.feedstockForm) === controls.feedstock.value) &&
      (!controls.basis.value ||
        clean(m.compositionBasis) === controls.basis.value) &&
      selectedList(m.manufacturingMethods, controls.method.value) &&
      selectedList(m.morphology, controls.morphology.value) &&
      (!controls.supplier.value ||
        clean(m.supplier) === controls.supplier.value) &&
      selectedList(m.sprayProcesses, controls.sprayProcess.value) &&
      (!controls.sourceType.value ||
        clean(m.sourceType) === controls.sourceType.value) &&
      (!controls.quality.value ||
        clean(m.dataQualityStatus) === controls.quality.value) &&
      rangeMatches(
        number(m.particleSizeMin),
        number(m.particleSizeMax),
        particleMin,
        particleMax,
      ) &&
      rangeMatches(
        number(m.densityMin) ?? number(m.density) ?? number(m.apparentDensity),
        number(m.densityMax) ?? number(m.density) ?? number(m.apparentDensity),
        densityMin,
        densityMax,
      ) &&
      rangeMatches(
        number(m.hardnessValue),
        number(m.hardnessValue),
        hardnessMin,
        hardnessMax,
      ) &&
      rangeMatches(
        number(m.youngsModulusMin) ?? number(m.youngsModulus),
        number(m.youngsModulusMax) ?? number(m.youngsModulus),
        modulusMin,
        modulusMax,
      ) &&
      rangeMatches(
        number(m.porosity),
        number(m.porosity),
        porosityMin,
        porosityMax,
      ) &&
      rangeMatches(
        number(m.tensileStrengthMin) ?? number(m.tensileStrength),
        number(m.tensileStrengthMax) ?? number(m.tensileStrength),
        tensileMin,
        tensileMax,
      ) &&
      rangeMatches(number(m.yieldStressMin), number(m.yieldStressMax), yieldMin, yieldMax) &&
      rangeMatches(number(m.compressiveStrengthMin), number(m.compressiveStrengthMax), compressiveMin, compressiveMax) &&
      rangeMatches(number(m.fractureToughnessMin), number(m.fractureToughnessMax), fractureMin, fractureMax) &&
      rangeMatches(
        number(m.meltingPointMin) ?? number(m.meltingPoint),
        number(m.meltingPointMax) ?? number(m.meltingPoint),
        meltingMin,
        meltingMax,
      ) &&
      rangeMatches(number(m.softeningTemperatureMin), number(m.softeningTemperatureMax), softeningMin, softeningMax) &&
      rangeMatches(number(m.maxServiceTemperature), number(m.maxServiceTemperature), serviceMin, serviceMax),
  );
  const sort = controls.sort.value;
  state.filtered.sort((a, b) =>
    sort === "name" || sort === "category"
      ? clean(a[sort]).localeCompare(clean(b[sort]))
      : (number(a[sort]) ?? Infinity) - (number(b[sort]) ?? Infinity),
  );
  renderCards();
}

/* =========================================================
   LINKS AND SMALL DISPLAY HELPERS
   ========================================================= */

function formatRange(min, max, unit) {
  const low = clean(min),
    high = clean(max);
  if (low && high) return `${low}–${high} ${unit}`;
  if (low) return `${low} ${unit} min`;
  if (high) return `${high} ${unit} max`;
  return "Not reported";
}
function environmentalResistance(material) {
  return [
    ["Fresh water", material.freshWaterRating],
    ["Salt water", material.saltWaterRating],
    ["Sunlight/UV", material.sunlightUvRating],
    ["Wear", material.wearResistanceRating],
    ["Flammability", material.flammabilityRating],
  ]
    .filter(([, value]) => clean(value))
    .map(([label, value]) => `${label}: ${clean(value)}`)
    .join("; ");
}
function sourceLink(material) {
  const url = clean(material.documentLink);
  const label =
    clean(material.sourceTitle) ||
    clean(material.sourceFilename) ||
    "Source article";
  if (!/^https?:\/\//i.test(url)) return null;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  return a;
}
function detailLink(
  material,
  label = clean(material.name) || "Unnamed Material",
) {
  const a = document.createElement("a");
  a.href = `material-details.html?id=${encodeURIComponent(material.id)}`;
  a.textContent = label;
  return a;
}
function fact(label, value) {
  const wrap = document.createElement("div"),
    dt = document.createElement("dt"),
    dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = clean(value) || "Not reported";
  wrap.append(dt, dd);
  return wrap;
}

/* =========================================================
   MATERIAL RESULT CARDS

   Cards can show an image, save a comparison choice, open the
   full detail page, and open the material's source article.
   ========================================================= */

function renderCards() {
  const grid = $("material-selector-grid");
  grid.replaceChildren();
  $("selector-result-count").textContent = state.filtered.length;
  $("selector-status").textContent = state.filtered.length
    ? `Showing ${state.filtered.length} of ${state.materials.length} materials.`
    : state.materials.length
      ? "No materials match the selected parameters."
      : "No materials have been added or imported yet.";
  if (!state.filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-selector";
    empty.textContent = state.materials.length
      ? "Try widening a range or clearing one of the filters."
      : "Add a material on the Dashboard or import a spreadsheet to begin.";
    grid.appendChild(empty);
    renderComparison();
    return;
  }
  state.filtered.forEach((material) => {
    const card = document.createElement("article");
    card.className =
      "selector-card" + (state.selected.has(material.id) ? " is-compared" : "");
    const image = material._imageFile
      ? document.createElement("img")
      : document.createElement("div");
    image.className = "selector-card-image";
    if (material._imageFile) {
      const url = URL.createObjectURL(material._imageFile);
      image.src = url;
      image.alt = `${clean(material.name) || "Material"} preview`;
      image.onload = () => URL.revokeObjectURL(url);
    } else image.textContent = "No material image";
    const body = document.createElement("div");
    body.className = "selector-card-body";
    const checkLabel = document.createElement("label");
    checkLabel.className = "compare-check";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = state.selected.has(material.id);
    check.setAttribute("aria-label", `Compare ${material.name}`);
    check.addEventListener("change", () => {
      check.checked
        ? state.selected.add(material.id)
        : state.selected.delete(material.id);
      saveComparison();
      card.classList.toggle("is-compared", check.checked);
      renderComparison();
    });
    checkLabel.append(check, document.createTextNode(" Save for comparison"));
    const title = document.createElement("h4");
    title.appendChild(detailLink(material));
    const category = document.createElement("p");
    category.className = "selector-category";
    category.textContent = clean(material.category) || "Category not reported";
    const facts = document.createElement("dl");
    facts.className = "card-facts";
    facts.append(
      fact("Composition", material.composition),
      fact(
        "Particle size",
        formatRange(material.particleSizeMin, material.particleSizeMax, "µm"),
      ),
      fact(
        "Density",
        clean(material.density)
          ? `${material.density} g/cm³`
          : formatRange(material.densityMin, material.densityMax, "g/cm³"),
      ),
      fact("Young’s modulus", formatRange(material.youngsModulusMin, material.youngsModulusMax, "GPa")),
      fact("Source", material.sourceTitle || material.sourceFilename || material.dataSourceGroup),
      fact("Supplier", material.supplier),
    );
    const links = document.createElement("div");
    links.className = "card-links";
    links.appendChild(detailLink(material, "Full details"));
    const source = sourceLink(material);
    if (source) links.appendChild(source);
    body.append(checkLabel, title, category, facts, links);
    card.append(image, body);
    grid.appendChild(card);
  });
  renderComparison();
}

// Add or remove entries here to change comparison-table rows.
const comparisonRows = [
  ["Category", (m) => m.category],
  ["Composition", (m) => m.composition],
  ["Composition Basis", (m) => m.compositionBasis],
  ["Feedstock Form", (m) => m.feedstockForm],
  ["Manufacturing Method", (m) => list(m.manufacturingMethods).join(", ")],
  ["Morphology", (m) => list(m.morphology).join(", ")],
  ["Parent Material", (m) => m.parentMaterial],
  ["Powder Family", (m) => m.powderFamily],
  ["Product Code", (m) => m.productCode],
  [
    "Particle Size",
    (m) => formatRange(m.particleSizeMin, m.particleSizeMax, "µm"),
  ],
  ["Density", (m) => clean(m.density) ? `${m.density} g/cm³` : formatRange(m.densityMin, m.densityMax, "g/cm³")],
  [
    "Hardness",
    (m) =>
      [clean(m.hardnessValue), clean(m.hardnessScaleLoad)]
        .filter(Boolean)
        .join(" "),
  ],
  [
    "Young’s Modulus",
    (m) => clean(m.youngsModulus) ? `${m.youngsModulus} GPa` : formatRange(m.youngsModulusMin, m.youngsModulusMax, "GPa"),
  ],
  ["Tensile Strength", (m) => clean(m.tensileStrength) ? `${m.tensileStrength} MPa` : formatRange(m.tensileStrengthMin, m.tensileStrengthMax, "MPa")],
  ["Yield Strength", (m) => formatRange(m.yieldStressMin, m.yieldStressMax, "MPa")],
  ["Compressive Strength", (m) => formatRange(m.compressiveStrengthMin, m.compressiveStrengthMax, "MPa")],
  ["Fracture Toughness", (m) => formatRange(m.fractureToughnessMin, m.fractureToughnessMax, "MPa·√m")],
  ["Melting Point", (m) => clean(m.meltingPoint) ? `${m.meltingPoint} °C` : formatRange(m.meltingPointMin, m.meltingPointMax, "°C")],
  ["Softening Temperature", (m) => formatRange(m.softeningTemperatureMin, m.softeningTemperatureMax, "°C")],
  ["Maximum Service Temperature", (m) => clean(m.maxServiceTemperature) ? `${m.maxServiceTemperature} °C` : ""],
  ["Environmental Resistance", (m) => environmentalResistance(m)],
  ["Environmental Rating Scale", (m) => m.environmentRatingScale],
  ["Crystal Structure", (m) => m.crystalStructure],
  ["Supplier", (m) => m.supplier],
  ["Source Group", (m) => m.dataSourceGroup],
  ["Source Title", (m) => m.sourceTitle || m.sourceFilename],
  ["Source / Article", (m) => m.documentLink],
];

/* =========================================================
   SIDE-BY-SIDE COMPARISON TABLE
   ========================================================= */

function renderComparison() {
  const body = $("comparison-table-body");
  body.replaceChildren();
  const selected = [...state.selected]
    .map((id) => state.materials.find((m) => m.id === id))
    .filter(Boolean);
  $("comparison-help").textContent =
    selected.length < 2
      ? `${selected.length} selected. Select at least two materials to compare them.`
      : `Comparing ${selected.length} materials side by side.`;
  if (!selected.length) {
    const row = document.createElement("tr"),
      th = document.createElement("th"),
      td = document.createElement("td");
    th.textContent = "Selection";
    td.textContent = "No materials selected.";
    row.append(th, td);
    body.appendChild(row);
    return;
  }
  const nameRow = document.createElement("tr"),
    nameLabel = document.createElement("th");
  nameLabel.textContent = "Material";
  nameRow.appendChild(nameLabel);
  selected.forEach((m) => {
    const td = document.createElement("td");
    td.appendChild(detailLink(m));
    nameRow.appendChild(td);
  });
  body.appendChild(nameRow);
  comparisonRows.forEach(([label, getter]) => {
    const row = document.createElement("tr"),
      th = document.createElement("th");
    th.textContent = label;
    row.appendChild(th);
    selected.forEach((m) => {
      const td = document.createElement("td");
      if (
        label === "Source / Article" &&
        /^https?:\/\//i.test(clean(m.documentLink))
      ) {
        const link = sourceLink(m);
        if (link) td.appendChild(link);
      } else td.textContent = clean(getter(m)) || "Not reported";
      row.appendChild(td);
    });
    body.appendChild(row);
  });
}

/* =========================================================
   RESET AND PAGE STARTUP
   ========================================================= */

function clearFilters() {
  Object.values(controls).forEach((control) => {
    if (control && control !== controls.sort) control.value = "";
  });
  controls.particleUnit.value = "um";
  controls.densityUnit.value = "gcm3";
  controls.modulusUnit.value = "gpa";
  controls.tensileUnit.value = "mpa";
  controls.meltingUnit.value = "c";
  controls.yieldUnit.value = "mpa";
  controls.compressiveUnit.value = "mpa";
  controls.fractureUnit.value = "mpasqrtm";
  controls.softeningUnit.value = "c";
  controls.serviceTemperatureUnit.value = "c";
  controls.sort.value = "name";
  applyFilters();
}
async function initialize() {
  const images = await firstImages();
  let shared = [];
  try {
    shared = window.varcoApi ? await window.varcoApi.listMaterials() : [];
  } catch (error) {
    console.error("Shared materials could not be loaded.", error);
  }
  // Supabase is the only material-record source. Browser storage remains
  // available only for local UI state such as comparisons and cached images.
  // Manual entries created through the site are already saved in Supabase.
  state.materials = shared.map((m) => ({
    ...m,
    _imageFile: images.get(m.id) || null,
  }));
  state.selected = new Set(
    [...state.selected].filter((id) =>
      state.materials.some((m) => m.id === id),
    ),
  );
  saveComparison();
  fillSelect(controls.category, unique("category"));
  fillSelect(controls.feedstock, unique("feedstockForm"));
  fillSelect(controls.basis, unique("compositionBasis"));
  fillSelect(controls.method, unique("manufacturingMethods", true));
  fillSelect(controls.morphology, unique("morphology", true));
  fillSelect(controls.supplier, unique("supplier"));
  fillSelect(controls.sprayProcess, unique("sprayProcesses", true));
  fillSelect(controls.sourceType, unique("sourceType"));
  fillSelect(controls.quality, unique("dataQualityStatus"));
  applyFilters();
}

// Re-filter immediately whenever the user changes a control.
Object.values(controls).forEach((control) =>
  control?.addEventListener(
    control?.matches("input") ? "input" : "change",
    applyFilters,
  ),
);
$("clear-selector-filters")?.addEventListener("click", clearFilters);
$("clear-comparison")?.addEventListener("click", () => {
  state.selected.clear();
  saveComparison();
  renderCards();
});
initialize();