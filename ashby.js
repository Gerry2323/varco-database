"use strict";

/* =========================================================
   VARCO ASHBY CHARTS
   =========================================================

   This file controls:

   - Loading manual and CSV materials
   - Selecting chart properties and units
   - Drawing the interactive Ashby chart
   - Material-family colors
   - Hover information
   - Material detail links
   - Comparison selections
   - Zooming and panning
   ========================================================= */


/* =========================================================
   1. STORAGE SETTINGS
   ========================================================= */

/*
   These names must match the storage names used by the other
   VARCO website pages.
*/

const FILE_DB_NAME = "varcoFileDatabase";
const FILE_STORE_NAME = "files";
const COMPARE_KEY = "varcoComparisonMaterials";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";


/* =========================================================
   2. AVAILABLE CHART PROPERTIES
   =========================================================

   Each property has:

   - A label displayed on the page
   - The material record fields where its value may be stored
   - Units that can be selected by the user

   The database values are expected to use the first/base unit.
   ========================================================= */

const properties = {
    density: {
        label: "Density",

        fields: [
            "density",
            "apparentDensity"
        ],

        units: {
            gcm3: {
                label: "g/cm³",

                fromBase(value) {
                    return value;
                }
            },

            kgm3: {
                label: "kg/m³",

                fromBase(value) {
                    return value * 1000;
                }
            }
        }
    },

    youngsModulus: {
        label: "Young's Modulus",

        fields: [
            "youngsModulus"
        ],

        units: {
            gpa: {
                label: "GPa",

                fromBase(value) {
                    return value;
                }
            },

            mpa: {
                label: "MPa",

                fromBase(value) {
                    return value * 1000;
                }
            }
        }
    },

    yieldStrength: {
        label: "Yield Strength",
        fields: ["yieldStrength"],
        units: {
            mpa: { label: "MPa", fromBase(value) { return value; } },
            gpa: { label: "GPa", fromBase(value) { return value / 1000; } }
        }
    },

    compressiveStrength: {
        label: "Compressive Strength",
        fields: ["compressiveStrength"],
        units: {
            mpa: { label: "MPa", fromBase(value) { return value; } },
            gpa: { label: "GPa", fromBase(value) { return value / 1000; } }
        }
    },

    tensileStrength: {
        label: "Tensile Strength",

        fields: [
            "tensileStrength"
        ],

        units: {
            mpa: {
                label: "MPa",

                fromBase(value) {
                    return value;
                }
            },

            gpa: {
                label: "GPa",

                fromBase(value) {
                    return value / 1000;
                }
            }
        }
    },

    fractureToughness: {
        label: "Fracture Toughness",

        fields: [
            "fractureToughness"
        ],

        units: {
            mpaRootM: {
                label: "MPa·m½",

                fromBase(value) {
                    return value;
                }
            }
        }
    },

    thermalConductivity: {
        label: "Thermal Conductivity",

        fields: [
            "thermalConductivity"
        ],

        units: {
            wmK: {
                label: "W/m·K",

                fromBase(value) {
                    return value;
                }
            }
        }
    },

    thermalExpansion: {
        label: "Thermal Expansion",

        fields: [
            "thermalExpansion"
        ],

        units: {
            ummK: {
                label: "µm/m·K",

                fromBase(value) {
                    return value;
                }
            }
        }
    },

    meltingPoint: {
        label: "Melting Point",

        fields: [
            "meltingPoint"
        ],

        units: {
            c: {
                label: "°C",

                fromBase(value) {
                    return value;
                }
            },

            k: {
                label: "K",

                fromBase(value) {
                    return value + 273.15;
                }
            },

            f: {
                label: "°F",

                fromBase(value) {
                    return value * 9 / 5 + 32;
                }
            }
        }
    },

    softeningTemperature: {
        label: "Softening Temperature",
        fields: ["softeningTemperature"],
        units: {
            c: { label: "°C", fromBase(value) { return value; } },
            k: { label: "K", fromBase(value) { return value + 273.15; } },
            f: { label: "°F", fromBase(value) { return value * 9 / 5 + 32; } }
        }
    },

    maxServiceTemperature: {
        label: "Maximum Service Temperature",
        fields: ["maxServiceTemperature"],
        units: {
            c: { label: "°C", fromBase(value) { return value; } },
            k: { label: "K", fromBase(value) { return value + 273.15; } },
            f: { label: "°F", fromBase(value) { return value * 9 / 5 + 32; } }
        }
    },

    porosity: {
        label: "Porosity",

        fields: [
            "porosity"
        ],

        units: {
            percent: {
                label: "%",

                fromBase(value) {
                    return value;
                }
            }
        }
    },

    hardnessValue: {
        label: "Hardness Value",

        fields: [
            "hardnessValue"
        ],

        units: {
            reported: {
                label: "Reported scale",

                fromBase(value) {
                    return value;
                }
            }
        }
    },

    particleSizeAverage: {
        label: "Average Particle Size / D50",

        fields: [
            "particleSizeAverage"
        ],

        units: {
            um: {
                label: "µm",

                fromBase(value) {
                    return value;
                }
            },

            mm: {
                label: "mm",

                fromBase(value) {
                    return value / 1000;
                }
            },

            nm: {
                label: "nm",

                fromBase(value) {
                    return value * 1000;
                }
            }
        }
    }
};


/* =========================================================
   3. MATERIAL FAMILY COLORS
   =========================================================

   Materials are assigned to broad families so every family
   appears with a consistent color.
   ========================================================= */

const familyColors = {
    Ceramics: "#d97706",
    Metals: "#2563eb",
    Composites: "#7c3aed",
    Polymers: "#db2777",
    Elastomers: "#dc2626",
    Foams: "#16a34a",
    "Natural materials": "#65a30d",
    Regolith: "#8b5e3c",
    Other: "#64748b"
};


/* =========================================================
   4. ACCEPTED CSV COLUMN NAMES
   =========================================================

   Each database field can recognize several possible CSV
   headings. Add more aliases here if a spreadsheet uses a
   different heading.
   ========================================================= */

