"use strict";

const DB_NAME = "varcoFileDatabase";
const DB_VERSION = 1;
const STORE_NAME = "files";

/* Page elements are assigned only after the HTML is ready. Previously these
   were queried immediately; when the script loaded before the page, they were
   null and the first addEventListener call stopped the entire program. */
let fileInput;
let chooseFilesButton;
let uploadZone;
let fileMessage;
let fileSearch;
let fileTableBody;
let uploadedFileCount;
let fileViewer;
let viewerTitle;
let viewerDetails;
let sheetTabs;
let spreadsheetContainer;
let editFileButton;
let downloadFileButton;
let closeViewerButton;
let editorButtons;
let editHelp;
let cancelEditButton;
let addRowButton;
let addColumnButton;
let saveFileButton;

let savedFiles = [];
let activeFile = null;
let activeSheetIndex = 0;
let workingRows = [];
let editing = false;

/* The CSV version of the manual material form. Missing values are
   deliberately stored as "Not Reported" so every imported record has
   the same basic shape. */
const MATERIAL_CSV_COLUMNS = [
    "Material Name", "Category", "Feedstock Form", "Composition",
    "Composition Basis", "Manufacturing Methods", "Morphologies",
    "Particle Size Min (µm)", "Particle Size Max (µm)",
    "Particle Size Average (µm)", "Particle Size Method",
    "Powder Flowability", "Apparent Density (g/cm³)", "Purity (%)",
    "Supplier", "Product Name", "Product Number", "Density (g/cm³)",
    "Porosity (%)", "Hardness Value", "Hardness Scale and Load",
    "Young's Modulus (GPa)", "Poisson's Ratio", "Tensile Strength (MPa)",
    "Fracture Toughness (MPa·m^0.5)", "Melting Point (°C)",
    "Maximum Service Temperature (°C)", "Thermal Conductivity (W/m·K)",
    "Thermal Expansion (µm/m·K)", "Electrical Property",
    "Corrosion Resistance", "Oxidation Resistance",
    "Recommended Spray Processes", "Wear Mechanisms",
    "Intended Applications", "Reported Advantages", "Reported Limitations",
    "Source Type", "Source Title", "Source Author or Organization",
    "Publication Year", "Source Filename", "Source Page",
    "Table or Figure Number", "DOI or URL", "Document Link",
    "Test Standards", "Data Quality Status", "Notes"
];

/* Cambridge Materials Data Book fields that must remain available after
   import. These are intentionally kept as separate columns instead of being
   collapsed into one value, because the Cambridge source reports ranges and
   distinguishes melting from glass-transition/softening temperatures. */
const CAMBRIDGE_IDENTITY_COLUMNS = [
    "Record ID", "Record Type", "Data Source Group", "Parent Material",
    "Powder Family", "Classification", "Color", "Catalog URL", "Access Date",
    "Evidence Class"
];

const CAMBRIDGE_PROPERTY_COLUMNS = [
    "Density Min (g/cm³)", "Density Max (g/cm³)", "Density as Reported",
    "Young's Modulus Min (GPa)", "Young's Modulus Max (GPa)",
    "Young's Modulus as Reported",
    "Yield Stress Min (MPa)", "Yield Stress Max (MPa)",
    "Yield Stress as Reported",
    "Tensile Strength Min (MPa)", "Tensile Strength Max (MPa)",
    "Tensile Strength as Reported",
    "Compressive Strength Min (MPa)", "Compressive Strength Max (MPa)",
    "Compressive Strength as Reported",
    "Fracture Toughness Min (MPa·m^0.5)",
    "Fracture Toughness Max (MPa·m^0.5)",
    "Fracture Toughness as Reported",
    "Melting Temperature Min (°C)", "Melting Temperature Max (°C)",
    "Melting Temperature as Reported",
    "Glass Transition / Softening Min (°C)",
    "Glass Transition / Softening Max (°C)",
    "Glass Transition / Softening as Reported"
];

const EMPTY_WHEN_MISSING_COLUMNS = new Set([
    "Particle Size Min (µm)", "Particle Size Max (µm)",
    "Particle Size Average (µm)", "Apparent Density (g/cm³)", "Purity (%)",
    "Density (g/cm³)", "Porosity (%)", "Hardness Value",
    "Young's Modulus (GPa)", "Poisson's Ratio", "Tensile Strength (MPa)",
    "Fracture Toughness (MPa·m^0.5)", "Melting Point (°C)",
    "Maximum Service Temperature (°C)", "Thermal Conductivity (W/m·K)",
    "Thermal Expansion (µm/m·K)", ...CAMBRIDGE_PROPERTY_COLUMNS
]);

