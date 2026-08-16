"use strict";


/* =========================================================
   MATERIAL DETAILS PAGE
   File: material-details.js

   This file:
   1. Reads the selected material ID from the URL.
   2. Loads manual materials from localStorage.
   3. Loads spreadsheet materials from IndexedDB.
   4. Finds the selected record.
   5. Displays its information on the page.
   ========================================================= */


/* =========================================================
   COLUMN-NAME ALIASES

   These aliases help the database recognize different column
   headings used in uploaded spreadsheets.
   ========================================================= */

const FIELD_ALIASES = {
    name: [
        "material name",
        "material",
        "name"
    ],

    category: [
        "category",
        "material category",
        "material type"
    ],

    composition: [
        "composition as reported",
        "composition",
        "chemical composition"
    ],

    compositionBasis: [
        "composition basis",
        "basis"
    ],

    manufacturingMethods: [
        "manufacturing method",
        "manufacturing methods",
        "production method"
    ],

    feedstockForm: [
        "feedstock form",
        "material form",
        "form"
    ],

    particleSizeMin: [
        "particle size min",
        "minimum particle size",
        "min particle size"
    ],

    particleSizeMax: [
        "particle size max",
        "maximum particle size",
        "max particle size"
    ],

    particleSizeAverage: [
        "particle size average",
        "average particle size",
        "d50",
        "particle size d50"
    ],

    morphology: [
        "particle morphology",
        "morphology",
        "morphologies"
    ],

    supplier: [
        "supplier",
        "manufacturer",
        "supplier or manufacturer"
    ],

    productName: [
        "product name",
        "trade name"
    ],

    productNumber: [
        "product number",
        "product id",
        "product code"
    ],

    country: [
        "country of origin",
        "country"
    ],

    density: [
        "density",
        "density value reported"
    ],

    densityMin: [
        "density min g cm3", "density min", "minimum density"
    ],

    densityMax: [
        "density max g cm3", "density max", "maximum density"
    ],

    densityReported: [
        "density value reported", "density as reported"
    ],

    densityType: [
        "density type"
    ],

    hardness: [
        "hardness",
        "hardness value"
    ],

    youngsModulus: [
        "young's modulus",
        "young s modulus",
        "youngs modulus",
        "elastic modulus"
    ],

    youngsModulusMin: [
        "young modulus min gpa",
        "young modulus min",
        "youngs modulus min",
        "young's modulus min",
        "young s modulus min"
    ],

    youngsModulusMax: [
        "young modulus max gpa",
        "young modulus max",
        "youngs modulus max",
        "young's modulus max",
        "young s modulus max"
    ],

    yieldStrengthMin: [
        "yield stress min mpa", "yield strength min"
    ],

    yieldStrengthMax: [
        "yield stress max mpa", "yield strength max"
    ],

    compressiveStrengthMin: [
        "compressive strength min mpa", "compressive strength min"
    ],
    compressiveStrengthMax: [
        "compressive strength max mpa", "compressive strength max"
    ],
    tensileStrengthMin: [
        "tensile strength min mpa", "tensile strength min"
    ],
    tensileStrengthMax: [
        "tensile strength max mpa", "tensile strength max"
    ],
    fractureToughnessMin: [
        "fracture toughness min mpa sqrt m", "fracture toughness min"
    ],
    fractureToughnessMax: [
        "fracture toughness max mpa sqrt m", "fracture toughness max"
    ],
    softeningTemperatureMin: [
        "softening temperature min c", "softening temperature min"
    ],
    softeningTemperatureMax: [
        "softening temperature max c", "softening temperature max"
    ],
    maxServiceTemperature: [
        "max service temp c", "maximum service temperature c",
        "maximum service temperature"
    ],
    applications: ["applications", "applications and reported characteristics"],
    environmentalRatingScale: ["environment rating scale"],
    flammabilityRating: ["flammability rating"],
    freshWaterRating: ["fresh water rating"],
    saltWaterRating: ["salt water rating"],
    sunlightUvRating: ["sunlight uv rating"],
    wearResistanceRating: ["wear resistance rating"],
    atomicSymbol: ["atomic symbol"],
    atomicNumber: ["atomic number"],
    relativeAtomicWeight: ["relative atomic weight"],
    crystalStructure: ["crystal structure 20c"],
    latticeConstantAB: ["lattice constant a b angstrom"],
    latticeConstantC: ["lattice constant c angstrom"],
    evidenceClass: ["evidence class"],
    dataQualityNote: ["data quality note"],
    sourcePageSection: ["source page section", "additional source page section"],
    sourceUrl: ["source url"],

    meltingPoint: [
        "melting point",
        "melting temperature",
        "melting point reported"
    ],

    meltingPointMin: [
        "melting point min c", "melting point min", "minimum melting point"
    ],
    meltingPointMax: [
        "melting point max c", "melting point max", "maximum melting point"
    ],
    meltingPointReported: ["melting point reported", "melting point as reported"],

    thermalConductivity: [
        "thermal conductivity"
    ],

    thermalExpansion: [
        "coefficient of thermal expansion",
        "thermal expansion",
        "cte"
    ],

    sprayProcesses: [
        "recommended spray processes",
        "recommended spray process",
        "spray processes",
        "spray process"
    ],

    substrate: [
        "substrate",
        "substrate material"
    ],

    coatingThickness: [
        "coating thickness",
        "thickness"
    ],

    surfacePreparation: [
        "surface preparation",
        "surface prep"
    ],

    standards: [
        "standards",
        "standard",
        "test standards",
        "test methods"
    ],

    dataQualityStatus: [
        "data quality status",
        "data quality",
        "quality status"
    ],

    sourceType: [
        "source type"
    ],

    sourceTitle: [
        "source title",
        "article title",
        "reference"
    ],

    sourceFilename: [
        "source filename",
        "filename",
        "file name"
    ],

    documentLink: [
        "document link",
        "source link",
        "url",
        "link"
    ],

    dateAdded: [
        "date added",
        "added"
    ],

    notes: [
        "research notes",
        "notes",
        "comments"
    ]
};


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const elements = {
    status: document.getElementById(
        "material-detail-status"
    ),

    content: document.getElementById(
        "material-detail-content"
    ),

    addToComparisonButton: document.getElementById(
        "add-to-comparison-button"
    ),

    editButton: document.getElementById(
        "edit-material-button"
    )
};