const aliases = {
    name: [
        "Material Name",
        "Name",
        "Material",
        "Powder Name"
    ],

    category: [
        "Category",
        "Material Category",
        "Classification",
        "Class"
    ],

    density: [
        "Density (g/cm³)",
        "Density",
        "Material Density",
        "Density Value Reported"
    ],

    densityMin: ["Density Min (g/cm³)", "density_min_g_cm3", "Density Min (Mg/m3)"],
    densityMax: ["Density Max (g/cm³)", "density_max_g_cm3", "Density Max (Mg/m3)"],

    apparentDensity: [
        "Apparent Density (g/cm³)",
        "Apparent Density"
    ],

    youngsModulus: [
        "Young's Modulus (GPa)",
        "Young’s Modulus (GPa)",
        "Youngs Modulus",
        "Elastic Modulus"
    ],

    youngsModulusMin: ["Young Modulus Min (GPa)", "young_modulus_min_gpa", "Young's Modulus Min (GPa)"],
    youngsModulusMax: ["Young Modulus Max (GPa)", "young_modulus_max_gpa", "Young's Modulus Max (GPa)"],

    yieldStrength: ["Yield Strength (MPa)", "Yield Stress (MPa)"],
    yieldStrengthMin: ["Yield Stress Min (MPa)", "yield_stress_min_mpa", "Yield or Compressive Strength Min (MPa)"],
    yieldStrengthMax: ["Yield Stress Max (MPa)", "yield_stress_max_mpa", "Yield or Compressive Strength Max (MPa)"],

    compressiveStrength: ["Compressive Strength (MPa)", "Compressive Strength"],
    compressiveStrengthMin: ["Compressive Strength Min (MPa)", "compressive_strength_min_mpa"],
    compressiveStrengthMax: ["Compressive Strength Max (MPa)", "compressive_strength_max_mpa"],

    tensileStrength: [
        "Tensile Strength (MPa)",
        "Tensile Strength"
    ],
    tensileStrengthMin: ["Tensile Strength Min (MPa)", "tensile_strength_min_mpa"],
    tensileStrengthMax: ["Tensile Strength Max (MPa)", "tensile_strength_max_mpa"],

    fractureToughness: [
        "Fracture Toughness (MPa·m^0.5)",
        "Fracture Toughness"
    ],
    fractureToughnessMin: ["Fracture Toughness Min (MPa sqrt(m))", "fracture_toughness_min_mpa_sqrt_m"],
    fractureToughnessMax: ["Fracture Toughness Max (MPa sqrt(m))", "fracture_toughness_max_mpa_sqrt_m"],

    thermalConductivity: [
        "Thermal Conductivity (W/m·K)",
        "Thermal Conductivity"
    ],

    thermalExpansion: [
        "Thermal Expansion (µm/m·K)",
        "Thermal Expansion"
    ],

    meltingPoint: [
        "Melting Point (°C)",
        "Melting Point",
        "Melt Point"
    ],
    meltingPointMin: ["Melting Point Min (°C)", "melting_point_min_c", "Melting or Softening Min (degC)"],
    meltingPointMax: ["Melting Point Max (°C)", "melting_point_max_c", "Melting or Softening Max (degC)"],

    softeningTemperature: ["Softening Temperature (°C)", "Softening Temperature"],
    softeningTemperatureMin: ["Softening Temperature Min (°C)", "softening_temperature_min_c"],
    softeningTemperatureMax: ["Softening Temperature Max (°C)", "softening_temperature_max_c"],
    maxServiceTemperature: ["Max Service Temp (°C)", "max_service_temp_c", "Maximum Service Temperature (°C)"],

    porosity: [
        "Porosity (%)",
        "Porosity"
    ],

    hardnessValue: [
        "Hardness Value",
        "Hardness"
    ],

    hardnessScaleLoad: [
        "Hardness Scale and Load",
        "Hardness Scale Load"
    ],

    particleSizeAverage: [
        "Particle Size Average (µm)",
        "Particle Size Average",
        "D50"
    ],
    particleSizeMin: ["Particle Size Min (µm)", "particle_size_min_um", "Minimum Particle Size"],
    particleSizeMax: ["Particle Size Max (µm)", "particle_size_max_um", "Maximum Particle Size"],

    composition: [
        "Composition as Reported",
        "Composition",
        "Chemical Composition"
    ],

    supplier: [
        "Supplier",
        "Manufacturer"
    ],

    sourceTitle: [
        "Source Title",
        "Reference",
        "Citation",
        "Article Title"
    ],

    documentLink: [
        "Document Link",
        "Source Link",
        "Reference Link",
        "DOI or URL",
        "URL"
    ]
};


/* =========================================================
   5. PAGE STATE
   ========================================================= */

const state = {
    materials: [],
    points: [],
    renderedPoints: [],
    selectedMaterial: null,
    view: null,
    isPanning: false,
    panStart: null,
    clusterSelection: null
};


/* =========================================================
   6. PAGE ELEMENTS
   ========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

const controls = {
    xProperty: getElement("x-property"),
    xUnit: getElement("x-unit"),
    yProperty: getElement("y-property"),
    yUnit: getElement("y-unit"),
    scale: getElement("axis-scale"),
    family: getElement("family-filter")
};


/* =========================================================
   7. DATA-CLEANING HELPERS
   ========================================================= */

/*
   Remove empty values and values such as "Not reported."
*/

function clean(value) {
    const text = String(value ?? "").trim();

    if (!text) {
        return "";
    }

    if (/^not (reported|specified)$/i.test(text)) {
        return "";
    }

    return text;
}


/*
   Extract the first numeric value from a stored property.

   Examples:

   "3.95 g/cm3" becomes 3.95
   "1,250 MPa" becomes 1250
*/

function numeric(value) {
    const cleanedValue = String(value ?? "").replace(/,/g, "");

    const match = cleanedValue.match(
        /-?\d*\.?\d+(?:e[+-]?\d+)?/i
    );

    if (!match) {
        return null;
    }

    return Number(match[0]);
}


/*
   Make headings easier to compare.

   For example:
   "Material Name" becomes "materialname".
*/

function comparable(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}


/* =========================================================
   8. LOAD MANUALLY ADDED MATERIALS
   ========================================================= */

function manualMaterials() {
    try {
        const savedRecords = JSON.parse(
            localStorage.getItem("varcoMaterials") || "[]"
        );

        if (!Array.isArray(savedRecords)) {
            return [];
        }

        return savedRecords.map(
            (material, index) => ({
                ...material,

                id: material.id || `manual:${index}`,

                origin: "manual"
            })
        );
    } catch (error) {
        console.error(
            "Manual material records could not be loaded.",
            error
        );

        return [];
    }
}


