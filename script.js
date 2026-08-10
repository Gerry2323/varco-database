/* =========================================================
   VARCO MATERIALS DATABASE
   Complete JavaScript for the eight-section material form
   ========================================================= */

"use strict";

/* ---------- Main page elements ---------- */
const addMaterialButton = document.getElementById("add-material-button");
const materialForm = document.getElementById("material-form");
const materialFormTitle = document.getElementById("material-form-title");
const closeFormButton = document.getElementById("close-form-button");
const cancelButton = document.getElementById("cancel-button");
const saveMaterialButton = document.getElementById("save-material-button");
const materialSearchInput = document.getElementById("material-search");
const materialsTableBody = document.getElementById("materials-table-body");
const materialCount = document.getElementById("material-count");
const categoryCount = document.getElementById("category-count");
const recordCount = document.getElementById("record-count");
const manufacturingMethodError = document.getElementById(
    "manufacturing-method-error"
);

/* ---------- Every regular form field saved in a record ---------- */
const fieldMap = {
    name: "material-name",
    category: "material-category",
    feedstockForm: "material-feedstock-form",
    composition: "material-composition",
    compositionBasis: "material-composition-basis",
    particleSizeMin: "particle-size-min",
    particleSizeMax: "particle-size-max",
    particleSizeAverage: "particle-size-average",
    particleSizeMethod: "particle-size-method",
    powderFlowability: "powder-flowability",
    apparentDensity: "apparent-density",
    purity: "material-purity",
    supplier: "material-supplier",
    productName: "product-name",
    productNumber: "product-number",
    density: "material-density",
    porosity: "material-porosity",
    hardnessValue: "hardness-value",
    hardnessScaleLoad: "hardness-scale-load",
    youngsModulus: "youngs-modulus",
    poissonsRatio: "poissons-ratio",
    tensileStrength: "tensile-strength",
    fractureToughness: "fracture-toughness",
    meltingPoint: "material-melting-point",
    maximumServiceTemperature: "maximum-service-temperature",
    thermalConductivity: "thermal-conductivity",
    thermalExpansion: "thermal-expansion",
    electricalProperty: "electrical-property",
    corrosionResistance: "corrosion-resistance",
    oxidationResistance: "oxidation-resistance",
    reportedAdvantages: "reported-advantages",
    reportedLimitations: "reported-limitations",
    sourceType: "material-source",
    sourceTitle: "source-title",
    sourceAuthor: "source-author",
    publicationYear: "publication-year",
    sourceFilename: "source-filename",
    sourcePage: "source-page",
    tableFigureNumber: "table-figure-number",
    doiUrl: "doi-url",
    documentLink: "material-document-link",
    dataQualityStatus: "data-quality-status",
    notes: "material-notes"
};

/* ---------- Multiple-selection fields ---------- */
const listDefinitions = {
    manufacturingMethods: {
        selectId: "material-manufacturing-method",
        containerId: "selected-manufacturing-methods"
    },
    morphologies: {
        selectId: "material-morphology",
        containerId: "selected-morphologies"
    },
    sprayProcesses: {
        selectId: "recommended-spray-process",
        containerId: "selected-spray-processes"
    },
    wearMechanisms: {
        selectId: "wear-mechanism",
        containerId: "selected-wear-mechanisms"
    },
    intendedApplications: {
        inputId: "intended-application-input",
        buttonId: "add-intended-application",
        containerId: "selected-intended-applications"
    },
    testStandards: {
        inputId: "test-standard-input",
        buttonId: "add-test-standard",
        containerId: "selected-test-standards"
    }
};

let materials = [];
let csvMaterials = [];
let editingMaterialId = null;
let listValues = createEmptyListValues();

function createEmptyListValues() {
    const emptyLists = {};

    Object.keys(listDefinitions).forEach(function (key) {
        emptyLists[key] = [];
    });

    return emptyLists;
}

function getField(recordKey) {
    return document.getElementById(fieldMap[recordKey]);
}