/* =========================================================
   BASIC DATA HELPERS
   ========================================================= */

/*
   Returns a clean text value.

   Empty, null, and undefined values become an empty string.
*/
function clean(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


/*
   Creates a normalized version of a spreadsheet heading.

   Example:
   "Particle Size (µm)" becomes "particle size".
*/
function normalizeHeading(value) {
    return clean(value)
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        /* Keep unit text inside parentheses so (GPa), (MPa), etc. can match. */
        .replace(/[()]/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/*
   Converts a value containing several items into an array.

   Recognized separators:
   - Commas
   - Semicolons
   - Vertical bars
   - Line breaks
*/
function list(value) {
    if (Array.isArray(value)) {
        return value
            .map(clean)
            .filter(Boolean);
    }

    const text = clean(value);

    if (!text) {
        return [];
    }

    return text
        .split(/[,;|\n]+/)
        .map(clean)
        .filter(Boolean);
}


/*
   Returns the first matching value from an object.

   This allows older manual records to use slightly different
   property names without breaking the Material Details page.
*/
function firstValue(record, propertyNames) {
    for (const propertyName of propertyNames) {
        const value = record[propertyName];

        if (
            Array.isArray(value) &&
            value.length
        ) {
            return value;
        }

        if (clean(value)) {
            return value;
        }
    }

    return "";
}


/* =========================================================
   READ A VALUE FROM A SPREADSHEET ROW
   ========================================================= */

function valueFromRow(headers, row, fieldName) {
    const acceptedHeadings =
        FIELD_ALIASES[fieldName] || [];

    const normalizedAliases =
        acceptedHeadings.map(normalizeHeading);

    /* Some uploader versions store each CSV row as an object. */
    if (row && !Array.isArray(row) && typeof row === "object") {
        for (const [heading, value] of Object.entries(row)) {
            if (normalizedAliases.includes(normalizeHeading(heading))) {
                return clean(value);
            }
        }
    }

    const columnIndex = headers.findIndex(
        (heading) =>
            normalizedAliases.includes(
                normalizeHeading(heading)
            )
    );

    if (columnIndex === -1) {
        return "";
    }

    return clean(row[columnIndex]);
}


/* =========================================================
   STANDARDIZE ONE MATERIAL RECORD

   Both manual records and spreadsheet records pass through this
   function so that the detail page uses consistent field names.
   ========================================================= */

function standardizeMaterial(record, id, origin) {
    return {
        ...record,

        id: id,

        origin: origin,

        name: firstValue(
            record,
            ["name", "materialName"]
        ),

        category: firstValue(
            record,
            ["category", "materialCategory"]
        ),

        composition: firstValue(
            record,
            [
                "composition",
                "compositionReported",
                "compositionAsReported"
            ]
        ),

        compositionBasis: firstValue(
            record,
            ["compositionBasis", "basis"]
        ),

        manufacturingMethods: list(
            firstValue(
                record,
                [
                    "manufacturingMethods",
                    "manufacturingMethod"
                ]
            )
        ),

        feedstockForm: firstValue(
            record,
            ["feedstockForm", "form"]
        ),

        particleSizeMin: firstValue(
            record,
            [
                "particleSizeMin",
                "minimumParticleSize"
            ]
        ),

        particleSizeMax: firstValue(
            record,
            [
                "particleSizeMax",
                "maximumParticleSize"
            ]
        ),

        particleSizeAverage: firstValue(
            record,
            [
                "particleSizeAverage",
                "averageParticleSize",
                "d50"
            ]
        ),

        morphology: firstValue(
            record,
            ["morphology", "particleMorphology"]
        ),

        supplier: firstValue(
            record,
            ["supplier", "manufacturer"]
        ),

        productName: firstValue(
            record,
            ["productName", "tradeName"]
        ),

        productNumber: firstValue(
            record,
            [
                "productNumber",
                "productCode",
                "productId"
            ]
        ),

        country: firstValue(
            record,
            ["country", "countryOfOrigin"]
        ),

        density: firstValue(
            record,
            ["density"]
        ),
        densityMin: firstValue(record, ["densityMin"]),
        densityMax: firstValue(record, ["densityMax"]),

        hardness: firstValue(
            record,
            ["hardness"]
        ),

        youngsModulus: firstValue(
            record,
            [
                "youngsModulus",
                "youngModulus",
                "elasticModulus"
            ]
        ),
        youngsModulusMin: firstValue(record, ["youngsModulusMin"]),
        youngsModulusMax: firstValue(record, ["youngsModulusMax"]),

        yieldStrength: firstValue(record, ["yieldStrength"]),
        yieldStrengthMin: firstValue(record, ["yieldStrengthMin"]),
        yieldStrengthMax: firstValue(record, ["yieldStrengthMax"]),

        compressiveStrength: firstValue(record, ["compressiveStrength"]),
        compressiveStrengthMin: firstValue(record, ["compressiveStrengthMin"]),
        compressiveStrengthMax: firstValue(record, ["compressiveStrengthMax"]),

        tensileStrength: firstValue(record, ["tensileStrength"]),
        tensileStrengthMin: firstValue(record, ["tensileStrengthMin"]),
        tensileStrengthMax: firstValue(record, ["tensileStrengthMax"]),

        fractureToughness: firstValue(record, ["fractureToughness"]),
        fractureToughnessMin: firstValue(record, ["fractureToughnessMin"]),
        fractureToughnessMax: firstValue(record, ["fractureToughnessMax"]),

        softeningTemperature: firstValue(record, ["softeningTemperature"]),
        softeningTemperatureMin: firstValue(record, ["softeningTemperatureMin"]),
        softeningTemperatureMax: firstValue(record, ["softeningTemperatureMax"]),

        maxServiceTemperature: firstValue(record, ["maxServiceTemperature"]),

        environmentalRatingScale: firstValue(record, ["environmentalRatingScale"]),
        flammabilityRating: firstValue(record, ["flammabilityRating"]),
        freshWaterRating: firstValue(record, ["freshWaterRating"]),
        saltWaterRating: firstValue(record, ["saltWaterRating"]),
        sunlightUvRating: firstValue(record, ["sunlightUvRating"]),
        wearResistanceRating: firstValue(record, ["wearResistanceRating"]),
        environmentalResistance: firstValue(record, ["environmentalResistance"]),

        meltingPoint: firstValue(
            record,
            ["meltingPoint"]
        ),
        meltingPointMin: firstValue(record, ["meltingPointMin"]),
        meltingPointMax: firstValue(record, ["meltingPointMax"]),

        thermalConductivity: firstValue(
            record,
            ["thermalConductivity"]
        ),

        thermalExpansion: firstValue(
            record,
            [
                "thermalExpansion",
                "coefficientOfThermalExpansion",
                "cte"
            ]
        ),

        sprayProcesses: list(
            firstValue(
                record,
                [
                    "sprayProcesses",
                    "recommendedSprayProcesses",
                    "sprayProcess"
                ]
            )
        ),

        substrate: firstValue(
            record,
            ["substrate"]
        ),

        coatingThickness: firstValue(
            record,
            ["coatingThickness"]
        ),

        surfacePreparation: firstValue(
            record,
            ["surfacePreparation"]
        ),

        standards: firstValue(
            record,
            [
                "standards",
                "testStandards",
                "testMethods"
            ]
        ),

        dataQualityStatus: firstValue(
            record,
            [
                "dataQualityStatus",
                "dataQuality",
                "qualityStatus"
            ]
        ),

        sourceType: firstValue(
            record,
            ["sourceType"]
        ),

        sourceTitle: firstValue(
            record,
            [
                "sourceTitle",
                "articleTitle",
                "reference"
            ]
        ),

        sourceFilename: firstValue(
            record,
            ["sourceFilename", "filename"]
        ),

        documentLink: firstValue(
            record,
            [
                "documentLink",
                "sourceLink",
                "url"
            ]
        ),

        dateAdded: firstValue(
            record,
            ["dateAdded", "date"]
        ),

        notes: firstValue(
            record,
            ["notes", "researchNotes", "comments"]
        )
    };
}


/* =========================================================
   LOAD MANUAL MATERIALS FROM LOCALSTORAGE
   ========================================================= */

function manualMaterials() {
    try {
        const savedValue =
            localStorage.getItem("varcoMaterials");

        const records =
            savedValue
                ? JSON.parse(savedValue)
                : [];

        if (!Array.isArray(records)) {
            return [];
        }

        return records.map((record, index) => {
            /*
               Use the existing ID when available.

               Otherwise, create the same ID format used by the
               Current Materials page.
            */
            const id =
                clean(record.id) ||
                `manual:${index}`;

            return standardizeMaterial(
                record,
                id,
                "manual"
            );
        });
    } catch (error) {
        console.error(
            "Manual materials could not be read.",
            error
        );

        return [];
    }
}


/* =========================================================
   CONVERT ONE SPREADSHEET ROW INTO A MATERIAL
   ========================================================= */

function materialFromSpreadsheetRow(
    file,
    headers,
    row,
    rowNumber
) {
    const record = window.VarcoSchema
        ? window.VarcoSchema.rowToMaterial(headers, row)
        : {};

    Object.keys(FIELD_ALIASES).forEach(
        (fieldName) => {
            record[fieldName] = valueFromRow(
                headers,
                row,
                fieldName
            ) || record[fieldName] || "";
        }
    );

    /* Preserve every imported Cambridge column for the All Imported Fields card. */
    record.rawProperties = {};
    headers.forEach((header, index) => {
        const label = clean(header);
        const value = clean(row[index]);
        if (label && value) record.rawProperties[label] = value;
    });

    const reportedRange = (reported, minimum, maximum, unit) => {
        const low = clean(minimum);
        const high = clean(maximum);
        if (low && high) return `Min: ${low} ${unit} | Max: ${high} ${unit}`;
        if (low) return `Min: ${low} ${unit}`;
        if (high) return `Max: ${high} ${unit}`;
        return clean(reported);
    };

    record.density = reportedRange(record.densityReported, record.densityMin, record.densityMax, "g/cm³") || record.density;
    record.youngsModulus = reportedRange("", record.youngsModulusMin, record.youngsModulusMax, "GPa") || record.youngsModulus;
    record.yieldStrength = reportedRange("", record.yieldStrengthMin, record.yieldStrengthMax, "MPa") || record.yieldStrength;
    record.compressiveStrength = reportedRange("", record.compressiveStrengthMin, record.compressiveStrengthMax, "MPa") || record.compressiveStrength;
    record.tensileStrength = reportedRange("", record.tensileStrengthMin, record.tensileStrengthMax, "MPa") || record.tensileStrength;
    record.fractureToughness = reportedRange("", record.fractureToughnessMin, record.fractureToughnessMax, "MPa·√m") || record.fractureToughness;
    record.softeningTemperature = reportedRange("", record.softeningTemperatureMin, record.softeningTemperatureMax, "°C") || record.softeningTemperature;
    record.meltingPoint = reportedRange(record.meltingPointReported, record.meltingPointMin, record.meltingPointMax, "°C") || record.meltingPoint;

    const environmentalParts = [
        ["Fresh water", record.freshWaterRating],
        ["Salt water", record.saltWaterRating],
        ["Sunlight/UV", record.sunlightUvRating],
        ["Flammability", record.flammabilityRating],
        ["Wear resistance", record.wearResistanceRating]
    ].filter(([, value]) => clean(value) && clean(value).toLowerCase() !== "not reported")
      .map(([label, value]) => `${label}: ${clean(value)}`);

    record.environmentalResistance = environmentalParts.join("; ") ||
        clean(record.environmentalRatingScale);

    /*
       Rows without a material name are not material records.
    */
    if (!record.name) {
        return null;
    }

    record.manufacturingMethods =
        list(record.manufacturingMethods);

    record.sprayProcesses =
        list(record.sprayProcesses);

    /*
       Use the uploaded file as the source when no more specific
       source information was included in the row.
    */
    if (!record.sourceTitle) {
        record.sourceTitle =
            clean(file.name) ||
            "Uploaded spreadsheet";
    }

    if (!record.sourceFilename) {
        record.sourceFilename =
            clean(file.name);
    }

    if (!record.dateAdded) {
        record.dateAdded =
            clean(file.dateAdded);
    }

    const fileId =
        clean(file.id) ||
        clean(file.name) ||
        "spreadsheet";

    const id =
        `csv:${fileId}:${rowNumber}`;

    return standardizeMaterial(
        record,
        id,
        "csv"
    );
}


/* =========================================================
   READ TABLES FROM ONE UPLOADED FILE

   This supports:
   - file.rows
   - file.data
   - Multiple worksheet objects stored in file.sheets
   ========================================================= */

function spreadsheetTables(file) {
    const tables = [];

    if (
        Array.isArray(file.rows) &&
        file.rows.length
    ) {
        tables.push(file.rows);
    }

    if (
        Array.isArray(file.data) &&
        file.data.length
    ) {
        tables.push(file.data);
    }

    if (Array.isArray(file.sheets)) {
        file.sheets.forEach((sheet) => {
            const rows =
                sheet.rows ||
                sheet.data;

            if (
                Array.isArray(rows) &&
                rows.length
            ) {
                tables.push(rows);
            }
        });
    } else if (
        file.sheets &&
        typeof file.sheets === "object"
    ) {
        Object.values(file.sheets).forEach(
            (sheet) => {
                const rows =
                    Array.isArray(sheet)
                        ? sheet
                        : sheet.rows || sheet.data;

                if (
                    Array.isArray(rows) &&
                    rows.length
                ) {
                    tables.push(rows);
                }
            }
        );
    }

    return tables;
}


/* =========================================================
   CONVERT ONE UPLOADED FILE INTO MATERIAL RECORDS
   ========================================================= */

function materialsFromFile(file) {
    const records = [];
    let materialNumber = 1;

    spreadsheetTables(file).forEach((rows) => {
        /*
           A table requires one heading row and at least one
           material row.
        */
        if (rows.length < 2) {
            return;
        }

        const headers = rows[0];

        rows.slice(1).forEach((row) => {
            const material =
                materialFromSpreadsheetRow(
                    file,
                    headers,
                    row,
                    materialNumber
                );

            if (material) {
                records.push(material);
                materialNumber += 1;
            }
        });
    });

    return records;
}


/* =========================================================
   READ ALL RECORDS FROM ONE INDEXEDDB OBJECT STORE
   ========================================================= */

function readObjectStore(
    database,
    storeName
) {
    return new Promise((resolve) => {
        try {
            const transaction =
                database.transaction(
                    storeName,
                    "readonly"
                );

            const store =
                transaction.objectStore(storeName);

            const request =
                store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                resolve([]);
            };
        } catch (error) {
            resolve([]);
        }
    });
}


/* =========================================================
   OPEN ONE INDEXEDDB DATABASE
   ========================================================= */

function openDatabase(databaseName) {
    return new Promise((resolve) => {
        const request =
            indexedDB.open(databaseName);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            resolve(null);
        };

        request.onupgradeneeded = () => {
            /*
               Do not create or modify a database while searching
               for uploaded spreadsheet records.
            */
            request.transaction.abort();
        };
    });
}


/* =========================================================
   LOAD SPREADSHEET MATERIALS FROM INDEXEDDB

   Modern Chrome can list the databases created by the website.
   The code searches their object stores for uploaded file
   records containing rows or worksheets.
   ========================================================= */

async function spreadsheetMaterials() {
    if (
        !window.indexedDB ||
        typeof indexedDB.databases !== "function"
    ) {
        console.warn(
            "Automatic spreadsheet database discovery is not supported."
        );

        return [];
    }

    try {
        const databaseInformation =
            await indexedDB.databases();

        const allMaterials = [];

        for (const information of databaseInformation) {
            if (!information.name) {
                continue;
            }

            const database =
                await openDatabase(information.name);

            if (!database) {
                continue;
            }

            const storeNames =
                Array.from(database.objectStoreNames);

            for (const storeName of storeNames) {
                const records =
                    await readObjectStore(
                        database,
                        storeName
                    );

                records.forEach((file) => {
                    if (spreadsheetTables(file).length) {
                        allMaterials.push(
                            ...materialsFromFile(file)
                        );
                    }
                });
            }

            database.close();
        }

        return allMaterials;
    } catch (error) {
        console.error(
            "Spreadsheet materials could not be read.",
            error
        );

        return [];
    }
}


/* =========================================================
   PAGE-DISPLAY HELPERS
   ========================================================= */

/*
   Places a value inside an element.

   Missing information is displayed as "Not reported."
*/
function setText(elementId, value) {
    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    const displayValue =
        Array.isArray(value)
            ? value.join(", ")
            : clean(value);

    element.textContent =
        displayValue ||
        "Not reported";
}

/* Adds a property row when an older HTML file does not contain it yet. */
function ensureDetailProperty(elementId, label) {
    let valueElement = document.getElementById(elementId);
    if (valueElement) return valueElement;

    const grid = document.querySelector("#detail-youngs-modulus")?.closest(".detail-property-grid");
    if (!grid) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "detail-property";

    const term = document.createElement("dt");
    term.textContent = label;

    valueElement = document.createElement("dd");
    valueElement.id = elementId;
    valueElement.textContent = "Not reported";

    wrapper.append(term, valueElement);
    grid.appendChild(wrapper);
    return valueElement;
}


/*
   Adds a unit only when the value does not already include one.
*/
function withUnit(value, unit) {
    const text = clean(value);

    if (!text) {
        return "";
    }

    if (/[a-zµ°%]/i.test(text)) {
        return text;
    }

    return `${text} ${unit}`;
}


/*
   Displays the material source as a clickable link when a valid
   web address was provided.
*/
function displayDocumentLink(url) {
    const container =
        document.getElementById(
            "detail-document-link"
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    const linkValue = clean(url);

    if (!/^https?:\/\//i.test(linkValue)) {
        container.textContent =
            linkValue ||
            "Not reported";

        return;
    }

    const link =
        document.createElement("a");

    link.href = linkValue;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open source document";

    container.appendChild(link);
}


/*
   Displays standards as a readable list.
*/
function displayStandards(value) {
    const container =
        document.getElementById(
            "detail-standards"
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    const standards = list(value);

    if (!standards.length) {
        const message =
            document.createElement("p");

        message.textContent =
            "Not reported";

        container.appendChild(message);
        return;
    }

    const listElement =
        document.createElement("ul");

    standards.forEach((standard) => {
        const item =
            document.createElement("li");

        item.textContent = standard;
        listElement.appendChild(item);
    });

    container.appendChild(listElement);
}


/* =========================================================
   DISPLAY THE SELECTED MATERIAL
   ========================================================= */

function displayMaterial(material) {
    /*
       Page title and main heading.
    */
    document.title =
        `${material.name} | VARCO Materials Database`;

    setText(
        "detail-category-label",
        material.category || "Material"
    );

    setText(
        "detail-material-name",
        material.name || "Unnamed Material"
    );

    setText(
        "detail-product-name",
        material.productName ||
            "Product name not reported"
    );

    setText(
        "detail-quality-badge",
        material.dataQualityStatus ||
            "Quality not reported"
    );


    /*
       Quick summary.
    */
    setText(
        "detail-category",
        material.category
    );

    setText(
        "detail-feedstock-form",
        material.feedstockForm
    );

    setText(
        "detail-supplier",
        material.supplier
    );

    setText(
        "detail-origin",
        material.origin === "csv"
            ? "Spreadsheet Import"
            : "Manual Entry"
    );


    /*
       Composition.
    */
    setText(
        "detail-composition",
        material.composition
    );

    setText(
        "detail-composition-basis",
        material.compositionBasis
    );


    /*
       Manufacturing and feedstock.
    */
    setText(
        "detail-manufacturing-methods",
        material.manufacturingMethods
    );

    setText(
        "detail-feedstock-form-full",
        material.feedstockForm
    );

    setText(
        "detail-particle-size-min",
        withUnit(
            material.particleSizeMin,
            "µm"
        )
    );

    setText(
        "detail-particle-size-max",
        withUnit(
            material.particleSizeMax,
            "µm"
        )
    );

    setText(
        "detail-particle-size-average",
        withUnit(
            material.particleSizeAverage,
            "µm"
        )
    );

    setText(
        "detail-morphology",
        material.morphology
    );


    /*
       Material properties.
    */
    ensureDetailProperty(
        "detail-environmental-resistance",
        "Environmental Resistance"
    );

    setText(
        "detail-density",
        material.density
    );

    setText(
        "detail-hardness",
        material.hardness
    );

    setText(
        "detail-youngs-modulus",
        material.youngsModulus
    );

    setText("detail-yield-strength", material.yieldStrength);
    setText("detail-compressive-strength", material.compressiveStrength);
    setText("detail-tensile-strength", material.tensileStrength);
    setText("detail-fracture-toughness", material.fractureToughness);
    setText("detail-environmental-resistance", material.environmentalResistance);
    setText("detail-softening-temperature", material.softeningTemperature);
    setText(
        "detail-max-service-temperature",
        withUnit(material.maxServiceTemperature, "°C")
    );

    setText(
        "detail-melting-point",
        material.meltingPoint
    );

    setText(
        "detail-thermal-conductivity",
        material.thermalConductivity
    );

    setText(
        "detail-thermal-expansion",
        material.thermalExpansion
    );


    /*
       Thermal-spray information.
    */
    setText(
        "detail-spray-processes",
        material.sprayProcesses
    );

    setText(
        "detail-substrate",
        material.substrate
    );

    setText(
        "detail-coating-thickness",
        material.coatingThickness
    );

    setText(
        "detail-surface-preparation",
        material.surfacePreparation
    );


    /*
       Supplier information.
    */
    setText(
        "detail-supplier-full",
        material.supplier
    );

    setText(
        "detail-product-name-full",
        material.productName
    );

    setText(
        "detail-product-number",
        material.productNumber
    );

    setText(
        "detail-country",
        material.country
    );


    /*
       Standards.
    */
    displayStandards(
        material.standards
    );


    /*
       Source and record information.
    */
    setText(
        "detail-source-type",
        material.sourceType
    );

    setText(
        "detail-source-title",
        material.sourceTitle
    );

    setText(
        "detail-source-filename",
        material.sourceFilename
    );

    setText(
        "detail-date-added",
        material.dateAdded
    );

    displayDocumentLink(
        material.documentLink
    );


    /*
       Research notes.
    */
    setText(
        "detail-notes",
        material.notes ||
            "No notes have been added."
    );

    const importedCard = document.getElementById("detail-imported-fields-card");
    const importedFields = document.getElementById("detail-imported-fields");
    if (importedCard && importedFields) {
        importedFields.textContent = "";
        const entries = Object.entries(material.rawProperties || {})
            .filter(([, value]) => clean(value))
            .sort(([first], [second]) => first.localeCompare(second));

        entries.forEach(([label, value]) => {
            const wrapper = document.createElement("div");
            const term = document.createElement("dt");
            const description = document.createElement("dd");
            wrapper.className = "detail-property";
            term.textContent = label.replace(/_/g, " ");
            description.textContent = value;
            wrapper.append(term, description);
            importedFields.appendChild(wrapper);
        });

        importedCard.hidden = entries.length === 0;
    }


    /*
       Hide the loading message and display the completed record.
    */
    elements.status.hidden = true;
    elements.content.hidden = false;
}


/* =========================================================
   DISPLAY AN ERROR MESSAGE
   ========================================================= */

function displayError(message) {
    elements.content.hidden = true;

    elements.status.hidden = false;
    elements.status.classList.add(
        "detail-error"
    );

    elements.status.textContent = message;

    if (elements.addToComparisonButton) {
        elements.addToComparisonButton.disabled = true;
    }

    if (elements.editButton) {
        elements.editButton.disabled = true;
    }
}


/* =========================================================
   ADD MATERIAL TO COMPARISON
   ========================================================= */

function configureComparisonButton(material) {
    if (!elements.addToComparisonButton) {
        return;
    }

    elements.addToComparisonButton.addEventListener(
        "click",
        () => {
            const storageKey =
                "varcoComparisonMaterials";

            let selectedIds = [];

            try {
                selectedIds = JSON.parse(
                    localStorage.getItem(storageKey)
                ) || [];
            } catch (error) {
                selectedIds = [];
            }

            if (!selectedIds.includes(material.id)) {
                selectedIds.push(material.id);

                localStorage.setItem(
                    storageKey,
                    JSON.stringify(selectedIds)
                );
            }

            elements.addToComparisonButton.textContent =
                "Added to Comparison";

            elements.addToComparisonButton.disabled =
                true;
        }
    );
}


/* =========================================================
   EDIT BUTTON

   All Supabase records use the Dashboard's existing edit form. Imported
   records keep their sourceFileId, so file-level deletion remains linked.
   ========================================================= */

function configureEditButton(material) {
    if (!elements.editButton) {
        return;
    }

    elements.editButton.addEventListener(
        "click",
        () => {
            const editUrl =
                "index.html?edit=" +
                encodeURIComponent(material.id) +
                "#material-form";

            window.location.href = editUrl;
        }
    );
}


/* =========================================================
   INITIALIZE THE MATERIAL DETAILS PAGE
   ========================================================= */

async function initializeMaterialDetails() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const selectedId =
        clean(parameters.get("id"));

    if (!selectedId) {
        displayError(
            "No material was selected. Return to Current Materials and click a material name."
        );

        return;
    }

    elements.status.textContent =
        "Loading material details...";

    let sharedRecords = [];
    try {
        sharedRecords = window.varcoApi
            ? (await window.varcoApi.listMaterials()).map((material) =>
                standardizeMaterial(material, material.id, material.origin || "shared")
            )
            : [];
    } catch (error) {
        console.error("Shared materials could not be loaded:", error);
    }

    /* Supabase is the single material-record source. varcoApi normalizes the
       original spreadsheet headings before records reach this page. */
    const allMaterials = sharedRecords;

    let selectedMaterial =
        allMaterials.find(
            (material) =>
                material.id === selectedId
        );

    /*
       Backup matching for an older spreadsheet link whose row
       number changed after blank rows were removed.
    */
    if (
        !selectedMaterial &&
        selectedId.startsWith("csv:")
    ) {
        const selectedParts =
            selectedId.split(":");

        const selectedFileId =
            selectedParts.slice(1, -1).join(":");

        selectedMaterial =
            spreadsheetRecords.find(
                (material) =>
                    material.id.includes(
                        `csv:${selectedFileId}:`
                    )
            );
    }

    if (!selectedMaterial) {
        displayError(
            "This material could not be found. Make sure you are using Live Server and that the original spreadsheet is still uploaded."
        );

        return;
    }

    displayMaterial(selectedMaterial);
    configureComparisonButton(selectedMaterial);
    configureEditButton(selectedMaterial);
    configureMaterialImages(selectedMaterial);
}


/* =========================================================
   MATERIAL IMAGE STORAGE

   Images are stored in IndexedDB instead of localStorage.
   This provides more storage space for uploaded photographs.
   ========================================================= */

const MATERIAL_IMAGE_DATABASE = "varcoMaterialImages";
const MATERIAL_IMAGE_STORE = "images";

let activeMaterialImageId = "";
let activeImageMaterialId = "";


function openMaterialImageDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            MATERIAL_IMAGE_DATABASE,
            1
        );

        request.onupgradeneeded = () => {
            const database = request.result;

            if (
                !database.objectStoreNames.contains(
                    MATERIAL_IMAGE_STORE
                )
            ) {
                const store = database.createObjectStore(
                    MATERIAL_IMAGE_STORE,
                    {
                        keyPath: "id"
                    }
                );

                store.createIndex(
                    "materialId",
                    "materialId",
                    {
                        unique: false
                    }
                );
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


async function getMaterialImages(materialId) {
    const database =
        await openMaterialImageDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            MATERIAL_IMAGE_STORE,
            "readonly"
        );

        const store = transaction.objectStore(
            MATERIAL_IMAGE_STORE
        );

        const index = store.index("materialId");
        const request = index.getAll(materialId);

        request.onsuccess = () => {
            const images = request.result || [];

            images.sort(
                (first, second) =>
                    second.dateAdded - first.dateAdded
            );

            resolve(images);
        };

        request.onerror = () => {
            reject(request.error);
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
}


async function saveMaterialImage(imageRecord) {
    const database =
        await openMaterialImageDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            MATERIAL_IMAGE_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            MATERIAL_IMAGE_STORE
        );

        store.put(imageRecord);

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };

        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}


async function removeMaterialImage(imageId) {
    const database =
        await openMaterialImageDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(
            MATERIAL_IMAGE_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            MATERIAL_IMAGE_STORE
        );

        store.delete(imageId);

        transaction.oncomplete = () => {
            database.close();
            resolve();
        };

        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
}


function createMaterialImageId() {
    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        "image-" +
        Date.now() +
        "-" +
        Math.random().toString(16).slice(2)
    );
}