/* =========================================================
   9. INDEXEDDB HELPERS
   ========================================================= */

function openDatabase(name, version, upgradeFunction) {
    return new Promise(
        (resolve, reject) => {
            const request = indexedDB.open(
                name,
                version
            );

            request.onupgradeneeded = () => {
                if (upgradeFunction) {
                    upgradeFunction(request.result);
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        }
    );
}


/*
   Find a value inside one row of an imported spreadsheet.
*/

function valueFromRow(headers, row, field) {
    const acceptedHeadings = (
        aliases[field] || []
    ).map(comparable);

    const columnIndex = headers.findIndex(
        (header) => {
            return acceptedHeadings.includes(
                comparable(header)
            );
        }
    );

    if (columnIndex < 0) {
        return "";
    }

    return clean(row[columnIndex]);
}

/*
   Normalize a material that was returned by Supabase. Imported spreadsheet
   values are stored in material_data and varcoApi flattens them onto the
   returned record, so their original column headings remain available as
   object keys. Convert those headings to the canonical names used by the
   chart in exactly the same way as a locally stored spreadsheet row.
*/
function normalizeSharedMaterial(material) {
    const normalized = { ...material };
    const keys = Object.keys(material || {});

    Object.keys(aliases).forEach((field) => {
        if (clean(normalized[field])) return;

        const acceptedHeadings = (aliases[field] || []).map(comparable);
        const matchingKey = keys.find((key) =>
            acceptedHeadings.includes(comparable(key))
        );

        if (matchingKey) {
            normalized[field] = clean(material[matchingKey]);
        }
    });

    return normalized;
}


/* =========================================================
   10. LOAD CSV OR SPREADSHEET MATERIALS
   ========================================================= */

async function spreadsheetMaterials() {
    try {
        const database = await openDatabase(
            FILE_DB_NAME,
            1,
            (db) => {
                if (
                    !db.objectStoreNames.contains(
                        FILE_STORE_NAME
                    )
                ) {
                    db.createObjectStore(
                        FILE_STORE_NAME,
                        {
                            keyPath: "id"
                        }
                    );
                }
            }
        );

        const files = await new Promise(
            (resolve, reject) => {
                const transaction = database.transaction(
                    FILE_STORE_NAME,
                    "readonly"
                );

                const store = transaction.objectStore(
                    FILE_STORE_NAME
                );

                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result || []);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            }
        );

        database.close();

        const records = [];

        files.forEach(
            (file) => {
                const rows = Array.isArray(file.rows)
                    ? file.rows
                    : [];

                if (rows.length < 2) {
                    return;
                }

                const headers = rows[0];

                rows.slice(1).forEach(
                    (row, index) => {
                        const name = valueFromRow(
                            headers,
                            row,
                            "name"
                        );

                        if (!name) {
                            return;
                        }

                        const material = {
                            id: `csv:${file.id}:${index + 1}`,
                            name: name,
                            origin: "csv"
                        };

                        if (window.VarcoSchema) {
                            Object.assign(
                                material,
                                window.VarcoSchema.rowToMaterial(headers, row)
                            );
                            material.name = material.name || name;
                        }

                        Object.keys(aliases).forEach(
                            (field) => {
                                if (field !== "name") {
                                    material[field] =
                                        valueFromRow(
                                            headers,
                                            row,
                                            field
                                        ) || material[field] || "";
                                }
                            }
                        );

                        if (!material.sourceTitle) {
                            material.sourceTitle = file.name;
                        }

                        records.push(material);
                    }
                );
            }
        );

        return records;
    } catch (error) {
        console.error(
            "Imported material records could not be loaded.",
            error
        );

        return [];
    }
}


/* =========================================================
   11. DETERMINE A MATERIAL'S FAMILY
   ========================================================= */

function materialFamily(material) {
    const categoryAndName = `
        ${clean(material.category)}
        ${clean(material.name)}
    `.toLowerCase();

    if (
        /regolith|lunar|anorthosite/.test(
            categoryAndName
        )
    ) {
        return "Regolith";
    }

    if (
        /cermet|composite|matrix|reinforced/.test(
            categoryAndName
        )
    ) {
        return "Composites";
    }

    if (
        /ceramic|oxide|carbide|nitride|glass/.test(
            categoryAndName
        )
    ) {
        return "Ceramics";
    }

    if (
        /alloy|metal|steel|aluminum|aluminium|titanium|nickel|cobalt|copper|wire/.test(
            categoryAndName
        )
    ) {
        return "Metals";
    }

    if (
        /elastomer|rubber/.test(categoryAndName)
    ) {
        return "Elastomers";
    }

    if (
        /polymer|plastic|thermoplastic|thermoset/.test(
            categoryAndName
        )
    ) {
        return "Polymers";
    }

    if (
        /foam|cellular/.test(categoryAndName)
    ) {
        return "Foams";
    }

    if (
        /wood|natural|bamboo|cork/.test(
            categoryAndName
        )
    ) {
        return "Natural materials";
    }

    return "Other";
}


/*
   Find a numeric property value in a material record.
*/

function baseValue(material, propertyKey) {
    const rangeFieldNames = {
        density: ["densityMin", "densityMax"],
        youngsModulus: ["youngsModulusMin", "youngsModulusMax"],
        yieldStrength: ["yieldStrengthMin", "yieldStrengthMax"],
        compressiveStrength: ["compressiveStrengthMin", "compressiveStrengthMax"],
        tensileStrength: ["tensileStrengthMin", "tensileStrengthMax"],
        fractureToughness: ["fractureToughnessMin", "fractureToughnessMax"],
        meltingPoint: ["meltingPointMin", "meltingPointMax"],
        softeningTemperature: ["softeningTemperatureMin", "softeningTemperatureMax"],
        particleSizeAverage: ["particleSizeMin", "particleSizeMax"]
    };

    const property = properties[propertyKey];
    const rangeNames = rangeFieldNames[propertyKey];
    if (rangeNames) {
        const low = numeric(material[rangeNames[0]]);
        const high = numeric(material[rangeNames[1]]);
        if (low !== null && high !== null) return (low + high) / 2;
        if (low !== null) return low;
        if (high !== null) return high;
    }

    for (const field of property.fields) {
        const value = numeric(material[field]);

        if (value !== null) {
            return value;
        }
    }

    return null;
}

/* Return the reported min/max range in base units. A single reported
   value becomes a zero-width range so older/manual records still plot. */
function baseRange(material, propertyKey) {
    const rangeFieldNames = {
        density: ["densityMin", "densityMax"],
        youngsModulus: ["youngsModulusMin", "youngsModulusMax"],
        yieldStrength: ["yieldStrengthMin", "yieldStrengthMax"],
        compressiveStrength: ["compressiveStrengthMin", "compressiveStrengthMax"],
        tensileStrength: ["tensileStrengthMin", "tensileStrengthMax"],
        fractureToughness: ["fractureToughnessMin", "fractureToughnessMax"],
        meltingPoint: ["meltingPointMin", "meltingPointMax"],
        softeningTemperature: ["softeningTemperatureMin", "softeningTemperatureMax"],
        particleSizeAverage: ["particleSizeMin", "particleSizeMax"]
    };
    const names = rangeFieldNames[propertyKey];
    let minimum = names ? numeric(material[names[0]]) : null;
    let maximum = names ? numeric(material[names[1]]) : null;

    if (minimum === null && maximum === null) {
        const value = baseValue(material, propertyKey);
        return value === null ? null : { minimum: value, maximum: value, center: value };
    }
    if (minimum === null) minimum = maximum;
    if (maximum === null) maximum = minimum;
    if (minimum > maximum) [minimum, maximum] = [maximum, minimum];
    return { minimum, maximum, center: (minimum + maximum) / 2 };
}


/* =========================================================
   12. SET UP PROPERTY AND UNIT CONTROLS
   ========================================================= */

function populatePropertySelect(selectElement) {
    Object.entries(properties).forEach(
        ([key, property]) => {
            const option =
                document.createElement("option");

            option.value = key;
            option.textContent = property.label;

            selectElement.appendChild(option);
        }
    );
}


function populateUnitSelect(
    propertySelect,
    unitSelect,
    preferredUnit
) {
    const selectedProperty =
        properties[propertySelect.value];

    unitSelect.replaceChildren();

    Object.entries(
        selectedProperty.units
    ).forEach(
        ([key, unit]) => {
            const option =
                document.createElement("option");

            option.value = key;
            option.textContent = unit.label;

            unitSelect.appendChild(option);
        }
    );

    if (
        preferredUnit &&
        selectedProperty.units[preferredUnit]
    ) {
        unitSelect.value = preferredUnit;
    }
}


function populateFamilies() {
    const families = [
        ...new Set(
            state.materials.map(materialFamily)
        )
    ].sort();

    families.forEach(
        (family) => {
            const option =
                document.createElement("option");

            option.value = family;
            option.textContent = family;

            controls.family.appendChild(option);
        }
    );
}


/* =========================================================
   13. SVG AND CHART HELPERS
   ========================================================= */

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(
        SVG_NAMESPACE,
        name
    );

    Object.entries(attributes).forEach(
        ([key, value]) => {
            element.setAttribute(key, value);
        }
    );

    return element;
}