function createMaterialId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random().toString(16).slice(2);
}

/* Keeps records made with the older form compatible. */
function normalizeMaterial(material) {
    const normalized = {
        id: material.id || createMaterialId(),
        dateAdded: material.dateAdded || new Date().toISOString(),
        dateUpdated: material.dateUpdated || material.dateAdded || "",
        ...material
    };

    if (!normalized.sourceType && normalized.source) {
        normalized.sourceType = normalized.source;
    }

    Object.keys(listDefinitions).forEach(function (key) {
        if (!Array.isArray(normalized[key])) {
            normalized[key] = [];
        }
    });

    if (
        normalized.manufacturingMethods.length === 0 &&
        normalized.manufacturingMethod
    ) {
        normalized.manufacturingMethods = [normalized.manufacturingMethod];
    }

    return normalized;
}

/* =========================================================
   CSV MATERIALS STORED BY csv-files.js
   ========================================================= */

const CSV_DB_NAME = "varcoFileDatabase";
const CSV_STORE_NAME = "files";

const csvFieldAliases = {
    name: [
        "Material Name",
        "Name",
        "Material",
        "Powder Name",
        "Material or Powder",
        "Material Name / Designation",
        "Material Designation",
        "Material/Feedstock Name",
        "Feedstock Material",
        "Material System",
        "Material / Powder Name",
        "Material/Powder Name",
        "Material or Powder Name",
        "Coating Material",
        "Coating Material Name",
        "Material / Coating System",
        "Material/Coating System",
        "Powder Designation",
        "Feedstock Name",
        "Alloy Name",
        "Ceramic Name",
        "Product or Material Name"
    ],
    category: ["Category", "Classification", "Class"],
    feedstockForm: ["Feedstock Form", "Form", "Feedstock"],
    composition: [
        "Composition",
        "Chemical Composition",
        "Composition as Reported"
    ],
    compositionBasis: ["Composition Basis", "Basis"],
    manufacturingMethods: [
        "Manufacturing Methods",
        "Manufacturing Method"
    ],
    morphologies: ["Morphologies", "Morphology"],
    particleSizeMin: [
        "Particle Size Min (µm)",
        "Particle Size Min",
        "Minimum Particle Size"
    ],
    particleSizeMax: [
        "Particle Size Max (µm)",
        "Particle Size Max",
        "Maximum Particle Size"
    ],
    particleSizeAverage: [
        "Particle Size Average (µm)",
        "Particle Size Average",
        "D50"
    ],
    particleSizeMethod: ["Particle Size Method"],
    powderFlowability: ["Powder Flowability", "Flowability"],
    apparentDensity: ["Apparent Density (g/cm³)", "Apparent Density"],
    purity: ["Purity (%)", "Purity"],
    supplier: ["Supplier", "Manufacturer"],
    productName: ["Product Name"],
    productNumber: ["Product Number", "Product ID"],
    density: ["Density (g/cm³)", "Density", "Material Density"],
    porosity: ["Porosity (%)", "Porosity"],
    hardnessValue: ["Hardness Value", "Hardness"],
    hardnessScaleLoad: ["Hardness Scale and Load", "Hardness Scale Load"],
    youngsModulus: [
        "Young's Modulus (GPa)",
        "Youngs Modulus",
        "Elastic Modulus"
    ],
    poissonsRatio: ["Poisson's Ratio", "Poissons Ratio"],
    tensileStrength: ["Tensile Strength (MPa)", "Tensile Strength"],
    fractureToughness: [
        "Fracture Toughness (MPa·m^0.5)",
        "Fracture Toughness"
    ],
    meltingPoint: ["Melting Point (°C)", "Melting Point", "Melt Point"],
    maximumServiceTemperature: [
        "Maximum Service Temperature (°C)",
        "Maximum Service Temperature"
    ],
    thermalConductivity: [
        "Thermal Conductivity (W/m·K)",
        "Thermal Conductivity"
    ],
    thermalExpansion: [
        "Thermal Expansion (µm/m·K)",
        "Thermal Expansion"
    ],
    electricalProperty: ["Electrical Property"],
    corrosionResistance: ["Corrosion Resistance"],
    oxidationResistance: ["Oxidation Resistance"],
    sprayProcesses: [
        "Recommended Spray Processes",
        "Recommended Spray Process"
    ],
    wearMechanisms: ["Wear Mechanisms", "Wear Mechanism"],
    intendedApplications: [
        "Intended Applications",
        "Intended Application"
    ],
    reportedAdvantages: ["Reported Advantages", "Advantages"],
    reportedLimitations: ["Reported Limitations", "Limitations"],
    sourceType: ["Source Type", "Reference Type"],
    sourceTitle: ["Source Title", "Reference", "Citation"],
    sourceAuthor: [
        "Source Author or Organization",
        "Source Author",
        "Author",
        "Organization"
    ],
    publicationYear: ["Publication Year", "Year"],
    sourceFilename: ["Source Filename", "Reference Filename"],
    sourcePage: ["Source Page", "Page"],
    tableFigureNumber: [
        "Table or Figure Number",
        "Table Figure Number"
    ],
    doiUrl: ["DOI or URL", "DOI", "URL"],
    documentLink: ["Document Link", "Source Link", "Reference Link"],
    testStandards: ["Test Standards", "Test Standard"],
    dataQualityStatus: ["Data Quality Status", "Verification Status"],
    notes: ["Notes"]
};