function validMaterialImage(file) {
    const acceptedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
    ];

    if (!acceptedTypes.includes(file.type)) {
        alert(
            `${file.name} is not a supported image. ` +
            "Use PNG, JPG, WEBP, or GIF."
        );

        return false;
    }

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
        alert(
            `${file.name} is larger than 10 MB. ` +
            "Please choose a smaller image."
        );

        return false;
    }

    return true;
}


function openMaterialImageViewer(imageRecord) {
    const viewer = document.getElementById(
        "material-image-viewer"
    );

    const viewerImage = document.getElementById(
        "material-image-viewer-image"
    );

    const viewerName = document.getElementById(
        "material-image-viewer-name"
    );

    if (
        !viewer ||
        !viewerImage ||
        !viewerName
    ) {
        return;
    }

    activeMaterialImageId = imageRecord.id;

    viewerImage.src = URL.createObjectURL(
        imageRecord.file
    );

    viewerImage.alt =
        imageRecord.name ||
        "Uploaded material image";

    viewerName.textContent =
        imageRecord.name ||
        "Unnamed image";

    viewer.hidden = false;

    document.body.classList.add(
        "image-viewer-open"
    );
}


function closeMaterialImageViewer() {
    const viewer = document.getElementById(
        "material-image-viewer"
    );

    const viewerImage = document.getElementById(
        "material-image-viewer-image"
    );

    if (!viewer) {
        return;
    }

    if (
        viewerImage &&
        viewerImage.src.startsWith("blob:")
    ) {
        URL.revokeObjectURL(viewerImage.src);
    }

    if (viewerImage) {
        viewerImage.src = "";
        viewerImage.alt = "";
    }

    viewer.hidden = true;
    activeMaterialImageId = "";

    document.body.classList.remove(
        "image-viewer-open"
    );
}


