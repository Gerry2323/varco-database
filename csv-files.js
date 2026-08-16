"use strict";

const DB_NAME = "varcoFileDatabase";
const DB_VERSION = 1;
const STORE_NAME = "files";

const fileInput = document.getElementById("file-input");
const chooseFilesButton = document.getElementById("choose-files-button");
const uploadZone = document.getElementById("upload-zone");
const fileMessage = document.getElementById("file-message");
const fileSearch = document.getElementById("file-search");
const fileTableBody = document.getElementById("file-table-body");
const uploadedFileCount = document.getElementById("uploaded-file-count");
const fileViewer = document.getElementById("file-viewer");
const viewerTitle = document.getElementById("viewer-title");
const viewerDetails = document.getElementById("viewer-details");
const sheetTabs = document.getElementById("sheet-tabs");
const spreadsheetContainer = document.getElementById("spreadsheet-container");
const editFileButton = document.getElementById("edit-file-button");
const downloadFileButton = document.getElementById("download-file-button");
const closeViewerButton = document.getElementById("close-viewer-button");
const editorButtons = document.getElementById("editor-buttons");
const editHelp = document.getElementById("edit-help");
const cancelEditButton = document.getElementById("cancel-edit-button");
const addRowButton = document.getElementById("add-row-button");
const addColumnButton = document.getElementById("add-column-button");
const saveFileButton = document.getElementById("save-file-button");

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
    "Supplier", "Product Name", "Product Number", "Powder Family",
    "Density (g/cm³)", "Density Min (g/cm³)", "Density Max (g/cm³)",
    "Density as Reported", "Density Type",
    "Porosity (%)", "Hardness Value", "Hardness Scale and Load",
    "Young's Modulus (GPa)", "Young's Modulus Min (GPa)",
    "Young's Modulus Max (GPa)", "Poisson's Ratio",
    "Yield Strength Min (MPa)", "Yield Strength Max (MPa)",
    "Compressive Strength Min (MPa)", "Compressive Strength Max (MPa)",
    "Tensile Strength (MPa)", "Tensile Strength Min (MPa)",
    "Tensile Strength Max (MPa)",
    "Fracture Toughness (MPa·m^0.5)",
    "Fracture Toughness Min (MPa·m^0.5)",
    "Fracture Toughness Max (MPa·m^0.5)",
    "Melting Point (°C)", "Melting Point Min (°C)",
    "Melting Point Max (°C)", "Melting Point as Reported",
    "Softening Temperature Min (°C)", "Softening Temperature Max (°C)",
    "Maximum Service Temperature (°C)", "Thermal Conductivity (W/m·K)",
    "Thermal Expansion (µm/m·K)", "Electrical Property",
    "Corrosion Resistance", "Oxidation Resistance",
    "Recommended Spray Processes", "Wear Mechanisms",
    "Intended Applications", "Reported Advantages", "Reported Limitations",
    "Source Type", "Source Title", "Source Author or Organization",
    "Publication Year", "Source Filename", "Source Page",
    "Table or Figure Number", "DOI or URL", "Document Link",
    "Test Standards", "Data Quality Status", "Notes",
    "Record ID", "Record Type", "Data Source Group", "Parent Material",
    "Classification", "Color", "Abbreviation", "Applications",
    "Flammability Rating", "Fresh Water Rating", "Salt Water Rating",
    "Sunlight/UV Rating", "Wear Resistance Rating", "Environmental Rating Scale",
    "Compatible Shaping Processes", "Atomic Symbol", "Atomic Number",
    "Relative Atomic Weight", "Crystal Structure at 20°C",
    "Lattice Constant a/b (Å)", "Lattice Constant c (Å)",
    "Electrode Potential (V)", "Electrode Reaction", "Oxidation Product",
    "Oxidation Free Energy (kJ/mol O₂)", "Additional Source Page/Section",
    "Catalog URL", "Access Date", "Maximum Service Temperature (°F)",
    "Particle Size Range as Reported"
];