function comparableHeader(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function splitCsvList(value) {
    if (!value || value === "Not Reported") {
        return value ? [value] : [];
    }

    return String(value)
        .split(/[;|]/)
        .map(function (item) {
            return item.trim();
        })
        .filter(Boolean);
}

function csvRowToMaterial(headers, row, file, rowIndex) {
    const record = window.VarcoSchema
        ? window.VarcoSchema.rowToMaterial(headers, row)
        : {};

    Object.entries(csvFieldAliases).forEach(function ([key, aliases]) {
        const accepted = aliases.map(comparableHeader);

        const columnIndex = headers.findIndex(function (header) {
            return accepted.includes(comparableHeader(header));
        });

        record[key] =
            columnIndex >= 0
                ? String(row[columnIndex] ?? "").trim() || "Not Reported"
                : record[key] || "Not Reported";
    });

    /*
        Recover the material name when an older imported
        file placed it in a nonstandard column.
    */
    if (record.name === "Not Reported") {
        const fallbackNameIndex = headers.findIndex(function (header) {
            const normalized = comparableHeader(header);

            const includesName =
                normalized.includes("name") ||
                normalized.includes("designation");

            const includesMaterialKind =
                normalized.includes("material") ||
                normalized.includes("powder") ||
                normalized.includes("feedstock") ||
                normalized.includes("coating") ||
                normalized.includes("alloy") ||
                normalized.includes("ceramic") ||
                normalized.includes("product");

            return includesName && includesMaterialKind;
        });

        if (fallbackNameIndex >= 0) {
            const recoveredName =
                String(row[fallbackNameIndex] ?? "").trim();

            if (
                recoveredName &&
                recoveredName !== "Not Reported"
            ) {
                record.name = recoveredName;
            }
        }
    }

    [
        "manufacturingMethods",
        "morphologies",
        "sprayProcesses",
        "wearMechanisms",
        "intendedApplications",
        "testStandards"
    ].forEach(function (key) {
        record[key] = splitCsvList(record[key]);
    });

    if (record.sourceTitle === "Not Reported") {
        record.sourceTitle = file.name;
    }

    if (record.sourceFilename === "Not Reported") {
        record.sourceFilename = file.name;
    }

    if (record.sourceType === "Not Reported") {
        record.sourceType = "Other";
    }

    return normalizeMaterial({
        ...record,
        id: `csv:${file.id}:${rowIndex}`,
        dateAdded: file.dateAdded,
        dateUpdated: file.dateModified || file.dateAdded,
        importedFromCsv: true,
        csvFileId: file.id
    });
}

function loadCsvMaterials() {
    return new Promise(function (resolve) {
        const request = indexedDB.open(CSV_DB_NAME, 1);

        request.onupgradeneeded = function () {
            const database = request.result;

            if (
                !database.objectStoreNames.contains(
                    CSV_STORE_NAME
                )
            ) {
                database.createObjectStore(
                    CSV_STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );
            }
        };

        request.onerror = function () {
            console.error(
                "CSV materials could not be loaded:",
                request.error
            );

            resolve([]);
        };

        request.onsuccess = function () {
            const database = request.result;

            const transaction = database.transaction(
                CSV_STORE_NAME,
                "readonly"
            );

            const getAllRequest = transaction
                .objectStore(CSV_STORE_NAME)
                .getAll();

            getAllRequest.onerror = function () {
                database.close();
                resolve([]);
            };

            getAllRequest.onsuccess = function () {
                const imported = [];

                getAllRequest.result.forEach(function (file) {
                    const rows = Array.isArray(file.rows)
                        ? file.rows
                        : [];

                    if (rows.length < 2) {
                        return;
                    }

                    rows.slice(1).forEach(function (row, index) {
                        const containsData = row.some(function (value) {
                            return String(value ?? "").trim();
                        });

                        if (containsData) {
                            imported.push(
                                csvRowToMaterial(
                                    rows[0],
                                    row,
                                    file,
                                    index + 1
                                )
                            );
                        }
                    });
                });

                database.close();
                resolve(imported);
            };
        };
    });
}

function allMaterials() {
    // Supabase is the single source of truth for material records.
    // Browser-local spreadsheet rows are intentionally excluded because
    // combining them creates duplicate and device-dependent counts.
    return materials;
}

/* =========================================================
   OPEN, CLOSE, AND RESET THE FORM
   ========================================================= */

function openMaterialForm(materialToEdit = null) {
    resetMaterialForm();

    materialForm.hidden = false;

    addMaterialButton.setAttribute(
        "aria-expanded",
        "true"
    );

    if (materialToEdit) {
        editingMaterialId = materialToEdit.id;
        materialFormTitle.textContent = "Edit Material";
        saveMaterialButton.textContent = "Save Changes";
        fillMaterialForm(materialToEdit);
    } else {
        materialFormTitle.textContent = "Add a New Material";
        saveMaterialButton.textContent = "Save Material";
    }

    materialForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    getField("name").focus({
        preventScroll: true
    });
}

function closeMaterialForm() {
    materialForm.hidden = true;

    addMaterialButton.setAttribute(
        "aria-expanded",
        "false"
    );

    resetMaterialForm();
    addMaterialButton.focus();
}

function resetMaterialForm() {
    materialForm.reset();
    editingMaterialId = null;
    listValues = createEmptyListValues();
    manufacturingMethodError.hidden = true;

    Object.keys(listDefinitions).forEach(renderList);
}

function fillMaterialForm(material) {
    Object.keys(fieldMap).forEach(function (recordKey) {
        const field = getField(recordKey);

        if (field) {
            field.value = material[recordKey] ?? "";
        }
    });

    Object.keys(listDefinitions).forEach(function (key) {
        listValues[key] = Array.isArray(material[key])
            ? [...material[key]]
            : [];

        renderList(key);
    });
}

addMaterialButton.addEventListener("click", function () {
    openMaterialForm();
});

closeFormButton.addEventListener(
    "click",
    closeMaterialForm
);

cancelButton.addEventListener(
    "click",
    closeMaterialForm
);

/* =========================================================
   MULTIPLE-SELECTION AND REPEATABLE TEXT ENTRIES
   ========================================================= */

function addListValue(key, value) {
    const cleanValue = value.trim();

    if (!cleanValue) {
        return;
    }

    const alreadyExists = listValues[key].some(
        function (existingValue) {
            return (
                existingValue.toLowerCase() ===
                cleanValue.toLowerCase()
            );
        }
    );

    if (!alreadyExists) {
        listValues[key].push(cleanValue);
    }

    if (key === "manufacturingMethods") {
        manufacturingMethodError.hidden = true;
    }

    renderList(key);
}

function removeListValue(key, valueToRemove) {
    listValues[key] = listValues[key].filter(
        function (value) {
            return value !== valueToRemove;
        }
    );

    renderList(key);
}

function renderList(key) {
    const definition = listDefinitions[key];

    const container = document.getElementById(
        definition.containerId
    );

    container.replaceChildren();

    listValues[key].forEach(function (value) {
        const tag = document.createElement("span");

        tag.className =
            key === "manufacturingMethods"
                ? "method-tag selected-method"
                : "selection-tag";

        const label = document.createElement("span");
        label.textContent = value;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-method-button";
        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            "Remove " + value
        );

        removeButton.addEventListener(
            "click",
            function () {
                removeListValue(key, value);
            }
        );

        tag.append(label, removeButton);
        container.appendChild(tag);
    });
}