/*
   Convert values for a linear or logarithmic chart.
*/

function transformed(value) {
    if (controls.scale.value === "log") {
        return Math.log10(value);
    }

    return value;
}


function inverseTransformed(value) {
    if (controls.scale.value === "log") {
        return 10 ** value;
    }

    return value;
}


function displayedValue(
    base,
    propertyKey,
    unitKey
) {
    return properties[propertyKey]
        .units[unitKey]
        .fromBase(base);
}


/*
   Add space around the minimum and maximum chart values.
*/

function paddedDomain(values) {
    let minimum = Math.min(...values);
    let maximum = Math.max(...values);

    if (minimum === maximum) {
        const padding =
            Math.abs(minimum || 1) * 0.2;

        return [
            minimum - padding,
            maximum + padding
        ];
    }

    const padding =
        (maximum - minimum) * 0.1;

    return [
        minimum - padding,
        maximum + padding
    ];
}


function formatNumber(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    if (
        Math.abs(value) >= 10000 ||
        (
            Math.abs(value) > 0 &&
            Math.abs(value) < 0.01
        )
    ) {
        return value.toExponential(2);
    }

    return Number(
        value.toPrecision(4)
    ).toLocaleString();
}


function tickValues(
    minimum,
    maximum,
    count = 6
) {
    return Array.from(
        {
            length: count
        },

        (_, index) => {
            return minimum +
                (
                    (maximum - minimum) *
                    index /
                    (count - 1)
                );
        }
    );
}


/* =========================================================
   14. PREPARE MATERIAL POINTS
   ========================================================= */

function preparePoints() {
    const xPropertyKey =
        controls.xProperty.value;

    const yPropertyKey =
        controls.yProperty.value;

    const familyFilter =
        controls.family.value;

    state.points = state.materials.flatMap(
        (material) => {
            const xRange = baseRange(
                material,
                xPropertyKey
            );

            const yRange = baseRange(
                material,
                yPropertyKey
            );

            const xBase = xRange?.center ?? null;
            const yBase = yRange?.center ?? null;

            const family =
                materialFamily(material);

            const validForLogScale =
                controls.scale.value !== "log" ||
                (
                    xBase > 0 &&
                    yBase > 0
                );

            const missingProperty =
                xBase === null ||
                yBase === null;

            const familyDoesNotMatch =
                familyFilter &&
                family !== familyFilter;

            if (
                missingProperty ||
                !validForLogScale ||
                familyDoesNotMatch
            ) {
                return [];
            }

            return [
                {
                    material: material,
                    family: family,

                    x: displayedValue(
                        xBase,
                        xPropertyKey,
                        controls.xUnit.value
                    ),

                    y: displayedValue(
                        yBase,
                        yPropertyKey,
                        controls.yUnit.value
                    ),
                    xMin: displayedValue(xRange.minimum, xPropertyKey, controls.xUnit.value),
                    xMax: displayedValue(xRange.maximum, xPropertyKey, controls.xUnit.value),
                    yMin: displayedValue(yRange.minimum, yPropertyKey, controls.yUnit.value),
                    yMax: displayedValue(yRange.maximum, yPropertyKey, controls.yUnit.value)
                }
            ];
        }
    );
}