async function displayMaterialImages(materialId) {
    const gallery = document.getElementById(
        "material-image-gallery"
    );

    const message = document.getElementById(
        "material-image-message"
    );

    if (!gallery || !message) {
        return;
    }

    gallery.replaceChildren();

    let images = [];

    try {
        images = await getMaterialImages(
            materialId
        );
    } catch (error) {
        console.error(
            "Material images could not be loaded.",
            error
        );

        message.hidden = false;
        message.textContent =
            "The images could not be loaded.";

        return;
    }

    message.hidden = images.length > 0;

    if (!images.length) {
        message.textContent =
            "No images have been added to this material.";

        return;
    }

    images.forEach((imageRecord) => {
        const card =
            document.createElement("article");

        card.className = "material-image-card";

        const previewButton =
            document.createElement("button");

        previewButton.type = "button";
        previewButton.className =
            "material-image-preview-button";

        previewButton.setAttribute(
            "aria-label",
            `Inspect ${imageRecord.name}`
        );

        const thumbnail =
            document.createElement("img");

        thumbnail.className =
            "material-image-thumbnail";

        thumbnail.src = URL.createObjectURL(
            imageRecord.file
        );

        thumbnail.alt =
            imageRecord.name ||
            "Uploaded material image";

        thumbnail.addEventListener(
            "load",
            () => {
                URL.revokeObjectURL(
                    thumbnail.src
                );
            },
            {
                once: true
            }
        );

        previewButton.appendChild(thumbnail);

        previewButton.addEventListener(
            "click",
            () => {
                openMaterialImageViewer(
                    imageRecord
                );
            }
        );

        const information =
            document.createElement("div");

        information.className =
            "material-image-information";

        const imageName =
            document.createElement("p");

        imageName.className =
            "material-image-name";

        imageName.textContent =
            imageRecord.name ||
            "Unnamed image";

        imageName.title = imageName.textContent;

        const actions =
            document.createElement("div");

        actions.className =
            "material-image-actions";

        const inspectButton =
            document.createElement("button");

        inspectButton.type = "button";
        inspectButton.className =
            "inspect-image-button";

        inspectButton.textContent = "Inspect";

        inspectButton.addEventListener(
            "click",
            () => {
                openMaterialImageViewer(
                    imageRecord
                );
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "delete-image-button";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener(
            "click",
            async () => {
                const confirmed = window.confirm(
                    `Delete "${imageRecord.name}"?`
                );

                if (!confirmed) {
                    return;
                }

                await removeMaterialImage(
                    imageRecord.id
                );

                await displayMaterialImages(
                    materialId
                );
            }
        );

        actions.append(
            inspectButton,
            deleteButton
        );

        information.append(
            imageName,
            actions
        );

        card.append(
            previewButton,
            information
        );

        gallery.appendChild(card);
    });
}


function configureMaterialImages(material) {
    const uploadButton = document.getElementById(
        "upload-material-image-button"
    );

    const imageInput = document.getElementById(
        "material-image-input"
    );

    const viewer = document.getElementById(
        "material-image-viewer"
    );

    const closeViewerButton =
        document.getElementById(
            "close-material-image-viewer"
        );

    const closeViewerFooterButton =
        document.getElementById(
            "close-material-image-viewer-button"
        );

    const deleteViewedButton =
        document.getElementById(
            "delete-viewed-material-image"
        );

    if (!uploadButton || !imageInput) {
        return;
    }

    activeImageMaterialId = material.id;

    imageInput.addEventListener(
        "change",
        async () => {
            const files = Array.from(
                imageInput.files || []
            );

            const validFiles = files.filter(
                validMaterialImage
            );

            uploadButton.classList.add("is-disabled");
            uploadButton.textContent =
                "Uploading...";

            try {
                for (const file of validFiles) {
                    await saveMaterialImage({
                        id: createMaterialImageId(),
                        materialId: material.id,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dateAdded: Date.now(),
                        file: file
                    });
                }

                await displayMaterialImages(
                    material.id
                );
            } catch (error) {
                console.error(
                    "The image could not be saved.",
                    error
                );

                alert(
                    "The image could not be saved. " +
                    "The browser may be out of storage space."
                );
            } finally {
                imageInput.value = "";
                uploadButton.classList.remove("is-disabled");
                uploadButton.textContent =
                    "Upload Images";
            }
        }
    );

    closeViewerButton?.addEventListener(
        "click",
        closeMaterialImageViewer
    );

    closeViewerFooterButton?.addEventListener(
        "click",
        closeMaterialImageViewer
    );

    viewer?.addEventListener(
        "click",
        (event) => {
            if (event.target === viewer) {
                closeMaterialImageViewer();
            }
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                viewer &&
                !viewer.hidden
            ) {
                closeMaterialImageViewer();
            }
        }
    );

    deleteViewedButton?.addEventListener(
        "click",
        async () => {
            if (!activeMaterialImageId) {
                return;
            }

            const confirmed = window.confirm(
                "Delete this material image?"
            );

            if (!confirmed) {
                return;
            }

            await removeMaterialImage(
                activeMaterialImageId
            );

            closeMaterialImageViewer();

            await displayMaterialImages(
                activeImageMaterialId
            );
        }
    );

    displayMaterialImages(material.id);
}

/* =========================================================
   START THE PAGE
   ========================================================= */

initializeMaterialDetails();