Object.keys(listDefinitions).forEach(function (key) {
    const definition = listDefinitions[key];

    if (definition.selectId) {
        const select = document.getElementById(
            definition.selectId
        );

        select.addEventListener(
            "change",
            function () {
                addListValue(key, select.value);
                select.value = "";
            }
        );
    }

    if (definition.inputId) {
        const input = document.getElementById(
            definition.inputId
        );

        const button = document.getElementById(
            definition.buttonId
        );

        function addTextEntry() {
            addListValue(key, input.value);
            input.value = "";
            input.focus();
        }

        button.addEventListener(
            "click",
            addTextEntry
        );

        input.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addTextEntry();
                }
            }
        );
    }
});

/* =========================================================
   SAVE A NEW OR EDITED MATERIAL
   ========================================================= */

function buildMaterialRecord() {
    const record = {};

    Object.keys(fieldMap).forEach(function (recordKey) {
        record[recordKey] = getField(recordKey)
            .value
            .trim();
    });

    Object.keys(listDefinitions).forEach(function (key) {
        record[key] = [...listValues[key]];
    });

    return record;
}

materialForm.addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        if (
            listValues.manufacturingMethods.length === 0
        ) {
            manufacturingMethodError.hidden = false;

            document
                .getElementById(
                    "material-manufacturing-method"
                )
                .focus();

            return;
        }

        manufacturingMethodError.hidden = true;

        if (!window.varcoApi) {
            window.alert(
                "The shared database connection did not load. Refresh the page and try again."
            );
            return;
        }

        const existingMaterial = editingMaterialId
            ? materials.find(function (material) {
                  return material.id === editingMaterialId;
              })
            : null;

        const materialToSave = {
            ...(existingMaterial || {}),
            ...buildMaterialRecord()
        };

        if (!existingMaterial) {
            delete materialToSave.id;
        }

        saveMaterialButton.disabled = true;
        saveMaterialButton.textContent = "Saving...";

        try {
            const savedMaterial = normalizeMaterial(
                await window.varcoApi.saveMaterial(materialToSave)
            );

            const materialIndex = materials.findIndex(function (material) {
                return material.id === savedMaterial.id;
            });

            if (materialIndex === -1) {
                materials.unshift(savedMaterial);
            } else {
                materials[materialIndex] = savedMaterial;
            }

            renderMaterials();
            updateDashboard();
            closeMaterialForm();
        } catch (error) {
            console.error("Material could not be saved to Supabase:", error);
            window.alert(
                "The material was not saved. " +
                (error?.message || "Please try again.")
            );
        } finally {
            saveMaterialButton.disabled = false;
            saveMaterialButton.textContent = editingMaterialId
                ? "Save Changes"
                : "Save Material";
        }
    }
);