/* =========================================================
   15. RESET THE CHART VIEW
   ========================================================= */

function resetView() {
    if (!state.points.length) {
        state.view = null;
        drawChart(false);
        return;
    }

    state.view = {
        x: paddedDomain(
            state.points.flatMap((point) => [point.xMin, point.xMax])
                .filter((value) => controls.scale.value !== "log" || value > 0)
                .map(transformed)
        ),

        y: paddedDomain(
            state.points.flatMap((point) => [point.yMin, point.yMax])
                .filter((value) => controls.scale.value !== "log" || value > 0)
                .map(transformed)
        )
    };

    drawChart(false);
}


/* =========================================================
   16. DRAW THE ASHBY CHART
   ========================================================= */

function drawChart(rebuildView = true) {
    const svg = getElement("ashby-chart");

    const bounds =
        svg.getBoundingClientRect();

    const width = Math.max(
        640,
        bounds.width || 1000
    );

    const height = Math.max(
        470,
        bounds.height || 590
    );

    const margin = {
        top: 28,
        right: 34,
        bottom: 76,
        left: 88
    };

    const plotWidth =
        width -
        margin.left -
        margin.right;

    const plotHeight =
        height -
        margin.top -
        margin.bottom;

    preparePoints();

    if (
        rebuildView ||
        !state.view
    ) {
        state.view = state.points.length
            ? {
                x: paddedDomain(
                    state.points.map(
                        (point) => transformed(point.x)
                    )
                ),

                y: paddedDomain(
                    state.points.map(
                        (point) => transformed(point.y)
                    )
                )
            }
            : null;
    }

    svg.replaceChildren();
    state.renderedPoints = [];
    state.clusterSelection = null;

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    const xProperty =
        properties[controls.xProperty.value];

    const yProperty =
        properties[controls.yProperty.value];

    const xUnit =
        xProperty.units[
            controls.xUnit.value
        ].label;

    const yUnit =
        yProperty.units[
            controls.yUnit.value
        ].label;

    getElement("chart-title").textContent =
        `${yProperty.label} vs. ${xProperty.label}`;

    getElement("plotted-count").textContent =
        state.points.length;

    if (state.points.length) {
        getElement("chart-status").textContent =
            `${state.points.length} of ` +
            `${state.materials.length} records ` +
            "contain both selected properties.";
    } else if (state.materials.length) {
        getElement("chart-status").textContent =
            "No records contain valid values for " +
            "both selected properties.";
    } else {
        getElement("chart-status").textContent =
            "No material records have been added " +
            "or imported yet.";
    }

    if (!state.view) {
        renderLegend();
        return;
    }

    /*
       Convert material values into pixel locations.
    */

    function xToPixel(value) {
        return margin.left +
            (
                (
                    transformed(value) -
                    state.view.x[0]
                ) /
                (
                    state.view.x[1] -
                    state.view.x[0]
                )
            ) *
            plotWidth;
    }

    function yToPixel(value) {
        return margin.top +
            plotHeight -
            (
                (
                    transformed(value) -
                    state.view.y[0]
                ) /
                (
                    state.view.y[1] -
                    state.view.y[0]
                )
            ) *
            plotHeight;
    }

    /*
       Prevent chart points from appearing outside the
       plotting area.
    */

    const clipId = "chart-plot-clip";

    const definitions =
        svgElement("defs");

    const clipPath =
        svgElement(
            "clipPath",
            {
                id: clipId
            }
        );

    clipPath.appendChild(
        svgElement(
            "rect",
            {
                x: margin.left,
                y: margin.top,
                width: plotWidth,
                height: plotHeight
            }
        )
    );

    definitions.appendChild(clipPath);
    svg.appendChild(definitions);

    /*
       Draw vertical grid lines and X-axis labels.
    */

    tickValues(
        state.view.x[0],
        state.view.x[1]
    ).forEach(
        (tick) => {
            const x =
                margin.left +
                (
                    (
                        tick -
                        state.view.x[0]
                    ) /
                    (
                        state.view.x[1] -
                        state.view.x[0]
                    )
                ) *
                plotWidth;

            svg.appendChild(
                svgElement(
                    "line",
                    {
                        x1: x,
                        y1: margin.top,
                        x2: x,
                        y2: margin.top + plotHeight,
                        class: "chart-grid-line"
                    }
                )
            );

            const label = svgElement(
                "text",
                {
                    x: x,
                    y: margin.top + plotHeight + 24,
                    class: "chart-tick",
                    "text-anchor": "middle"
                }
            );

            label.textContent = formatNumber(
                inverseTransformed(tick)
            );

            svg.appendChild(label);
        }
    );

    /*
       Draw horizontal grid lines and Y-axis labels.
    */

    tickValues(
        state.view.y[0],
        state.view.y[1]
    ).forEach(
        (tick) => {
            const y =
                margin.top +
                plotHeight -
                (
                    (
                        tick -
                        state.view.y[0]
                    ) /
                    (
                        state.view.y[1] -
                        state.view.y[0]
                    )
                ) *
                plotHeight;

            svg.appendChild(
                svgElement(
                    "line",
                    {
                        x1: margin.left,
                        y1: y,
                        x2: margin.left + plotWidth,
                        y2: y,
                        class: "chart-grid-line"
                    }
                )
            );

            const label = svgElement(
                "text",
                {
                    x: margin.left - 13,
                    y: y + 4,
                    class: "chart-tick",
                    "text-anchor": "end"
                }
            );

            label.textContent = formatNumber(
                inverseTransformed(tick)
            );

            svg.appendChild(label);
        }
    );

    /*
       Draw the X and Y axis lines.
    */

    svg.appendChild(
        svgElement(
            "line",
            {
                x1: margin.left,
                y1: margin.top + plotHeight,
                x2: margin.left + plotWidth,
                y2: margin.top + plotHeight,
                class: "chart-axis-line"
            }
        )
    );

    svg.appendChild(
        svgElement(
            "line",
            {
                x1: margin.left,
                y1: margin.top,
                x2: margin.left,
                y2: margin.top + plotHeight,
                class: "chart-axis-line"
            }
        )
    );

    /*
       Draw the X-axis title.
    */

    const xLabel = svgElement(
        "text",
        {
            x: margin.left + plotWidth / 2,
            y: height - 22,
            class: "chart-axis-label",
            "text-anchor": "middle"
        }
    );

    xLabel.textContent =
        `${xProperty.label} (${xUnit})`;

    svg.appendChild(xLabel);

    /*
       Draw the rotated Y-axis title.
    */

    const yLabelPosition =
        margin.top + plotHeight / 2;

    const yLabel = svgElement(
        "text",
        {
            x: 23,
            y: yLabelPosition,
            class: "chart-axis-label",
            "text-anchor": "middle",

            transform:
                `rotate(-90 23 ${yLabelPosition})`
        }
    );

    yLabel.textContent =
        `${yProperty.label} (${yUnit})`;

    svg.appendChild(yLabel);

    /*
       Draw every valid material as a colored circle.
    */

    const pointGroup = svgElement(
        "g",
        {
            "clip-path": `url(#${clipId})`
        }
    );

    state.points.forEach(
        (point) => {
            const materialName =
                clean(point.material.name) ||
                "Unnamed material";

            const hasDrawableRange =
                (point.xMin !== point.xMax || point.yMin !== point.yMax) &&
                (controls.scale.value !== "log" ||
                    (point.xMin > 0 && point.yMin > 0));

            if (hasDrawableRange) {
                const left = Math.min(xToPixel(point.xMin), xToPixel(point.xMax));
                const right = Math.max(xToPixel(point.xMin), xToPixel(point.xMax));
                const top = Math.min(yToPixel(point.yMin), yToPixel(point.yMax));
                const bottom = Math.max(yToPixel(point.yMin), yToPixel(point.yMax));
                pointGroup.appendChild(svgElement("rect", {
                    x: left,
                    y: top,
                    width: Math.max(3, right - left),
                    height: Math.max(3, bottom - top),
                    rx: 3,
                    fill: familyColors[point.family],
                    opacity: "0.18",
                    stroke: familyColors[point.family],
                    "stroke-width": "1.5",
                    class: "material-range",
                    "pointer-events": "none"
                }));
            }

            const renderedPoint = {
                point,
                x: xToPixel(point.x),
                y: yToPixel(point.y),
                index: state.renderedPoints.length
            };

            state.renderedPoints.push(renderedPoint);

            const circle = svgElement(
                "circle",
                {
                    cx: renderedPoint.x,
                    cy: renderedPoint.y,
                    r: 7,

                    fill:
                        familyColors[point.family],

                    class: "material-point",
                    tabindex: "0",
                    role: "button",

                    "aria-label":
                        `${materialName}: ` +
                        `${formatNumber(point.x)} ${xUnit}, ` +
                        `${formatNumber(point.y)} ${yUnit}`
                }
            );

            circle.addEventListener(
                "mouseenter",
                (event) => {
                    const cluster = nearbyRenderedPoints(event);
                    const hovered = cluster[0] || renderedPoint;

                    showTooltip(
                        event,
                        hovered.point,
                        xUnit,
                        yUnit,
                        cluster.length
                    );
                }
            );

            circle.addEventListener(
                "mousemove",
                positionTooltip
            );

            circle.addEventListener(
                "mouseleave",
                hideTooltip
            );

            circle.addEventListener(
                "focus",
                (event) => {
                    showTooltip(
                        event,
                        point,
                        xUnit,
                        yUnit
                    );
                }
            );

            circle.addEventListener(
                "blur",
                hideTooltip
            );

            circle.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    const cluster = nearbyRenderedPoints(event);
                    const selected = nextClusterPoint(cluster) || renderedPoint;

                    openMaterialPopover(
                        selected.point,
                        xUnit,
                        yUnit
                    );

                    showTooltip(
                        event,
                        selected.point,
                        xUnit,
                        yUnit,
                        cluster.length,
                        cluster.indexOf(selected) + 1
                    );
                }
            );

            circle.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        openMaterialPopover(
                            point,
                            xUnit,
                            yUnit
                        );
                    }
                }
            );

            pointGroup.appendChild(circle);
        }
    );

    svg.appendChild(pointGroup);

    renderLegend();
}


