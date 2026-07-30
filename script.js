/* =========================================================
   VARCO MATERIALS DATABASE
   JavaScript for the expandable material form
   ========================================================= */

"use strict";


/* =========================================================
   PAGE ELEMENTS
   ========================================================= */

const addMaterialButton =
    document.getElementById("add-material-button");

const materialForm =
    document.getElementById("material-form");

const materialFormTitle =
    document.getElementById("material-form-title");

const closeFormButton =
    document.getElementById("close-form-button");

const cancelButton =
    document.getElementById("cancel-button");

const saveMaterialButton =
    document.getElementById("save-material-button");

const materialSearchInput =
    document.getElementById("material-search");

const materialsTableBody =
    document.getElementById("materials-table-body");

const materialCount =
    document.getElementById("material-count");

const categoryCount =
    document.getElementById("category-count");

const recordCount =
    document.getElementById("record-count");

const manufacturingMethodError =
    document.getElementById("manufacturing-method-error");


/* =========================================================
   REGULAR FORM FIELDS
   Left side = saved database property
   Right side = matching HTML element ID
   ========================================================= */

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
    maximumServiceTemperature:
        "maximum-service-temperature",
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


/* =========================================================
   MULTIPLE-SELECTION FIELDS
   ========================================================= */

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


/* =========================================================
   DATABASE VARIABLES
   ========================================================= */

let materials = loadMaterials();
let editingMaterialId = null;
let listValues = createEmptyListValues();


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function createEmptyListValues() {
    const emptyLists = {};

    Object.keys(listDefinitions).forEach(function (key) {
        emptyLists[key] = [];
    });

    return emptyLists;
}


function getField(recordKey) {
    const fieldId = fieldMap[recordKey];

    if (!fieldId) {
        return null;
    }

    return document.getElementById(fieldId);
}


function createMaterialId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now() +
        "-" +
        Math.random().toString(16).slice(2)
    );
}


/* =========================================================
   LOAD AND SAVE BROWSER DATA
   ========================================================= */

function loadMaterials() {
    const savedMaterials =
        localStorage.getItem("varcoMaterials");

    if (!savedMaterials) {
        return [];
    }

    try {
        const parsedMaterials =
            JSON.parse(savedMaterials);

        if (!Array.isArray(parsedMaterials)) {
            return [];
        }

        return parsedMaterials.map(normalizeMaterial);
    } catch (error) {
        console.error(
            "VARCO materials could not be loaded:",
            error
        );

        return [];
    }
}


function normalizeMaterial(material) {
    const normalized = {
        id: material.id || createMaterialId(),

        dateAdded:
            material.dateAdded ||
            new Date().toISOString(),

        dateUpdated:
            material.dateUpdated ||
            material.dateAdded ||
            "",

        ...material
    };

    /*
       Compatibility with records created by
       the older version of the website.
    */

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
        normalized.manufacturingMethods = [
            normalized.manufacturingMethod
        ];
    }

    return normalized;
}


function saveMaterials() {
    localStorage.setItem(
        "varcoMaterials",
        JSON.stringify(materials)
    );
}


/* =========================================================
   OPEN, CLOSE, AND RESET FORM
   ========================================================= */