/* =========================================================
   SEARCH AND DISPLAY THE FIVE NEWEST MATERIALS
   ========================================================= */

function materialMatchesSearch(
    material,
    searchText
) {
    if (!searchText) {
        return true;
    }

    const searchableValues = [];

    Object.keys(material).forEach(function (key) {
        const value = material[key];

        if (Array.isArray(value)) {
            searchableValues.push(
                value.join(" ")
            );
        } else if (
            value !== null &&
            value !== undefined
        ) {
            searchableValues.push(
                String(value)
            );
        }
    });

    return searchableValues
        .join(" ")
        .toLowerCase()
        .includes(searchText);
}

function renderMaterials() {
    const searchText = materialSearchInput
        ? materialSearchInput.value
              .trim()
              .toLowerCase()
        : "";

    const combinedMaterials = allMaterials();

    const filteredMaterials = combinedMaterials
        .filter(function (material) {
            return materialMatchesSearch(
                material,
                searchText
            );
        })
        .sort(function (
            firstMaterial,
            secondMaterial
        ) {
            return (
                new Date(
                    secondMaterial.dateAdded
                ).getTime() -
                new Date(
                    firstMaterial.dateAdded
                ).getTime()
            );
        })
        .slice(0, 5);

    materialsTableBody.replaceChildren();

    if (filteredMaterials.length === 0) {
        const emptyRow =
            document.createElement("tr");

        emptyRow.className = "empty-row";

        const emptyCell =
            document.createElement("td");

        emptyCell.colSpan = 6;

        emptyCell.textContent =
            combinedMaterials.length === 0
                ? "No materials have been added yet."
                : "No materials match your search.";

        emptyRow.appendChild(emptyCell);
        materialsTableBody.appendChild(emptyRow);

        return;
    }

    filteredMaterials.forEach(function (material) {
        const row = document.createElement("tr");

        row.appendChild(
            createActionsCell(material)
        );

        row.appendChild(
            createMaterialNameCell(material)
        );

        row.appendChild(
            createTextCell(
                material.category ||
                "Not provided"
            )
        );

        row.appendChild(
            createTextCell(
                formatDate(material.dateAdded)
            )
        );

        row.appendChild(
            createTextCell(
                material.sourceTitle ||
                material.sourceAuthor ||
                material.sourceType ||
                "Not provided"
            )
        );

        row.appendChild(
            createDocumentCell(
                material.documentLink
            )
        );

        materialsTableBody.appendChild(row);
    });
}

function createTextCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;

    return cell;
}

function createMaterialNameCell(material) {
    const cell = document.createElement("td");

    /*
        CSV materials are displayed as text because
        they are edited on the CSV Files page.
    */
    if (material.importedFromCsv) {
        cell.textContent =
            material.name ||
            "Not Reported";

        return cell;
    }

    const link = document.createElement("a");
    link.href = "#";
    link.className = "material-name-link";

    link.textContent =
        material.name ||
        "Unnamed material";

    link.addEventListener(
        "click",
        function (event) {
            event.preventDefault();
            openMaterialForm(material);
        }
    );

    cell.appendChild(link);

    return cell;
}

function createDocumentCell(documentLink) {
    const cell = document.createElement("td");

    if (
        !documentLink ||
        documentLink === "Not Reported"
    ) {
        const emptyMessage =
            document.createElement("span");

        emptyMessage.className = "no-document";
        emptyMessage.textContent = "Not provided";

        cell.appendChild(emptyMessage);

        return cell;
    }

    const link = document.createElement("a");

    link.className = "document-link";
    link.href = documentLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open document";

    cell.appendChild(link);

    return cell;
}

function createActionsCell(material) {
    const cell = document.createElement("td");
    cell.className = "actions-column";

    if (material.importedFromCsv) {
        const label =
            document.createElement("span");

        label.className = "csv-source-label";
        label.textContent = "CSV";

        label.title =
            material.sourceFilename ||
            "Imported CSV record";

        cell.appendChild(label);

        return cell;
    }

    const menu = document.createElement("div");
    menu.className = "actions-menu";

    const menuButton =
        document.createElement("button");

    menuButton.type = "button";
    menuButton.className = "actions-menu-button";
    menuButton.textContent = "⋮";

    menuButton.setAttribute(
        "aria-label",
        "Actions for " + material.name
    );

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    const dropdown =
        document.createElement("div");

    dropdown.className = "actions-dropdown";
    dropdown.hidden = true;

    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.className = "edit-material-button";
    editButton.textContent = "Edit";

    editButton.addEventListener(
        "click",
        function () {
            closeAllActionMenus();
            openMaterialForm(material);
        }
    );

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-material-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
        "click",
        function () {
            closeAllActionMenus();
            deleteMaterial(material);
        }
    );

    menuButton.addEventListener(
        "click",
        function (event) {
            event.stopPropagation();

            const willOpen =
                dropdown.hidden;

            closeAllActionMenus();

            dropdown.hidden = !willOpen;

            menuButton.setAttribute(
                "aria-expanded",
                String(willOpen)
            );
        }
    );

    dropdown.addEventListener(
        "click",
        function (event) {
            event.stopPropagation();
        }
    );

    dropdown.append(
        editButton,
        deleteButton
    );

    menu.append(
        menuButton,
        dropdown
    );

    cell.appendChild(menu);

    return cell;
}