/* =========================================================
   17. MATERIAL HOVER TOOLTIP
   ========================================================= */

function showTooltip(
    event,
    point,
    xUnit,
    yUnit,
    nearbyCount = 1,
    nearbyPosition = 1
) {
    const tooltip =
        getElement("chart-tooltip");

    const materialName =
        clean(point.material.name) ||
        "Unnamed material";

    tooltip.innerHTML = `
        <strong>
            ${escapeHtml(materialName)}
        </strong>

        ${escapeHtml(point.family)}

        <br>

        ${escapeHtml(
            properties[
                controls.xProperty.value
            ].label
        )}:
        ${formatRange(point.xMin, point.xMax)}
        ${escapeHtml(xUnit)}

        <br>

        ${escapeHtml(
            properties[
                controls.yProperty.value
            ].label
        )}:
        ${formatRange(point.yMin, point.yMax)}
        ${escapeHtml(yUnit)}

        ${nearbyCount > 1 ? `
            <br><br>
            <em>${nearbyPosition} of ${nearbyCount} nearby materials — click repeatedly to cycle</em>
        ` : ""}
    `;

    tooltip.hidden = false;

    positionTooltip(event);
}


/*
   Find all material points close to the pointer. SVG normally sends an
   event only to the topmost circle, which makes coincident points
   impossible to reach. Hit-testing the complete rendered point list lets
   every material in a dense cluster remain selectable.
*/
function nearbyRenderedPoints(event, radius = 16) {
    const svg = getElement("ashby-chart");
    const matrix = svg.getScreenCTM();

    if (!matrix) return [];

    const pointer = new DOMPoint(event.clientX, event.clientY)
        .matrixTransform(matrix.inverse());

    return state.renderedPoints
        .map((renderedPoint) => ({
            ...renderedPoint,
            distance: Math.hypot(
                renderedPoint.x - pointer.x,
                renderedPoint.y - pointer.y
            )
        }))
        .filter((renderedPoint) => renderedPoint.distance <= radius)
        .sort((first, second) =>
            first.distance - second.distance || first.index - second.index
        );
}


function clusterKey(cluster) {
    return cluster
        .map(({ point, index }) =>
            clean(point.material.id) ||
            clean(point.material.name) ||
            `point-${index}`
        )
        .sort()
        .join("|");
}