function normalizedHeader(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[₂³µμ°'’".,()/%·^_-]/g, "")
        .replace(/\s+/g, "");
}

const COLUMN_ALIASES = {
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
    "Powder Family": ["powder_family"],
    "Density (g/cm³)": [
        "density", "material density"
    ],
    "Density Min (g/cm³)": ["density_min_g_cm3", "minimum density"],
    "Density Max (g/cm³)": ["density_max_g_cm3", "maximum density"],
    "Density as Reported": ["density_value_reported", "density reported"],
    "Density Type": ["density_type"],
    "Porosity (%)": ["porosity_percent", "porosity"],
    "Young's Modulus (GPa)": ["youngs modulus", "elastic modulus", "young modulus"],
    "Young's Modulus Min (GPa)": ["young_modulus_min_gpa", "youngs modulus min"],
    "Young's Modulus Max (GPa)": ["young_modulus_max_gpa", "youngs modulus max"],
    "Yield Strength Min (MPa)": ["yield_stress_min_mpa", "yield strength min"],
    "Yield Strength Max (MPa)": ["yield_stress_max_mpa", "yield strength max"],
    "Compressive Strength Min (MPa)": ["compressive_strength_min_mpa"],
    "Compressive Strength Max (MPa)": ["compressive_strength_max_mpa"],
    "Tensile Strength Min (MPa)": ["tensile_strength_min_mpa"],
    "Tensile Strength Max (MPa)": ["tensile_strength_max_mpa"],
    "Fracture Toughness Min (MPa·m^0.5)": ["fracture_toughness_min_mpa_sqrt_m"],
    "Fracture Toughness Max (MPa·m^0.5)": ["fracture_toughness_max_mpa_sqrt_m"],
    "Melting Point (°C)": [
        "melting point", "melt point", "solidus liquidus"
    ],
    "Melting Point Min (°C)": ["melting_point_min_c", "minimum melting point"],
    "Melting Point Max (°C)": ["melting_point_max_c", "maximum melting point"],
    "Melting Point as Reported": ["melting_point_reported"],
    "Softening Temperature Min (°C)": ["softening_temperature_min_c"],
    "Softening Temperature Max (°C)": ["softening_temperature_max_c"],
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
    "Notes": ["data_quality_note", "quality note"],
    "Record ID": ["record_id"],
    "Record Type": ["record_type"],
    "Data Source Group": ["data_source_group"],
    "Parent Material": ["parent_material"],
    "Classification": ["classification"],
    "Color": ["color"],
    "Abbreviation": ["abbreviation"],
    "Applications": ["applications"],
    "Flammability Rating": ["flammability_rating"],
    "Fresh Water Rating": ["fresh_water_rating"],
    "Salt Water Rating": ["salt_water_rating"],
    "Sunlight/UV Rating": ["sunlight_uv_rating"],
    "Wear Resistance Rating": ["wear_resistance_rating"],
    "Environmental Rating Scale": ["environment_rating_scale"],
    "Compatible Shaping Processes": ["compatible_shaping_processes"],
    "Atomic Symbol": ["atomic_symbol"],
    "Atomic Number": ["atomic_number"],
    "Relative Atomic Weight": ["relative_atomic_weight"],
    "Crystal Structure at 20°C": ["crystal_structure_20c"],
    "Lattice Constant a/b (Å)": ["lattice_constant_a_b_angstrom"],
    "Lattice Constant c (Å)": ["lattice_constant_c_angstrom"],
    "Electrode Potential (V)": ["electrode_potential_v"],
    "Electrode Reaction": ["electrode_reaction"],
    "Oxidation Product": ["oxidation_product"],
    "Oxidation Free Energy (kJ/mol O₂)": ["oxidation_free_energy_kj_per_mol_o2"],
    "Additional Source Page/Section": ["additional_source_page_section"],
    "Catalog URL": ["catalog_url"],
    "Access Date": ["access_date"],
    "Maximum Service Temperature (°F)": ["max_service_temp_f"],
    "Particle Size Range as Reported": ["particle_size_range_reported"]
};

function findSourceColumn(headers, canonicalColumn) {
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
    const canonicalIndexes = MATERIAL_CSV_COLUMNS.map((column) => {
        const index = findSourceColumn(originalHeaders, column);
        if (index >= 0) usedIndexes.add(index);
        return index;
    });
    const extraIndexes = originalHeaders
        .map((_, index) => index)
        .filter((index) => !usedIndexes.has(index) && originalHeaders[index]);
    const outputHeaders = [
        ...MATERIAL_CSV_COLUMNS,
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
            const standardized = MATERIAL_CSV_COLUMNS.map((column, columnIndex) => {
                const sourceIndex = canonicalIndexes[columnIndex];
                const value = sourceIndex >= 0 ? String(row[sourceIndex] ?? "").trim() : "";

                if (value) return value;
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

function sharedMaterialFromRow(headers, row, filename) {
    const completeRecord = {};
    headers.forEach((header, index) => {
        if (header) completeRecord[header] = row[index] || "Not Reported";
    });

    const valueFor = (heading, fallback = "Not Reported") => {
        const index = headers.indexOf(heading);
        const value = index >= 0 ? String(row[index] ?? "").trim() : "";
        return value && value !== "Not Reported" ? value : fallback;
    };
    const listFor = (heading) => {
        const value = valueFor(heading, "");
        return value ? value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean) : [];
    };

    const reportedSourceFilename = valueFor("Source Filename", "");
    const normalizedRecord = window.VarcoSchema
        ? window.VarcoSchema.rowToMaterial(headers, row)
        : {};

    return {
        ...completeRecord,
        ...normalizedRecord,
        name: valueFor("Material Name", "Unnamed material"),
        category: valueFor("Category"),
        composition: valueFor("Composition"),
        compositionBasis: valueFor("Composition Basis", "Not specified"),
        feedstockForm: valueFor("Feedstock Form"),
        manufacturingMethods: listFor("Manufacturing Methods"),
        morphologies: listFor("Morphologies"),
        supplier: valueFor("Supplier"),
        productName: valueFor("Product Name"),
        productNumber: valueFor("Product Number"),
        sourceType: valueFor("Source Type", "Other"),
        sourceTitle: valueFor("Source Title", filename),
        /* Ownership must follow the file that was actually uploaded. Keep a
           filename reported inside the spreadsheet only as reference data. */
        sourceFilename: filename,
        reportedSourceFilename: reportedSourceFilename || "Not Reported",
        documentLink: valueFor("Document Link", valueFor("DOI or URL")),
        origin: "shared-csv"
    };
}

async function handleFiles(fileList) {
    const allowed = ["csv", "tsv", "xls", "xlsx"];
    let added = 0;
    let importedMaterialCount = 0;
    let importedFromPreferredSheet = "";
    let sharedImportedMaterialCount = 0;
    let localOnlyFileCount = 0;
    const savedWithoutMaterialImport = [];
    const sharedUploadWarnings = [];
    let signedInUser = null;
    let sharedCatalogVerified = false;
    const sharedFilenames = new Set();
    if (window.varcoApi) {
        try {
            signedInUser = await window.varcoApi.currentUser();
            if (signedInUser) {
                const sharedFiles = await window.varcoApi.listFiles();
                sharedFiles.forEach((sharedFile) => {
                    sharedFilenames.add(String(sharedFile.name || "").trim().toLowerCase());
                });
                sharedCatalogVerified = true;
            }
        } catch (error) {
            console.warn("Editor status could not be checked; continuing in local-only mode:", error);
        }
    }

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
            const now = new Date().toISOString();
            const existingFile = savedFiles.find(
                (savedFile) => savedFile.name.toLowerCase() === file.name.toLowerCase()
            );
            const localFileRecord = {
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
                dateAdded: existingFile ? existingFile.dateAdded : now,
                dateModified: now
            };
            await putFile(localFileRecord);

            const normalizedFilename = file.name.trim().toLowerCase();
            const duplicateSharedFilename = sharedFilenames.has(normalizedFilename);

            if (signedInUser && !sharedCatalogVerified) {
                localOnlyFileCount += 1;
                sharedUploadWarnings.push(
                    `${file.name} stayed local because the existing shared filenames could not be verified.`
                );
            } else if (signedInUser && duplicateSharedFilename) {
                localOnlyFileCount += 1;
                sharedUploadWarnings.push(
                    `${file.name} stayed local because a shared file with that exact name already exists. ` +
                    "Delete the existing shared file first or rename this file before publishing it."
                );
            } else if (signedInUser) {
                let sharedFile = null;
                try {
                    sharedFile = await window.varcoApi.uploadFile(file, {
                        fileType: extension.toUpperCase(),
                        rowCount: materialRowsInFile,
                        materialCount: materialRowsInFile,
                        sheetNames: parsedSheets.map((sheet) => sheet.sheetName)
                    });
                    localFileRecord.sharedFileId = sharedFile.id;
                    localFileRecord.sharedStoragePath = sharedFile.storage_path;
                    await putFile(localFileRecord);

                    if (hasMaterialTable) {
                        const sharedRecords = combinedRows.slice(1)
                            .map((row) => sharedMaterialFromRow(combinedRows[0], row, file.name))
                            .filter((record) => record.name && record.name !== "Unnamed material");

                        await window.varcoApi.importMaterials(sharedRecords, sharedFile.id);
                        sharedImportedMaterialCount += sharedRecords.length;
                    }
                    sharedFilenames.add(normalizedFilename);
                } catch (sharedError) {
                    if (sharedFile?.id) {
                        try {
                            await window.varcoApi.deleteFile({
                                id: sharedFile.id,
                                storagePath: sharedFile.storage_path
                            });
                        } catch (cleanupError) {
                            console.warn("Incomplete shared upload cleanup:", cleanupError);
                        }
                        delete localFileRecord.sharedFileId;
                        delete localFileRecord.sharedStoragePath;
                        await putFile(localFileRecord);
                    }
                    localOnlyFileCount += 1;
                    sharedUploadWarnings.push(
                        `${file.name} stayed local because Supabase rejected the upload: ${sharedError.message}`
                    );
                }
            } else {
                localOnlyFileCount += 1;
            }
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

            showMessage(
                `${added} file${added === 1 ? "" : "s"} uploaded successfully. ` +
                `${importedMaterialCount} material record` +
                `${importedMaterialCount === 1 ? "" : "s"} imported` +
                `${sourceDescription}. ` +
                (signedInUser
                    ? `${sharedImportedMaterialCount} material record${sharedImportedMaterialCount === 1 ? "" : "s"} published to the shared database.` +
                        (localOnlyFileCount
                            ? ` ${localOnlyFileCount} file${localOnlyFileCount === 1 ? " remains" : "s remain"} local only.`
                            : "")
                    : `${localOnlyFileCount} file${localOnlyFileCount === 1 ? " was" : "s were"} saved only on this browser. Sign in and upload again to publish to Supabase.`) +
                `${viewOnlyNotice}` +
                (sharedUploadWarnings.length ? ` ${sharedUploadWarnings.join(" ")}` : "")
            );
    }
    fileInput.value = "";
    await refreshFileList();
}

function showMessage(message, isError = false) {
    fileMessage.textContent = message;
    fileMessage.classList.toggle("error-message", isError);
}

async function refreshFileList() {
    const localFiles = await readAllFiles();
    let sharedFiles = [];
    let signedInUser = null;

    if (window.varcoApi) {
        try {
            signedInUser = await window.varcoApi.currentUser();
            if (signedInUser) {
                sharedFiles = await window.varcoApi.listFiles();
            }
        } catch (error) {
            console.warn("Shared uploaded files could not be loaded:", error);
        }
    }

    const matchedSharedIds = new Set();
    const combinedFiles = localFiles.map((localFile) => {
        const sharedFile = sharedFiles.find((candidate) =>
            candidate.id === localFile.sharedFileId
        );

        if (!sharedFile) return localFile;
        matchedSharedIds.add(sharedFile.id);
        return {
            ...localFile,
            sharedFileId: sharedFile.id,
            sharedStoragePath: sharedFile.storagePath,
            rowCount: sharedFile.rowCount,
            materialCount: sharedFile.materialCount
        };
    });

    sharedFiles.forEach((sharedFile) => {
        if (matchedSharedIds.has(sharedFile.id)) return;
        combinedFiles.push({
            id: `shared:${sharedFile.id}`,
            name: sharedFile.name,
            originalType: sharedFile.originalType,
            rowCount: sharedFile.rowCount,
            materialCount: sharedFile.materialCount,
            dateAdded: sharedFile.dateAdded,
            dateModified: sharedFile.dateModified,
            sharedFileId: sharedFile.id,
            sharedStoragePath: sharedFile.storagePath,
            sharedOnly: true,
            rows: []
        });
    });

    savedFiles = combinedFiles.sort(
        (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
    );
    uploadedFileCount.textContent = savedFiles.length;
    renderFileList();
}

function renderFileList() {
    const query = fileSearch.value.trim().toLowerCase();
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
            textCell(String(file.rowCount ?? Math.max((file.rows?.length || 1) - 1, 0))),
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
    const availableActions = file.sharedOnly
        ? [["Delete", () => deleteSavedFile(file)]]
        : [
            ["View", () => openViewer(file, false)],
            ["Edit", () => openViewer(file, true)],
            ["Rename", () => renameSavedFile(file)],
            ["Delete", () => deleteSavedFile(file)]
        ];

    availableActions.forEach(([label, handler]) => {
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
    const isSharedFile = Boolean(file.sharedFileId);
    const confirmation = isSharedFile
        ? `Delete "${file.name}" from Supabase and delete all materials imported from it? Manual materials and materials from other files will not be deleted. This cannot be undone.`
        : `Delete the local copy of "${file.name}" from this browser? This will not change Supabase.`;
    if (!window.confirm(confirmation)) return;

    try {
        if (isSharedFile) {
            if (!window.varcoApi) {
                throw new Error("The shared database connection did not load. Refresh and try again.");
            }
            if (!(await window.varcoApi.currentUser())) {
                throw new Error("Sign in as a verified editor before deleting this shared file.");
            }

            await window.varcoApi.deleteFile({
                id: file.sharedFileId,
                name: file.name,
                storagePath: file.sharedStoragePath
            });
        }

        if (!file.sharedOnly) await removeFile(file.id);
        if (activeFile && activeFile.id === file.id) closeViewer();

        showMessage(isSharedFile
            ? `${file.name} and its imported materials were deleted from Supabase.`
            : `${file.name} was deleted from this browser only.`);
        await refreshFileList();
    } catch (error) {
        showMessage(
            `Nothing was removed because the complete deletion could not be verified. ${error.message}`,
            true
        );
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

chooseFilesButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => handleFiles(fileInput.files));
fileSearch.addEventListener("input", renderFileList);
uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadZone.classList.add("dragging");
});
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragging"));
uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadZone.classList.remove("dragging");
    handleFiles(event.dataTransfer.files);
});
editFileButton.addEventListener("click", () => setEditing(true));
downloadFileButton.addEventListener("click", downloadActiveFile);
closeViewerButton.addEventListener("click", closeViewer);
cancelEditButton.addEventListener("click", () => {
    loadActiveSheet();
    setEditing(false);
});
addRowButton.addEventListener("click", addRow);
addColumnButton.addEventListener("click", addColumn);
saveFileButton.addEventListener("click", saveEdits);

refreshFileList().catch((error) => showMessage(`Files could not be loaded: ${error.message}`, true));