function closeAllActionMenus() {
    document
        .querySelectorAll(
            ".actions-dropdown"
        )
        .forEach(function (menu) {
            menu.hidden = true;
        });

    document
        .querySelectorAll(
            ".actions-menu-button"
        )
        .forEach(function (button) {
            button.setAttribute(
                "aria-expanded",
                "false"
            );
        });
}

async function deleteMaterial(material) {
    const confirmed = window.confirm(
        'Delete "' +
        material.name +
        '" from the database?'
    );

    if (!confirmed) {
        return;
    }

    if (!window.varcoApi) {
        window.alert(
            "The shared database connection did not load. Refresh the page and try again."
        );
        return;
    }

    try {
        await window.varcoApi.deleteMaterial(material.id);

        materials = materials.filter(
            function (savedMaterial) {
                return savedMaterial.id !== material.id;
            }
        );

        if (editingMaterialId === material.id) {
            closeMaterialForm();
        }

        renderMaterials();
        updateDashboard();
    } catch (error) {
        console.error("Material could not be deleted from Supabase:", error);
        window.alert(
            "The material was not deleted. " +
            (error?.message || "Please try again.")
        );
    }
}

function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (
        Number.isNaN(date.getTime())
    ) {
        return "Not available";
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}

if (materialSearchInput) {
    materialSearchInput.addEventListener(
        "input",
        renderMaterials
    );
}

document.addEventListener(
    "click",
    closeAllActionMenus
);

document.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Escape") {
            if (!materialForm.hidden) {
                closeMaterialForm();
            } else {
                closeAllActionMenus();
            }
        }
    }
);

/* =========================================================
   DASHBOARD AND STARTUP
   ========================================================= */

function updateDashboard() {
    const combinedMaterials = allMaterials();

    materialCount.textContent =
        combinedMaterials.length;

    const categories = new Set(
        combinedMaterials
            .map(function (material) {
                return material.category;
            })
            .filter(function (category) {
                return (
                    category &&
                    category !== "Not Reported"
                );
            })
    );

    categoryCount.textContent =
        categories.size;

    recordCount.textContent =
        combinedMaterials.length;
}

async function initializeMaterialsPage() {
    try {
        if (!window.varcoApi) {
            throw new Error(
                "The shared database connection did not load."
            );
        }

        materials = (await window.varcoApi.listMaterials())
            .map(normalizeMaterial);
    } catch (error) {
        console.error("Shared materials could not be loaded:", error);
        materials = [];
        window.alert(
            "Shared materials could not be loaded. " +
            (error?.message || "Refresh the page and try again.")
        );
    }

    csvMaterials = [];

    renderMaterials();
    updateDashboard();
}

initializeMaterialsPage();