function nextClusterPoint(cluster) {
    if (!cluster.length) return null;

    const key = clusterKey(cluster);
    const previous = state.clusterSelection;
    const nextIndex = previous && previous.key === key
        ? (previous.index + 1) % cluster.length
        : 0;

    state.clusterSelection = {
        key,
        index: nextIndex
    };

    return cluster[nextIndex];
}

function formatRange(minimum, maximum) {
    if (minimum === maximum) return formatNumber(minimum);
    return `${formatNumber(minimum)}–${formatNumber(maximum)}`;
}


function positionTooltip(event) {
    const stage =
        getElement("chart-stage")
            .getBoundingClientRect();

    const tooltip =
        getElement("chart-tooltip");

    const clientX =
        event.clientX ||
        stage.left + stage.width / 2;

    const clientY =
        event.clientY ||
        stage.top + stage.height / 2;

    tooltip.style.left = `${
        Math.min(
            clientX - stage.left + 14,
            stage.width - 275
        )
    }px`;

    tooltip.style.top = `${
        Math.max(
            8,
            clientY - stage.top - 20
        )
    }px`;
}


function hideTooltip() {
    getElement("chart-tooltip").hidden = true;
}


/*
   Protect displayed material text from being interpreted
   as HTML.
*/

function escapeHtml(value) {
    const container =
        document.createElement("div");

    container.textContent = value;

    return container.innerHTML;
}


/* =========================================================
   18. CLICKED MATERIAL ACTION PANEL
   ========================================================= */

function openMaterialPopover(
    point,
    xUnit,
    yUnit
) {
    state.selectedMaterial =
        point.material;

    getElement("popover-family").textContent =
        point.family;

    getElement("popover-name").textContent =
        clean(point.material.name) ||
        "Unnamed material";

    getElement("popover-properties").innerHTML = `
        <div>
            <dt>
                ${escapeHtml(
                    properties[
                        controls.xProperty.value
                    ].label
                )}
            </dt>

            <dd>
                ${formatRange(point.xMin, point.xMax)}
                ${escapeHtml(xUnit)}
            </dd>
        </div>

        <div>
            <dt>
                ${escapeHtml(
                    properties[
                        controls.yProperty.value
                    ].label
                )}
            </dt>

            <dd>
                ${formatRange(point.yMin, point.yMax)}
                ${escapeHtml(yUnit)}
            </dd>
        </div>

        <div>
            <dt>Category</dt>

            <dd>
                ${escapeHtml(
                    clean(point.material.category) ||
                    "Not reported"
                )}
            </dd>
        </div>

        <div>
            <dt>Supplier</dt>

            <dd>
                ${escapeHtml(
                    clean(point.material.supplier) ||
                    "Not reported"
                )}
            </dd>
        </div>
    `;

    /*
       Link the selected chart point to its complete
       material-details page.
    */

    getElement("popover-details-link").href =
        `material-details.html?id=${
            encodeURIComponent(
                point.material.id
            )
        }`;

    updateComparisonButton();

    getElement("material-popover").hidden =
        false;
}


/* =========================================================
   19. MATERIAL COMPARISON STORAGE
   ========================================================= */

function comparisonIds() {
    try {
        const savedIds = JSON.parse(
            localStorage.getItem(
                COMPARE_KEY
            ) || "[]"
        );

        return Array.isArray(savedIds)
            ? savedIds
            : [];
    } catch (error) {
        console.error(
            "Comparison selections could not be loaded.",
            error
        );

        return [];
    }
}


function updateComparisonButton(message = "") {
    const savedIds = comparisonIds();

    const isSaved =
        state.selectedMaterial &&
        savedIds.includes(
            state.selectedMaterial.id
        );

    getElement(
        "popover-compare"
    ).textContent = isSaved
        ? "Remove from comparison"
        : "Add to comparison";

    getElement(
        "popover-comparison-status"
    ).textContent =
        message ||
        (
            isSaved
                ? "Saved in your Material Selector comparison."
                : ""
        );
}


function toggleComparison() {
    if (!state.selectedMaterial) {
        return;
    }

    const savedIds = comparisonIds();

    const materialIndex =
        savedIds.indexOf(
            state.selectedMaterial.id
        );

    const materialWillBeAdded =
        materialIndex < 0;

    if (materialWillBeAdded) {
        savedIds.push(
            state.selectedMaterial.id
        );
    } else {
        savedIds.splice(
            materialIndex,
            1
        );
    }

    localStorage.setItem(
        COMPARE_KEY,
        JSON.stringify(savedIds)
    );

    if (materialWillBeAdded) {
        updateComparisonButton(
            "Added. Open Material Selector to compare it."
        );
    } else {
        updateComparisonButton(
            "Removed from comparison."
        );
    }
}


/* =========================================================
   20. FAMILY COLOR LEGEND
   ========================================================= */

function renderLegend() {
    const legend =
        getElement("family-legend");

    legend.replaceChildren();

    const usedFamilies = [
        ...new Set(
            state.points.map(
                (point) => point.family
            )
        )
    ].sort();

    usedFamilies.forEach(
        (family) => {
            const item =
                document.createElement("span");

            item.className = "legend-item";

            const colorSwatch =
                document.createElement("span");

            colorSwatch.className =
                "legend-swatch";

            colorSwatch.style.background =
                familyColors[family];

            item.append(
                colorSwatch,
                document.createTextNode(family)
            );

            legend.appendChild(item);
        }
    );
}


/* =========================================================
   21. ZOOM CONTROLS
   ========================================================= */

function zoomView(
    factor,
    centerX = 0.5,
    centerY = 0.5
) {
    if (!state.view) {
        return;
    }

    ["x", "y"].forEach(
        (axis) => {
            const centerRatio =
                axis === "x"
                    ? centerX
                    : centerY;

            const [
                minimum,
                maximum
            ] = state.view[axis];

            const center =
                minimum +
                (
                    maximum - minimum
                ) *
                centerRatio;

            const newSpan =
                (
                    maximum - minimum
                ) *
                factor;

            state.view[axis] = [
                center -
                    newSpan *
                    centerRatio,

                center +
                    newSpan *
                    (
                        1 - centerRatio
                    )
            ];
        }
    );

    drawChart(false);
}


/* =========================================================
   22. CHART PANNING
   ========================================================= */