function normalizedHeader(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[₂³µμ°'’".,()/%·^_-]/g, "")
        .replace(/\s+/g, "");
}

const COLUMN_ALIASES = {
    "Record ID": ["record_id"],
    "Record Type": ["record_type"],
    "Data Source Group": ["data_source_group"],
    "Parent Material": ["parent_material"],
    "Powder Family": ["powder_family"],
    "Material Name": [
        "material_name",
        "name", "material", "powder name", "material or powder",
        "material name / designation", "material designation",
        "material/feedstock name", "feedstock material", "material system",
        "material / powder name", "material/powder name",
        "material or powder name", "coating material",
        "coating material name", "material / coating system",
        "material/coating system", "powder designation",
        "feedstock name", "alloy name", "ceramic name",
        "product or material name"
    ],
    "Category": ["classification", "material category", "class"],
    "Feedstock Form": ["feedstock_form", "form", "material form", "feedstock"],
    "Composition": [
        "composition_as_reported", "chemical composition",
        "composition as reported"
    ],
    "Composition Basis": ["composition_basis", "basis", "composition unit"],
    "Manufacturing Methods": [
        "manufacturing_method", "manufacturing method",
        "powder manufacturing method"
    ],
    "Morphologies": ["morphology", "particle morphology", "powder morphology"],
    "Particle Size Min (µm)": [
        "particle_size_min_um", "particle size min", "minimum particle size", "size min"
    ],
    "Particle Size Max (µm)": [
        "particle_size_max_um", "particle size max", "maximum particle size", "size max"
    ],
    "Particle Size Average (µm)": ["particle size average", "average particle size", "d50"],
    "Powder Flowability": ["powder_flowability", "flowability"],
    "Apparent Density (g/cm³)": ["apparent_density", "apparent density"],
    "Purity (%)": ["purity_percent", "purity"],
    "Supplier": ["manufacturer"],
    "Product Name": ["product_name"],
    "Product Number": ["product_number", "product_code", "product id", "product code"],
    "Density (g/cm³)": [
        "density", "material density", "density_value_reported",
        "density_min_g_cm3", "density_max_g_cm3"
    ],
    "Porosity (%)": ["porosity_percent", "porosity"],
    "Young's Modulus (GPa)": [
        "youngs modulus", "elastic modulus", "young modulus",
        "youngs_modulus_as_reported", "youngs modulus as reported"
    ],
    "Tensile Strength (MPa)": [
        "tensile strength", "ultimate tensile strength",
        "tensile_strength_as_reported", "tensile strength as reported"
    ],
    "Fracture Toughness (MPa·m^0.5)": [
        "fracture toughness", "fracture_toughness_as_reported",
        "fracture toughness as reported"
    ],
    "Melting Point (°C)": [
        "melting point", "melt point", "solidus liquidus",
        "melting_point_reported", "melting_point_min_c", "melting_point_max_c"
    ],
    "Maximum Service Temperature (°C)": [
        "max_service_temp_c", "maximum service temperature",
        "maximum service temperature c", "max service temperature c"
    ],
    "Hardness Value": ["hardness_value", "hardness"],
    "Hardness Scale and Load": ["hardness_scale_load"],
    "Recommended Spray Processes": [
        "recommended_processes", "recommended spray process",
        "spray processes", "spray_processes"
    ],
    "Wear Mechanisms": ["wear_mechanism", "wear mechanism"],
    "Intended Applications": [
        "applications_and_reported_characteristics",
        "applications", "application"
    ],
    "Reported Advantages": [
        "applications_and_reported_characteristics",
        "reported characteristics"
    ],
    "Source Type": ["reference type"],
    "Source Title": [
        "source_article", "reference", "reference title",
        "citation", "article title"
    ],
    "Source Author or Organization": ["source author", "author", "organization"],
    "Source Filename": [
        "source_file", "reference file", "reference filename", "csv file"
    ],
    "Source Page": ["source_page", "source_page_section", "source page section"],
    "Table or Figure Number": [
        "source_table", "table number", "figure number"
    ],
    "DOI or URL": ["source_url", "doi", "url"],
    "Document Link": [
        "source_url", "source link", "url", "reference link"
    ],
    "Test Standards": ["standard_or_reference", "test standard"],
    "Data Quality Status": [
        "data_quality_status", "verification status", "quality status",
        "evidence_class", "evidence class"
    ],
    "Notes": ["data_quality_note", "quality note"]
};

Object.assign(COLUMN_ALIASES, {
    "Classification": ["classification"],
    "Color": ["color"],
    "Catalog URL": ["catalog_url"],
    "Access Date": ["access_date"],
    "Evidence Class": ["evidence_class"],
    "Density Min (g/cm³)": ["density_min_g_cm3"],
    "Density Max (g/cm³)": ["density_max_g_cm3"],
    "Density as Reported": ["density_value_reported", "density as reported"],
    "Melting Temperature Min (°C)": ["melting_point_min_c"],
    "Melting Temperature Max (°C)": ["melting_point_max_c"],
    "Melting Temperature as Reported": ["melting_point_reported"],
    "Young's Modulus Min (GPa)": ["youngs_modulus_min_gpa"],
    "Young's Modulus Max (GPa)": ["youngs_modulus_max_gpa"],
    "Young's Modulus as Reported": ["youngs_modulus_as_reported"],
    "Yield Stress Min (MPa)": ["yield_stress_min_mpa"],
    "Yield Stress Max (MPa)": ["yield_stress_max_mpa"],
    "Yield Stress as Reported": ["yield_stress_as_reported"],
    "Tensile Strength Min (MPa)": ["tensile_strength_min_mpa"],
    "Tensile Strength Max (MPa)": ["tensile_strength_max_mpa"],
    "Tensile Strength as Reported": ["tensile_strength_as_reported"],
    "Compressive Strength Min (MPa)": ["compressive_strength_min_mpa"],
    "Compressive Strength Max (MPa)": ["compressive_strength_max_mpa"],
    "Compressive Strength as Reported": ["compressive_strength_as_reported"],
    "Fracture Toughness Min (MPa·m^0.5)": ["fracture_toughness_min_mpa_m05"],
    "Fracture Toughness Max (MPa·m^0.5)": ["fracture_toughness_max_mpa_m05"],
    "Fracture Toughness as Reported": ["fracture_toughness_as_reported"],
    "Glass Transition / Softening Min (°C)": ["glass_transition_softening_min_c"],
    "Glass Transition / Softening Max (°C)": ["glass_transition_softening_max_c"],
    "Glass Transition / Softening as Reported": ["glass_transition_softening_as_reported"]
});

const PREFERRED_SOURCE_HEADINGS = {
    "Density (g/cm³)": ["density_value_reported", "density as reported"],
    "Young's Modulus (GPa)": ["youngs_modulus_as_reported"],
    "Tensile Strength (MPa)": ["tensile_strength_as_reported"],
    "Fracture Toughness (MPa·m^0.5)": ["fracture_toughness_as_reported"],
    "Melting Point (°C)": ["melting_point_reported"]
};

function findSourceColumn(headers, canonicalColumn) {
    const preferred = (PREFERRED_SOURCE_HEADINGS[canonicalColumn] || [])
        .map(normalizedHeader);
    const preferredIndex = headers.findIndex((header) =>
        preferred.includes(normalizedHeader(header))
    );
    if (preferredIndex >= 0) return preferredIndex;

    const accepted = [canonicalColumn, ...(COLUMN_ALIASES[canonicalColumn] || [])]
        .map(normalizedHeader);
    const exactIndex = headers.findIndex((header) =>
        accepted.includes(normalizedHeader(header))
    );

    if (exactIndex >= 0 || canonicalColumn !== "Material Name") {
        return exactIndex;
    }

    return headers.findIndex((header) => {
        const normalized = normalizedHeader(header);
        const includesName = normalized.includes("name") ||
            normalized.includes("designation");
        const includesMaterialKind = normalized.includes("material") ||
            normalized.includes("powder") ||
            normalized.includes("feedstock") ||
            normalized.includes("coating") ||
            normalized.includes("alloy") ||
            normalized.includes("ceramic") ||
            normalized.includes("product");
        return includesName && includesMaterialKind;
    });
}

function headerIndex(headers, acceptedNames) {
    const accepted = acceptedNames.map(normalizedHeader);
    return headers.findIndex((header) => accepted.includes(normalizedHeader(header)));
}

function cambridgePropertyKey(propertyName) {
    const property = normalizedHeader(propertyName);
    const keys = {
        density: "density",
        youngsmodulus: "youngs_modulus",
        yieldstress: "yield_stress",
        tensilestrength: "tensile_strength",
        compressivestrength: "compressive_strength",
        fracturetoughness: "fracture_toughness",
        meltingtemperature: "melting_temperature",
        glasstransitionsofteningtemperature: "glass_transition_softening"
    };
    return keys[property] || "";
}

/* Join Cambridge's long-form Property_Evidence sheet to Unified_Materials.
   This keeps one imported material row while preserving every reported range. */
function enrichCambridgeRows(materialRows, evidenceRows) {
    if (!materialRows.length || !evidenceRows.length) return materialRows;

    const materialHeaders = materialRows[0].map(String);
    const evidenceHeaders = evidenceRows[0].map(String);
    const materialRecordIndex = headerIndex(materialHeaders, ["record_id", "Record ID"]);
    const evidenceRecordIndex = headerIndex(evidenceHeaders, ["record_id", "Record ID"]);
    const propertyIndex = headerIndex(evidenceHeaders, ["property_name", "Property Name"]);
    const minimumIndex = headerIndex(evidenceHeaders, ["value_min", "Value Min"]);
    const maximumIndex = headerIndex(evidenceHeaders, ["value_max", "Value Max"]);
    const reportedIndex = headerIndex(evidenceHeaders, ["value_as_reported", "Value as Reported"]);

    if ([materialRecordIndex, evidenceRecordIndex, propertyIndex].some((index) => index < 0)) {
        return materialRows;
    }

    const evidenceByRecord = new Map();
    evidenceRows.slice(1).forEach((row) => {
        const recordId = String(row[evidenceRecordIndex] ?? "").trim();
        const propertyKey = cambridgePropertyKey(row[propertyIndex]);
        if (!recordId || !propertyKey) return;
        if (!evidenceByRecord.has(recordId)) evidenceByRecord.set(recordId, {});
        evidenceByRecord.get(recordId)[`${propertyKey}_min`] = row[minimumIndex] ?? "";
        evidenceByRecord.get(recordId)[`${propertyKey}_max`] = row[maximumIndex] ?? "";
        evidenceByRecord.get(recordId)[`${propertyKey}_as_reported`] = row[reportedIndex] ?? "";
    });

    const addedHeaders = [
        "youngs_modulus_min_gpa", "youngs_modulus_max_gpa", "youngs_modulus_as_reported",
        "yield_stress_min_mpa", "yield_stress_max_mpa", "yield_stress_as_reported",
        "tensile_strength_min_mpa", "tensile_strength_max_mpa", "tensile_strength_as_reported",
        "compressive_strength_min_mpa", "compressive_strength_max_mpa", "compressive_strength_as_reported",
        "fracture_toughness_min_mpa_m05", "fracture_toughness_max_mpa_m05", "fracture_toughness_as_reported",
        "melting_temperature_min_c", "melting_temperature_max_c", "melting_temperature_as_reported",
        "glass_transition_softening_min_c", "glass_transition_softening_max_c", "glass_transition_softening_as_reported"
    ];

    return [
        [...materialHeaders, ...addedHeaders],
        ...materialRows.slice(1).map((row) => {
            const values = evidenceByRecord.get(String(row[materialRecordIndex] ?? "").trim()) || {};
            return [...row, ...addedHeaders.map((heading) => values[heading.replace(/_(gpa|mpa|mpa_m05|c)$/, "")] ?? "")];
        })
    ];
}

function normalizeMaterialRows(rows, filename) {
    /*
       Workbooks often have a title, citation, or blank rows above the
       actual table. Locate the row that contains the material-name
       column instead of assuming row zero is always the header.
    */
    const headerSearchLimit = Math.min(rows.length, 50);
    let headerRowIndex = -1;
    let bestHeaderScore = -1;

    for (let rowIndex = 0; rowIndex < headerSearchLimit; rowIndex += 1) {
        const candidateHeaders = rows[rowIndex].map((value) => String(value).trim());
        const hasMaterialName =
            findSourceColumn(candidateHeaders, "Material Name") >= 0;

        if (!hasMaterialName) continue;

        const score = MATERIAL_CSV_COLUMNS.reduce((total, column) => {
            return total + (findSourceColumn(candidateHeaders, column) >= 0 ? 1 : 0);
        }, 0);

        if (score > bestHeaderScore) {
            bestHeaderScore = score;
            headerRowIndex = rowIndex;
        }
    }

    if (headerRowIndex < 0) {
        throw new Error(`${filename} does not contain a recognizable Material Name column.`);
    }

    const originalHeaders = rows[headerRowIndex]
        .map((header) => String(header).trim());
    const usedIndexes = new Set();
    const canonicalColumns = [
        ...MATERIAL_CSV_COLUMNS,
        ...CAMBRIDGE_IDENTITY_COLUMNS,
        ...CAMBRIDGE_PROPERTY_COLUMNS
    ];
    const canonicalIndexes = canonicalColumns.map((column) => {
        const index = findSourceColumn(originalHeaders, column);
        if (index >= 0) usedIndexes.add(index);
        return index;
    });
    const extraIndexes = originalHeaders
        .map((_, index) => index)
        .filter((index) => !usedIndexes.has(index) && originalHeaders[index]);
    const outputHeaders = [
        ...canonicalColumns,
        ...extraIndexes.map((index) => originalHeaders[index])
    ];
    const materialNameIndex = canonicalIndexes[0];
    const outputRows = rows.slice(headerRowIndex + 1)
        .filter((row) => {
            const materialName = String(row[materialNameIndex] ?? "").trim();
            return materialName &&
                normalizedHeader(materialName) !==
                    normalizedHeader(originalHeaders[materialNameIndex]);
        })
        .map((row) => {
            const standardized = canonicalColumns.map((column, columnIndex) => {
                const sourceIndex = canonicalIndexes[columnIndex];
                const value = sourceIndex >= 0 ? String(row[sourceIndex] ?? "").trim() : "";

                if (value) return value;
                if (EMPTY_WHEN_MISSING_COLUMNS.has(column)) return "";
                if (column === "Source Type") return "Other";
                if (column === "Source Title" || column === "Source Filename") return filename;
                return "Not Reported";
            });
            return [...standardized, ...extraIndexes.map((index) => {
                return String(row[index] ?? "").trim() || "Not Reported";
            })];
        });

    if (!outputRows.length) {
        throw new Error(`${filename} does not contain any material data rows.`);
    }

    return [outputHeaders, ...outputRows];
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function readAllFiles() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

async function putFile(fileRecord) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(fileRecord);
        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

async function removeFile(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = () => {
            database.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

function createId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function extensionOf(name) {
    return name.split(".").pop().toLowerCase();
}

function baseName(name) {
    const position = name.lastIndexOf(".");
    return position > 0 ? name.slice(0, position) : name;
}

function parseWorkbook(arrayBuffer, filename) {
    if (typeof XLSX === "undefined") {
        throw new Error("The spreadsheet reader did not load. Check your internet connection and refresh.");
    }
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const sheets = workbook.SheetNames.map((sheetName) => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
            defval: "",
            raw: false
        });

        if (!rows.length) return null;

        const width = Math.max(...rows.map((row) => row.length));
        return {
            sheetName,
            rows: rows.map((row) =>
                Array.from({ length: width }, (_, index) =>
                    String(row[index] ?? "")
                )
            )
        };
    }).filter(Boolean);

    if (!sheets.length) {
        throw new Error(`${filename} does not contain any rows.`);
    }

    return sheets;
}

function importedCell(headers, row, heading) {
    const wanted = normalizedHeader(heading);
    const index = headers.findIndex(
        (header) => normalizedHeader(header) === wanted
    );
    return index >= 0 ? String(row[index] ?? "").trim() : "";
}

function importedList(value) {
    const text = String(value ?? "").trim();
    if (!text || normalizedHeader(text) === "notreported") return [];
    return text.split(/[;|]/).map((item) => item.trim()).filter(Boolean);
}

/* Convert the normalized spreadsheet rows into the object format expected by
   varco-api.js. The complete original row is retained in JSONB, while these
   camel-case fields populate the searchable materials table. */
function rowsToSharedMaterials(rows, filename) {
    if (!Array.isArray(rows) || rows.length < 2) return [];
    const headers = rows[0].map((header) => String(header ?? "").trim());

    return rows.slice(1).map((row, rowIndex) => {
        const completeRow = {};
        headers.forEach((header, index) => {
            if (header) completeRow[header] = row[index] ?? "";
        });

        const name = importedCell(headers, row, "Material Name");
        return {
            ...completeRow,
            name,
            materialName: name,
            category: importedCell(headers, row, "Category"),
            composition: importedCell(headers, row, "Composition"),
            compositionBasis: importedCell(headers, row, "Composition Basis"),
            feedstockForm: importedCell(headers, row, "Feedstock Form"),
            manufacturingMethods: importedList(
                importedCell(headers, row, "Manufacturing Methods")
            ),
            morphologies: importedList(
                importedCell(headers, row, "Morphologies")
            ),
            supplier: importedCell(headers, row, "Supplier"),
            productName: importedCell(headers, row, "Product Name"),
            productNumber: importedCell(headers, row, "Product Number"),
            sourceType: importedCell(headers, row, "Source Type") || "Other",
            sourceTitle: importedCell(headers, row, "Source Title") || filename,
            sourceFilename: importedCell(headers, row, "Source Filename") || filename,
            documentLink:
                importedCell(headers, row, "Document Link") ||
                importedCell(headers, row, "DOI or URL"),
            origin: "spreadsheet",
            spreadsheetRow: rowIndex + 2
        };
    }).filter((material) => material.name);
}

async function handleFiles(fileList) {
    const allowed = ["csv", "tsv", "xls", "xlsx"];
    let added = 0;
    let importedMaterialCount = 0;
    let sharedMaterialCount = 0;
    let localOnlyMaterialCount = 0;
    const syncWarnings = [];
    let importedFromPreferredSheet = "";
    const savedWithoutMaterialImport = [];

    for (const file of fileList) {
        const extension = extensionOf(file.name);
        if (!allowed.includes(extension)) {
            showMessage(`${file.name} was skipped. Use CSV, TSV, XLS, or XLSX.`, true);
            continue;
        }
        try {
            const parsedSheets = parseWorkbook(await file.arrayBuffer(), file.name);
            /*
               Prefer the workbook's complete, combined material table.
               CSV_Import is kept as a fallback for older workbooks that do
               not contain Unified_Materials.
            */
            const unifiedMaterialsSheet = parsedSheets.find(
                (sheet) => normalizedHeader(sheet.sheetName) === "unifiedmaterials"
            );
            const csvImportSheet = parsedSheets.find(
                (sheet) => normalizedHeader(sheet.sheetName) === "csvimport"
            );
            const preferredMaterialSheet = unifiedMaterialsSheet || csvImportSheet;
            const propertyEvidenceSheet = parsedSheets.find(
                (sheet) => normalizedHeader(sheet.sheetName) === "propertyevidence"
            );

            /* Cambridge stores many mechanical properties in a separate,
               long-form evidence sheet. Join that evidence to the material
               rows before normalizing the workbook for the database. */
            if (unifiedMaterialsSheet && propertyEvidenceSheet) {
                unifiedMaterialsSheet.rows = enrichCambridgeRows(
                    unifiedMaterialsSheet.rows,
                    propertyEvidenceSheet.rows
                );
            }
            const materialSheetCandidates = preferredMaterialSheet
                ? [preferredMaterialSheet]
                : parsedSheets;

            if (preferredMaterialSheet) {
                importedFromPreferredSheet = preferredMaterialSheet.sheetName;
            }

            const normalizedMaterialSheets = [];

            materialSheetCandidates.forEach((sheet) => {
                try {
                    normalizedMaterialSheets.push({
                        sheetName: sheet.sheetName,
                        rows: normalizeMaterialRows(
                            sheet.rows,
                            `${file.name} — ${sheet.sheetName}`
                        )
                    });
                } catch (sheetError) {
                    console.info(sheetError.message);
                }
            });

            /*
               A file should remain viewable even when it is only a reference
               table and cannot be imported as material records. Previously,
               those files were rejected completely and never appeared in the
               Uploaded Files table.
            */
            const hasMaterialTable = normalizedMaterialSheets.length > 0;
            const displaySheet = hasMaterialTable
                ? normalizedMaterialSheets[0]
                : parsedSheets[0];
            const combinedRows = hasMaterialTable
                ? [
                    normalizedMaterialSheets[0].rows[0],
                    ...normalizedMaterialSheets.flatMap((sheet) => sheet.rows.slice(1))
                ]
                : displaySheet.rows;
            const materialRowsInFile = hasMaterialTable
                ? combinedRows.length - 1
                : 0;
            const existingFile = savedFiles.find(
                (savedFile) => savedFile.name.toLowerCase() === file.name.toLowerCase()
            );
            let publishedFile = null;

            /* Always allow the local import. When an approved teammate is
               signed in, also upload the file and materials to Supabase. */
            if (hasMaterialTable) {
                const sharedMaterials = rowsToSharedMaterials(combinedRows, file.name);
                if (!sharedMaterials.length) {
                    throw new Error(
                        `${file.name} contains a table, but no nonblank material names were found.`
                    );
                }

                let signedInUser = null;
                if (window.varcoApi?.currentUser) {
                    try {
                        signedInUser = await window.varcoApi.currentUser();
                    } catch (error) {
                        console.info("Supabase sign-in status could not be checked.", error);
                    }
                }

                if (
                    signedInUser &&
                    window.varcoApi?.uploadFile &&
                    window.varcoApi?.importMaterials
                ) {
                    try {
                        const uploadedFile = await window.varcoApi.uploadFile(file, {
                            fileType: extension.toUpperCase(),
                            rowCount: materialRowsInFile,
                            materialCount: sharedMaterials.length,
                            sheetNames: parsedSheets.map((sheet) => sheet.sheetName)
                        });

                        await window.varcoApi.importMaterials(
                            sharedMaterials,
                            uploadedFile.id
                        );
                        publishedFile = uploadedFile;

                        /* A successful re-upload replaces the previous remote
                           import only after the new copy is safely published. */
                        if (
                            existingFile?.sharedFileId &&
                            existingFile.sharedFileId !== uploadedFile.id &&
                            window.varcoApi?.deleteFile
                        ) {
                            await window.varcoApi.deleteFile({
                                id: existingFile.sharedFileId,
                                storagePath: existingFile.sharedStoragePath
                            });
                        }
                        sharedMaterialCount += sharedMaterials.length;
                    } catch (error) {
                        localOnlyMaterialCount += sharedMaterials.length;
                        syncWarnings.push(`${file.name}: ${error.message}`);
                    }
                } else {
                    localOnlyMaterialCount += sharedMaterials.length;
                }
            }

            const now = new Date().toISOString();
            await putFile({
                /* Re-uploading the same filename updates it instead of
                   creating a second set of duplicate material records. */
                id: existingFile ? existingFile.id : createId(),
                name: file.name,
                originalType: extension.toUpperCase(),
                sheetName: hasMaterialTable
                    ? normalizedMaterialSheets.map((sheet) => sheet.sheetName).join(", ")
                    : displaySheet.sheetName,
                allSheetNames: parsedSheets.map((sheet) => sheet.sheetName),
                workbookSheets: parsedSheets.map((sheet) => ({
                    sheetName: sheet.sheetName,
                    rows: sheet.rows
                })),
                rows: combinedRows,
                materialCount: materialRowsInFile,
                sharedFileId: publishedFile?.id || existingFile?.sharedFileId || "",
                sharedStoragePath:
                    publishedFile?.storage_path ||
                    publishedFile?.storagePath ||
                    existingFile?.sharedStoragePath ||
                    "",
                dateAdded: existingFile ? existingFile.dateAdded : now,
                dateModified: now
            });
            added += 1;
            importedMaterialCount += materialRowsInFile;
            if (!hasMaterialTable) {
                savedWithoutMaterialImport.push(file.name);
            }
        } catch (error) {
            showMessage(error.message, true);
        }
    }
        if (added) {
            const sourceDescription =
                added === 1 && importedFromPreferredSheet
                    ? ` from ${importedFromPreferredSheet}`
                    : "";

            const viewOnlyNotice = savedWithoutMaterialImport.length
                ? ` ${savedWithoutMaterialImport.join(", ")} was saved for viewing, but no materials were imported because a Material Name column was not found.`
                : "";

            const storageNotice = sharedMaterialCount
                ? ` ${sharedMaterialCount} material record${sharedMaterialCount === 1 ? "" : "s"} also synced to Supabase.`
                : localOnlyMaterialCount
                    ? ` Saved locally only. Sign in as a teammate when you want to sync these materials to Supabase.`
                    : "";

            const warningNotice = syncWarnings.length
                ? ` Supabase sync was skipped: ${syncWarnings.join(" | ")}`
                : "";

            showMessage(
                `${added} file${added === 1 ? "" : "s"} uploaded successfully. ` +
                `${importedMaterialCount} material record` +
                `${importedMaterialCount === 1 ? "" : "s"} imported` +
                `${sourceDescription}.${storageNotice}${viewOnlyNotice}${warningNotice}`
            );
    }
    fileInput.value = "";
    await refreshFileList();
}

function showMessage(message, isError = false) {
    if (!fileMessage) {
        (isError ? console.error : console.info)(message);
        return;
    }
    fileMessage.textContent = message;
    fileMessage.classList.toggle("error-message", isError);
}

async function refreshFileList() {
    savedFiles = (await readAllFiles()).sort(
        (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );
    if (uploadedFileCount) uploadedFileCount.textContent = savedFiles.length;
    if (fileTableBody) renderFileList();
}

function renderFileList() {
    if (!fileTableBody) return;
    const query = String(fileSearch?.value ?? "").trim().toLowerCase();
    const visibleFiles = savedFiles.filter((file) =>
        String(file.name || "Unnamed file").toLowerCase().includes(query)
    );
    fileTableBody.replaceChildren();

    if (!visibleFiles.length) {
        const row = document.createElement("tr");
        row.className = "empty-row";
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = savedFiles.length ? "No files match your search." : "No files have been uploaded yet.";
        row.appendChild(cell);
        fileTableBody.appendChild(row);
        return;
    }

    visibleFiles.forEach((file) => {
        const row = document.createElement("tr");
        row.append(
            textCell(file.name || "Unnamed file", "file-name-cell"),
            textCell(file.originalType || "FILE"),
            textCell(String(Math.max((file.rows?.length || 1) - 1, 0))),
            textCell(formatDate(file.dateAdded)),
            textCell(formatDate(file.dateModified)),
            actionCell(file)
        );
        fileTableBody.appendChild(row);
    });
}

function textCell(text, className = "") {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
}

function actionCell(file) {
    const cell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "file-actions";
    [
        ["View", () => openViewer(file, false)],
        ["Edit", () => openViewer(file, true)],
        ["Rename", () => renameSavedFile(file)],
        ["Delete", () => deleteSavedFile(file)]
    ].forEach(([label, handler]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = label === "Delete" ? "table-action danger-action" : "table-action";
        button.addEventListener("click", handler);
        actions.appendChild(button);
    });
    cell.appendChild(actions);
    return cell;
}

async function renameSavedFile(file) {
    const extension = extensionOf(file.name);
    const requestedName = window.prompt("Enter a new file name:", baseName(file.name));
    if (requestedName === null) return;
    const cleanName = requestedName.trim().replace(/[\\/:*?"<>|]/g, "-");
    if (!cleanName) {
        showMessage("The file name cannot be empty.", true);
        return;
    }
    file.name = `${cleanName}.${extension}`;
    file.dateModified = new Date().toISOString();
    await putFile(file);
    showMessage(`Renamed file to ${file.name}.`);
    await refreshFileList();
}

async function deleteSavedFile(file) {
    if (!window.confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    try {
        /* Delete the published import first. If that fails, retain the local
           record so its Supabase identity is not lost. */
        if (file.sharedFileId) {
            if (!window.varcoApi?.deleteFile) {
                throw new Error("Supabase deletion is unavailable. Refresh and try again.");
            }
            await window.varcoApi.deleteFile({
                id: file.sharedFileId,
                storagePath: file.sharedStoragePath
            });
        }
        await removeFile(file.id);
        if (activeFile && activeFile.id === file.id) closeViewer();
        showMessage(`${file.name} and its imported materials were deleted.`);
        await refreshFileList();
    } catch (error) {
        showMessage(`Nothing was deleted locally: ${error.message}`, true);
    }
}

function openViewer(file, startEditing) {
    activeFile = file;
    activeSheetIndex = initialSheetIndex(file);
    fileViewer.hidden = false;
    viewerTitle.textContent = file.name;
    loadActiveSheet();
    setEditing(startEditing);
    fileViewer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function availableSheets(file) {
    if (Array.isArray(file.workbookSheets) && file.workbookSheets.length) {
        return file.workbookSheets;
    }

    return [{
        sheetName: file.sheetName || "Imported data",
        rows: Array.isArray(file.rows) ? file.rows : []
    }];
}

function initialSheetIndex(file) {
    const sheets = availableSheets(file);
    const preferredNames = ["unifiedmaterials", "csvimport"];

    for (const preferredName of preferredNames) {
        const index = sheets.findIndex(
            (sheet) => normalizedHeader(sheet.sheetName) === preferredName
        );
        if (index >= 0) return index;
    }

    return 0;
}

function loadActiveSheet() {
    const sheets = availableSheets(activeFile);
    const sheet = sheets[activeSheetIndex] || sheets[0];
    const sourceRows = Array.isArray(sheet.rows) ? sheet.rows : [];

    workingRows = sourceRows.length
        ? sourceRows.map((row) =>
            Array.isArray(row) ? [...row] : [String(row ?? "")]
        )
        : [["This sheet does not contain viewable rows."]];

    viewerDetails.textContent =
        `${activeFile.originalType || "FILE"} • ` +
        `${Math.max(workingRows.length - 1, 0)} data row(s) • ` +
        `Sheet: ${sheet.sheetName || "Imported data"}`;

    renderSheetTabs();
}

function renderSheetTabs() {
    const sheets = availableSheets(activeFile);
    sheetTabs.hidden = sheets.length <= 1;
    sheetTabs.replaceChildren();

    sheets.forEach((sheet, index) => {
        const button = document.createElement("button");
        const selected = index === activeSheetIndex;

        button.type = "button";
        button.className = `sheet-tab${selected ? " active" : ""}`;
        button.textContent = sheet.sheetName || `Sheet ${index + 1}`;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        button.disabled = editing && !selected;
        button.addEventListener("click", () => switchSheet(index));
        sheetTabs.appendChild(button);
    });
}

function switchSheet(index) {
    if (editing || !activeFile || index === activeSheetIndex) return;
    activeSheetIndex = index;
    loadActiveSheet();
    renderSpreadsheet();
}

function closeViewer() {
    activeFile = null;
    activeSheetIndex = 0;
    workingRows = [];
    editing = false;
    fileViewer.hidden = true;
}

function setEditing(shouldEdit) {
    editing = shouldEdit;
    editFileButton.hidden = editing;
    editorButtons.hidden = !editing;
    editHelp.hidden = !editing;
    renderSheetTabs();
    renderSpreadsheet();
}

function renderSpreadsheet() {
    const table = document.createElement("table");
    table.className = "spreadsheet-table";
    const body = document.createElement("tbody");
    workingRows.forEach((rowValues, rowIndex) => {
        const row = document.createElement("tr");
        rowValues.forEach((value, columnIndex) => {
            const cell = document.createElement(rowIndex === 0 ? "th" : "td");
            cell.textContent = value;
            if (editing) {
                cell.contentEditable = "true";
                cell.spellcheck = false;
                cell.addEventListener("input", () => {
                    workingRows[rowIndex][columnIndex] = cell.textContent;
                });
            }
            row.appendChild(cell);
        });
        body.appendChild(row);
    });
    table.appendChild(body);
    spreadsheetContainer.replaceChildren(table);
}

function addRow() {
    const width = workingRows[0]?.length || 1;
    workingRows.push(Array(width).fill(""));
    renderSpreadsheet();
}

function addColumn() {
    if (!workingRows.length) workingRows.push([]);
    workingRows.forEach((row, index) => row.push(index === 0 ? `New Column ${row.length + 1}` : ""));
    renderSpreadsheet();
}

async function saveEdits() {
    const savedRows = workingRows.map((row) => [...row]);
    const sheets = availableSheets(activeFile);

    if (Array.isArray(activeFile.workbookSheets) && activeFile.workbookSheets.length) {
        activeFile.workbookSheets[activeSheetIndex].rows = savedRows;
    } else {
        activeFile.rows = savedRows;
    }

    /* Keep the legacy rows field synchronized when it represents this sheet. */
    if (sheets.length === 1) {
        activeFile.rows = savedRows;
    }
    activeFile.dateModified = new Date().toISOString();
    await putFile(activeFile);
    showMessage(`Changes to ${activeFile.name} were saved.`);
    await refreshFileList();
    setEditing(false);
}

function downloadActiveFile() {
    if (!activeFile) return;
    const sheet = availableSheets(activeFile)[activeSheetIndex];
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeSheetName = String(sheet.sheetName || "sheet")
        .replace(/[\\/:*?"<>|]/g, "-");
    link.download = `${baseName(activeFile.name)}-${safeSheetName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

function initializeCsvFilesPage() {
    fileInput = document.getElementById("file-input") ||
        document.querySelector('input[type="file"]');
    chooseFilesButton = document.getElementById("choose-files-button") ||
        document.querySelector('[data-action="choose-files"]');
    uploadZone = document.getElementById("upload-zone") ||
        chooseFilesButton?.closest(".upload-zone") || null;
    fileMessage = document.getElementById("file-message");
    fileSearch = document.getElementById("file-search");
    fileTableBody = document.getElementById("file-table-body");
    uploadedFileCount = document.getElementById("uploaded-file-count");
    fileViewer = document.getElementById("file-viewer");
    viewerTitle = document.getElementById("viewer-title");
    viewerDetails = document.getElementById("viewer-details");
    sheetTabs = document.getElementById("sheet-tabs");
    spreadsheetContainer = document.getElementById("spreadsheet-container");
    editFileButton = document.getElementById("edit-file-button");
    downloadFileButton = document.getElementById("download-file-button");
    closeViewerButton = document.getElementById("close-viewer-button");
    editorButtons = document.getElementById("editor-buttons");
    editHelp = document.getElementById("edit-help");
    cancelEditButton = document.getElementById("cancel-edit-button");
    addRowButton = document.getElementById("add-row-button");
    addColumnButton = document.getElementById("add-column-button");
    saveFileButton = document.getElementById("save-file-button");

    if (!fileInput || !chooseFilesButton) {
        console.error(
            'CSV upload could not start. The page needs an input with id="file-input" ' +
            'and a button with id="choose-files-button".'
        );
        return;
    }

    /* type="button" prevents a button inside a form from submitting and
       reloading the page before the file picker can open. */
    chooseFilesButton.type = "button";
    chooseFilesButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
        if (!fileInput.files?.length) return;
        await handleFiles(fileInput.files);
    });

    fileSearch?.addEventListener("input", renderFileList);

    uploadZone?.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadZone.classList.add("dragging");
    });
    uploadZone?.addEventListener("dragleave", () =>
        uploadZone.classList.remove("dragging")
    );
    uploadZone?.addEventListener("drop", async (event) => {
        event.preventDefault();
        uploadZone.classList.remove("dragging");
        if (event.dataTransfer?.files?.length) {
            await handleFiles(event.dataTransfer.files);
        }
    });

    editFileButton?.addEventListener("click", () => setEditing(true));
    downloadFileButton?.addEventListener("click", downloadActiveFile);
    closeViewerButton?.addEventListener("click", closeViewer);
    cancelEditButton?.addEventListener("click", () => {
        loadActiveSheet();
        setEditing(false);
    });
    addRowButton?.addEventListener("click", addRow);
    addColumnButton?.addEventListener("click", addColumn);
    saveFileButton?.addEventListener("click", saveEdits);

    refreshFileList().catch((error) =>
        showMessage(`Files could not be loaded: ${error.message}`, true)
    );
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCsvFilesPage, { once: true });
} else {
    initializeCsvFilesPage();
}