function openMaterialForm(materialToEdit = null) {
    if (!materialForm) {
        return;
    }

    resetMaterialForm();

    materialForm.hidden = false;

    if (addMaterialButton) {
        addMaterialButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    if (materialToEdit) {
        editingMaterialId = materialToEdit.id;

        if (materialFormTitle) {
            materialFormTitle.textContent =
                "Edit Material";
        }

        if (saveMaterialButton) {
            saveMaterialButton.textContent =
                "Save Changes";
        }

        fillMaterialForm(materialToEdit);
    } else {
        if (materialFormTitle) {
            materialFormTitle.textContent =
                "Add a New Material";
        }

        if (saveMaterialButton) {
            saveMaterialButton.textContent =
                "Save Material";
        }
    }

    materialForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    const nameField = getField("name");

    if (nameField) {
        nameField.focus({
            preventScroll: true
        });
    }
}


function closeMaterialForm() {
    if (!materialForm) {
        return;
    }

    materialForm.hidden = true;

    if (addMaterialButton) {
        addMaterialButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    resetMaterialForm();

    if (addMaterialButton) {
        addMaterialButton.focus();
    }
}


function resetMaterialForm() {
    if (materialForm) {
        materialForm.reset();
    }

    editingMaterialId = null;
    listValues = createEmptyListValues();

    if (manufacturingMethodError) {
        manufacturingMethodError.hidden = true;
    }

    Object.keys(listDefinitions).forEach(function (key) {
        renderList(key);
    });
}


function fillMaterialForm(material) {
    Object.keys(fieldMap).forEach(function (recordKey) {
        const field = getField(recordKey);

        if (field) {
            field.value =
                material[recordKey] ?? "";
        }
    });

    Object.keys(listDefinitions).forEach(function (key) {
        listValues[key] =
            Array.isArray(material[key])
                ? [...material[key]]
                : [];

        renderList(key);
    });
}


/* =========================================================
   FORM BUTTON EVENTS
   ========================================================= */

if (addMaterialButton) {
    addMaterialButton.addEventListener(
        "click",
        function () {
            openMaterialForm();
        }
    );
}


if (closeFormButton) {
    closeFormButton.addEventListener(
        "click",
        closeMaterialForm
    );
}


if (cancelButton) {
    cancelButton.addEventListener(
        "click",
        closeMaterialForm
    );
}


/* =========================================================
   MULTIPLE-SELECTION LISTS
   ========================================================= */

function addListValue(key, value) {
    if (typeof value !== "string") {
        return;
    }

    const cleanValue = value.trim();

    if (!cleanValue) {
        return;
    }

    const alreadyExists =
        listValues[key].some(function (existingValue) {
            return (
                existingValue.toLowerCase() ===
                cleanValue.toLowerCase()
            );
        });

    if (!alreadyExists) {
        listValues[key].push(cleanValue);
    }

    if (
        key === "manufacturingMethods" &&
        manufacturingMethodError
    ) {
        manufacturingMethodError.hidden = true;
    }

    renderList(key);
}


function removeListValue(key, valueToRemove) {
    listValues[key] =
        listValues[key].filter(function (value) {
            return value !== valueToRemove;
        });

    renderList(key);
}


function renderList(key) {
    const definition = listDefinitions[key];

    if (!definition) {
        return;
    }

    const container =
        document.getElementById(
            definition.containerId
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    listValues[key].forEach(function (value) {
        const tag = document.createElement("span");

        tag.className =
            key === "manufacturingMethods"
                ? "method-tag selected-method"
                : "selection-tag";

        const label = document.createElement("span");
        label.textContent = value;

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.className =
            "remove-method-button";
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


/* Connect every multiple-selection field */

Object.keys(listDefinitions).forEach(function (key) {
    const definition = listDefinitions[key];

    if (definition.selectId) {
        const select =
            document.getElementById(
                definition.selectId
            );

        if (select) {
            select.addEventListener(
                "change",
                function () {
                    addListValue(key, select.value);
                    select.value = "";
                }
            );
        }
    }

    if (definition.inputId) {
        const input =
            document.getElementById(
                definition.inputId
            );

        const button =
            document.getElementById(
                definition.buttonId
            );

        function addTextEntry() {
            if (!input) {
                return;
            }

            addListValue(key, input.value);
            input.value = "";
            input.focus();
        }

        if (button) {
            button.addEventListener(
                "click",
                addTextEntry
            );
        }

        if (input) {
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
    }
});


/* =========================================================
   BUILD AND SAVE MATERIAL RECORD
   ========================================================= */

function buildMaterialRecord() {
    const record = {};

    Object.keys(fieldMap).forEach(function (recordKey) {
        const field = getField(recordKey);

        record[recordKey] = field
            ? field.value.trim()
            : "";
    });

    Object.keys(listDefinitions).forEach(function (key) {
        record[key] = [...listValues[key]];
    });

    return record;
}


if (materialForm) {
    materialForm.addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            if (
                listValues.manufacturingMethods.length === 0
            ) {
                if (manufacturingMethodError) {
                    manufacturingMethodError.hidden = false;
                }

                const methodSelect =
                    document.getElementById(
                        "material-manufacturing-method"
                    );

                if (methodSelect) {
                    methodSelect.focus();
                }

                return;
            }

            if (manufacturingMethodError) {
                manufacturingMethodError.hidden = true;
            }

            const formRecord =
                buildMaterialRecord();

            const now =
                new Date().toISOString();

            if (editingMaterialId) {
                const materialIndex =
                    materials.findIndex(
                        function (material) {
                            return (
                                material.id ===
                                editingMaterialId
                            );
                        }
                    );

                if (materialIndex !== -1) {
                    materials[materialIndex] = {
                        ...materials[materialIndex],
                        ...formRecord,
                        dateUpdated: now
                    };
                }
            } else {
                materials.push({
                    id: createMaterialId(),
                    dateAdded: now,
                    dateUpdated: now,
                    ...formRecord
                });
            }

            saveMaterials();
            renderMaterials();
            updateDashboard();
            closeMaterialForm();
        }
    );
}


/* =========================================================
   SEARCH MATERIALS
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


/* =========================================================
   DISPLAY MATERIALS TABLE
   ========================================================= */

function renderMaterials() {
    if (!materialsTableBody) {
        return;
    }

    const searchText = materialSearchInput
        ? materialSearchInput.value
            .trim()
            .toLowerCase()
        : "";

    const filteredMaterials =
        materials
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
            materials.length === 0
                ? "No materials have been added yet."
                : "No materials match your search.";

        emptyRow.appendChild(emptyCell);
        materialsTableBody.appendChild(emptyRow);

        return;
    }

    filteredMaterials.forEach(function (material) {
        const row =
            document.createElement("tr");

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
    const cell =
        document.createElement("td");

    cell.textContent = value;

    return cell;
}


function createMaterialNameCell(material) {
    const cell =
        document.createElement("td");

    const link =
        document.createElement("a");

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
    const cell =
        document.createElement("td");

    if (!documentLink) {
        const emptyMessage =
            document.createElement("span");

        emptyMessage.className =
            "no-document";

        emptyMessage.textContent =
            "Not provided";

        cell.appendChild(emptyMessage);

        return cell;
    }

    const link =
        document.createElement("a");

    link.className = "document-link";
    link.href = documentLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open document";

    cell.appendChild(link);

    return cell;
}


/* =========================================================
   THREE-DOT ACTION MENU
   ========================================================= */

function createActionsCell(material) {
    const cell =
        document.createElement("td");

    cell.className = "actions-column";

    const menu =
        document.createElement("div");

    menu.className = "actions-menu";

    const menuButton =
        document.createElement("button");

    menuButton.type = "button";
    menuButton.className =
        "actions-menu-button";

    menuButton.textContent = "⋮";

    menuButton.setAttribute(
        "aria-label",
        "Actions for " +
        (material.name || "material")
    );

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    const dropdown =
        document.createElement("div");

    dropdown.className =
        "actions-dropdown";

    dropdown.hidden = true;


    /* Edit button */

    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.className =
        "edit-material-button";

    editButton.textContent = "Edit";

    editButton.addEventListener(
        "click",
        function () {
            closeAllActionMenus();
            openMaterialForm(material);
        }
    );


    /* Delete button */

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
        "delete-material-button";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
        "click",
        function () {
            closeAllActionMenus();
            deleteMaterial(material);
        }
    );


    /* Open and close menu */

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
        .querySelectorAll(".actions-dropdown")
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


/* =========================================================
   DELETE MATERIAL
   ========================================================= */

function deleteMaterial(material) {
    const materialName =
        material.name ||
        "this material";

    const confirmed =
        window.confirm(
            'Delete "' +
            materialName +
            '" from the database?'
        );

    if (!confirmed) {
        return;
    }

    materials =
        materials.filter(
            function (savedMaterial) {
                return (
                    savedMaterial.id !==
                    material.id
                );
            }
        );

    if (
        editingMaterialId === material.id
    ) {
        closeMaterialForm();
    }

    saveMaterials();
    renderMaterials();
    updateDashboard();
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(dateValue) {
    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
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


/* =========================================================
   SEARCH, CLICK, AND KEYBOARD EVENTS
   ========================================================= */

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
        if (event.key !== "Escape") {
            return;
        }

        if (
            materialForm &&
            !materialForm.hidden
        ) {
            closeMaterialForm();
        } else {
            closeAllActionMenus();
        }
    }
);


/* =========================================================
   DASHBOARD COUNTERS
   ========================================================= */

function updateDashboard() {
    if (materialCount) {
        materialCount.textContent =
            materials.length;
    }

    const categories =
        new Set(
            materials
                .map(function (material) {
                    return material.category;
                })
                .filter(Boolean)
        );

    if (categoryCount) {
        categoryCount.textContent =
            categories.size;
    }

    if (recordCount) {
        recordCount.textContent =
            materials.length;
    }
}


/* =========================================================
   START WEBSITE
   ========================================================= */

renderMaterials();
updateDashboard();