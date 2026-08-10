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
        "Material Density"
    ],

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

    tensileStrength: [
        "Tensile Strength (MPa)",
        "Tensile Strength"
    ],

    fractureToughness: [
        "Fracture Toughness (MPa·m^0.5)",
        "Fracture Toughness"
    ],

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
    selectedMaterial: null,
    view: null,
    isPanning: false,
    panStart: null
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
    const property = properties[propertyKey];

    const rangeFieldNames = {
        density: ["densityMin", "densityMax"],
        youngsModulus: ["youngsModulusMin", "youngsModulusMax"],
        tensileStrength: ["tensileStrengthMin", "tensileStrengthMax"],
        fractureToughness: ["fractureToughnessMin", "fractureToughnessMax"],
        meltingPoint: ["meltingPointMin", "meltingPointMax"]
    };
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
            const xBase = baseValue(
                material,
                xPropertyKey
            );

            const yBase = baseValue(
                material,
                yPropertyKey
            );

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
                    )
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
            state.points.map(
                (point) => transformed(point.x)
            )
        ),

        y: paddedDomain(
            state.points.map(
                (point) => transformed(point.y)
            )
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

            const circle = svgElement(
                "circle",
                {
                    cx: xToPixel(point.x),
                    cy: yToPixel(point.y),
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
                    showTooltip(
                        event,
                        point,
                        xUnit,
                        yUnit
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

                    openMaterialPopover(
                        point,
                        xUnit,
                        yUnit
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
    yUnit
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
        ${formatNumber(point.x)}
        ${escapeHtml(xUnit)}

        <br>

        ${escapeHtml(
            properties[
                controls.yProperty.value
            ].label
        )}:
        ${formatNumber(point.y)}
        ${escapeHtml(yUnit)}
    `;

    tooltip.hidden = false;

    positionTooltip(event);
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
                ${formatNumber(point.x)}
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
                ${formatNumber(point.y)}
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
       Load both manually added and imported materials.
    */

    let sharedRecords = [];
    try {
        sharedRecords = window.varcoApi
            ? await window.varcoApi.listMaterials()
            : [];
    } catch (error) {
        console.error("Shared materials could not be loaded.", error);
    }

    // Supabase is the only material-record source so chart counts and points
    // remain identical for signed-in and public users on every device.
    state.materials = sharedRecords;

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