function startPan(event) {
    const clickedMaterialPoint =
        event.target.classList.contains(
            "material-point"
        );

    if (
        clickedMaterialPoint ||
        !state.view
    ) {
        return;
    }

    state.isPanning = true;

    state.panStart = {
        x: event.clientX,
        y: event.clientY,

        view: structuredClone(
            state.view
        )
    };

    getElement(
        "ashby-chart"
    ).classList.add(
        "is-panning"
    );

    if (
        event.currentTarget.setPointerCapture
    ) {
        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    }
}


function movePan(event) {
    if (
        !state.isPanning ||
        !state.panStart
    ) {
        return;
    }

    const chartBounds =
        getElement("ashby-chart")
            .getBoundingClientRect();

    const originalView =
        state.panStart.view;

    const xShift =
        -(
            event.clientX -
            state.panStart.x
        ) /
        chartBounds.width *
        (
            originalView.x[1] -
            originalView.x[0]
        );

    const yShift =
        (
            event.clientY -
            state.panStart.y
        ) /
        chartBounds.height *
        (
            originalView.y[1] -
            originalView.y[0]
        );

    state.view = {
        x: originalView.x.map(
            (value) => value + xShift
        ),

        y: originalView.y.map(
            (value) => value + yShift
        )
    };

    drawChart(false);
}


function stopPan() {
    state.isPanning = false;
    state.panStart = null;

    getElement(
        "ashby-chart"
    ).classList.remove(
        "is-panning"
    );
}


/* =========================================================
   23. INITIALIZE THE PAGE
   ========================================================= */

async function initialize() {
    /*
       Add property choices to the X and Y dropdowns.
    */

    populatePropertySelect(
        controls.xProperty
    );

    populatePropertySelect(
        controls.yProperty
    );

    /*
       Set the default Ashby chart.
    */

    controls.xProperty.value =
        "density";

    controls.yProperty.value =
        "youngsModulus";

    populateUnitSelect(
        controls.xProperty,
        controls.xUnit,
        "gcm3"
    );

    populateUnitSelect(
        controls.yProperty,
        controls.yUnit,
        "gpa"
    );

    /*
       Prefer the shared Supabase catalog when it contains records. If the
       local preview cannot reach Supabase, fall back to the browser catalog.
       These sources are intentionally exclusive so the same import is never
       displayed twice.
    */

    let sharedRecords = [];
    try {
        sharedRecords = window.varcoApi
            ? await window.varcoApi.listMaterials()
            : [];
    } catch (error) {
        console.error("Shared materials could not be loaded.", error);
    }

    if (sharedRecords.length) {
        state.materials = sharedRecords.map(normalizeSharedMaterial);
    } else {
        const manualRecords = manualMaterials();
        const spreadsheetRecords = await spreadsheetMaterials();

        state.materials = [
            ...manualRecords,
            ...spreadsheetRecords
        ].filter((material, index, records) =>
            records.findIndex((candidate) =>
                candidate.id === material.id
            ) === index
        );
    }

    populateFamilies();

    drawChart(true);
}


/* =========================================================
   24. FILTER AND UNIT EVENTS
   ========================================================= */

controls.xProperty.addEventListener(
    "change",
    () => {
        populateUnitSelect(
            controls.xProperty,
            controls.xUnit
        );

        drawChart(true);
    }
);


controls.yProperty.addEventListener(
    "change",
    () => {
        populateUnitSelect(
            controls.yProperty,
            controls.yUnit
        );

        drawChart(true);
    }
);


[
    controls.xUnit,
    controls.yUnit,
    controls.scale,
    controls.family
].forEach(
    (control) => {
        control.addEventListener(
            "change",
            () => {
                drawChart(true);
            }
        );
    }
);


/* =========================================================
   25. SWAP X AND Y AXES
   ========================================================= */

getElement("swap-axes").addEventListener(
    "click",
    () => {
        const oldXProperty =
            controls.xProperty.value;

        const oldXUnit =
            controls.xUnit.value;

        const oldYProperty =
            controls.yProperty.value;

        const oldYUnit =
            controls.yUnit.value;

        controls.xProperty.value =
            oldYProperty;

        controls.yProperty.value =
            oldXProperty;

        populateUnitSelect(
            controls.xProperty,
            controls.xUnit,
            oldYUnit
        );

        populateUnitSelect(
            controls.yProperty,
            controls.yUnit,
            oldXUnit
        );

        drawChart(true);
    }
);


/* =========================================================
   26. BUTTON EVENTS
   ========================================================= */

getElement("zoom-in").addEventListener(
    "click",
    () => {
        zoomView(0.75);
    }
);


getElement("zoom-out").addEventListener(
    "click",
    () => {
        zoomView(1.35);
    }
);


getElement("reset-view").addEventListener(
    "click",
    resetView
);


getElement("close-popover").addEventListener(
    "click",
    () => {
        getElement(
            "material-popover"
        ).hidden = true;
    }
);


getElement("popover-compare").addEventListener(
    "click",
    toggleComparison
);


/* =========================================================
   27. MOUSE-WHEEL ZOOM
   ========================================================= */

const chart =
    getElement("ashby-chart");

chart.addEventListener(
    "wheel",
    (event) => {
        event.preventDefault();

        const bounds =
            chart.getBoundingClientRect();

        const horizontalPosition =
            (
                event.clientX -
                bounds.left
            ) /
            bounds.width;

        const verticalPosition =
            1 -
            (
                event.clientY -
                bounds.top
            ) /
            bounds.height;

        const zoomFactor =
            event.deltaY < 0
                ? 0.82
                : 1.22;

        zoomView(
            zoomFactor,
            horizontalPosition,
            verticalPosition
        );
    },

    {
        passive: false
    }
);


/* =========================================================
   28. POINTER EVENTS FOR PANNING
   ========================================================= */

chart.addEventListener(
    "pointerdown",
    startPan
);

chart.addEventListener(
    "pointermove",
    movePan
);

chart.addEventListener(
    "pointerup",
    stopPan
);

chart.addEventListener(
    "pointercancel",
    stopPan
);


/* =========================================================
   29. REDRAW AFTER WINDOW RESIZING
   ========================================================= */

window.addEventListener(
    "resize",
    () => {
        drawChart(false);
    }
);


/* =========================================================
   30. START THE ASHBY CHART PAGE
   ========================================================= */

initialize();