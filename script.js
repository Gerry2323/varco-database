/* =========================================================
   VARCO MATERIALS DATABASE
   Recent materials, Edit/Delete, dates, and document links
   ========================================================= */


/* =========================================================
   GET THE HTML ELEMENTS
   ========================================================= */

const addMaterialButton = document.getElementById(
    "add-material-button"
);

const materialForm = document.getElementById(
    "material-form"
);

const materialFormTitle = document.getElementById(
    "material-form-title"
);

const saveMaterialButton = document.getElementById(
    "save-material-button"
);

const closeFormButton = document.getElementById(
    "close-form-button"
);

const cancelButton = document.getElementById(
    "cancel-button"
);

const materialNameInput = document.getElementById(
    "material-name"
);

const materialCategoryInput = document.getElementById(
    "material-category"
);

const materialCompositionInput = document.getElementById(
    "material-composition"
);

const manufacturingMethodSelect = document.getElementById(
    "material-manufacturing-method"
);

const selectedMethodsContainer = document.getElementById(
    "selected-manufacturing-methods"
);

const manufacturingMethodError = document.getElementById(
    "manufacturing-method-error"
);

const materialMeltingPointInput = document.getElementById(
    "material-melting-point"
);

const materialSourceInput = document.getElementById(
    "material-source"
);

const materialDocumentLinkInput = document.getElementById(
    "material-document-link"
);

const materialsTableBody = document.getElementById(
    "materials-table-body"
);

const materialCount = document.getElementById(
    "material-count"
);

const categoryCount = document.getElementById(
    "category-count"
);

const recordCount = document.getElementById(
    "record-count"
);


/* =========================================================
   DATABASE VARIABLES
   ========================================================= */

/*
   Stores every material saved in the browser.
*/
let materials = loadMaterials();

/*
   Stores the manufacturing methods selected in the form.
*/
let selectedManufacturingMethods = [];

/*
   Stores the ID of the material currently being edited.

   A null value means the form is adding a new material.
*/
let editingMaterialId = null;


/* =========================================================
   LOAD SAVED MATERIALS
   ========================================================= */

function loadMaterials() {
    const savedMaterials = localStorage.getItem(
        "varcoMaterials"
    );

    if (!savedMaterials) {
        return [];
    }

    try {
        const parsedMaterials = JSON.parse(savedMaterials);

        if (!Array.isArray(parsedMaterials)) {
            return [];
        }

        /*
           Used to give older records a date if they were saved
           before the Date Added feature existed.
        */
        const migrationTime =
            Date.now() - parsedMaterials.length * 1000;

        return parsedMaterials.map(function (material, index) {
            let methods = [];

            /*
               Convert older single-method records into the
               newer multiple-method format.
            */
            if (Array.isArray(material.manufacturingMethods)) {
                methods = material.manufacturingMethods;
            } else if (material.manufacturingMethod) {
                methods = [material.manufacturingMethod];
            }

            /*
               Preserve an existing date. If an older material
               has no date, assign one based on its saved order.
            */
            const dateAdded =
                material.dateAdded ||
                material.createdAt ||
                new Date(
                    migrationTime + index * 1000
                ).toISOString();

            return {
                id: material.id || createMaterialId(),
                name: material.name || "",
                category: material.category || "",
                composition: material.composition || "",
                manufacturingMethods: methods,
                meltingPoint: material.meltingPoint || "",
                source: material.source || "",

                documentLink:
                    material.documentLink ||
                    material.documentURL ||
                    "",

                dateAdded: dateAdded
            };
        });
    } catch (error) {
        console.error(
            "The saved material data could not be loaded:",
            error
        );

        return [];
    }
}


/* =========================================================
   SAVE MATERIALS
   ========================================================= */

function saveMaterials() {
    localStorage.setItem(
        "varcoMaterials",
        JSON.stringify(materials)
    );
}


/* =========================================================
   CREATE A UNIQUE MATERIAL ID
   ========================================================= */

function createMaterialId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString() +
        "-" +
        Math.random().toString(16).slice(2)
    );
}


/* =========================================================
   OPEN AND CLOSE THE FORM
   ========================================================= */

/*
   Opens an empty form for adding a new material.
*/
function openAddMaterialForm() {
    resetMaterialForm();

    editingMaterialId = null;

    materialFormTitle.textContent =
        "Add a New Material";

    saveMaterialButton.textContent =
        "Save Material";

    materialForm.hidden = false;

    addMaterialButton.setAttribute(
        "aria-expanded",
        "true"
    );

    materialNameInput.focus();
}


/*
   Closes and resets the Add/Edit form.
*/
function closeMaterialForm() {
    materialForm.hidden = true;

    addMaterialButton.setAttribute(
        "aria-expanded",
        "false"
    );

    resetMaterialForm();
}


/*
   Open the form when Add Material is selected.
*/
addMaterialButton.addEventListener(
    "click",
    openAddMaterialForm
);


/*
   Close the form when the X button is selected.
*/
closeFormButton.addEventListener(
    "click",
    closeMaterialForm
);


/*
   Close the form when Cancel is selected.
*/
cancelButton.addEventListener(
    "click",
    closeMaterialForm
);


/* =========================================================
   MULTIPLE MANUFACTURING METHODS
   ========================================================= */

manufacturingMethodSelect.addEventListener(
    "change",
    function () {
        const selectedMethod =
            manufacturingMethodSelect.value.trim();

        if (selectedMethod === "") {
            return;
        }

        if (
            !selectedManufacturingMethods.includes(
                selectedMethod
            )
        ) {
            selectedManufacturingMethods.push(
                selectedMethod
            );
        }

        /*
           Return the dropdown to its blank option.
        */
        manufacturingMethodSelect.value = "";

        manufacturingMethodError.hidden = true;

        renderSelectedManufacturingMethods();
    }
);


/*
   Display every selected manufacturing method as a tag.
*/
function renderSelectedManufacturingMethods() {
    selectedMethodsContainer.replaceChildren();

    selectedManufacturingMethods.forEach(
        function (method) {
            const methodTag =
                document.createElement("span");

            methodTag.className = "method-tag";

            const methodName =
                document.createElement("span");

            methodName.textContent = method;

            const removeButton =
                document.createElement("button");

            removeButton.type = "button";
            removeButton.className =
                "remove-method-button";

            removeButton.textContent = "×";

            removeButton.setAttribute(
                "aria-label",
                "Remove manufacturing method " + method
            );

            removeButton.addEventListener(
                "click",
                function () {
                    removeManufacturingMethod(method);
                }
            );

            methodTag.append(
                methodName,
                removeButton
            );

            selectedMethodsContainer.appendChild(
                methodTag
            );
        }
    );
}


/*
   Remove one manufacturing method from the form.
*/
function removeManufacturingMethod(methodToRemove) {
    selectedManufacturingMethods =
        selectedManufacturingMethods.filter(
            function (method) {
                return method !== methodToRemove;
            }
        );

    renderSelectedManufacturingMethods();
}


/* =========================================================
   ADD OR UPDATE A MATERIAL
   ========================================================= */

materialForm.addEventListener(
    "submit",
    function (event) {
        /*
           Prevent the webpage from refreshing.
        */
        event.preventDefault();

        /*
           Require at least one manufacturing method.
        */
        if (
            selectedManufacturingMethods.length === 0
        ) {
            manufacturingMethodError.hidden = false;
            manufacturingMethodSelect.focus();

            return;
        }

        manufacturingMethodError.hidden = true;

        /*
           If an existing material is being edited, find it.
        */
        const existingMaterial = materials.find(
            function (material) {
                return material.id === editingMaterialId;
            }
        );

        /*
           Preserve the original Date Added while editing.
           Create a new date only for a new material.
        */
        const dateAdded = existingMaterial
            ? existingMaterial.dateAdded
            : new Date().toISOString();

        const materialRecord = {
            id:
                editingMaterialId ||
                createMaterialId(),

            name:
                materialNameInput.value.trim(),

            category:
                materialCategoryInput.value,

            composition:
                materialCompositionInput.value.trim(),

            manufacturingMethods: [
                ...selectedManufacturingMethods
            ],

            meltingPoint:
                materialMeltingPointInput.value.trim(),

            source:
                materialSourceInput.value.trim(),

            documentLink:
                materialDocumentLinkInput.value.trim(),

            dateAdded: dateAdded
        };

        /*
           Update an existing material or add a new one.
        */
        if (editingMaterialId) {
            const materialIndex = materials.findIndex(
                function (material) {
                    return (
                        material.id === editingMaterialId
                    );
                }
            );

            if (materialIndex !== -1) {
                materials[materialIndex] =
                    materialRecord;
            }
        } else {
            materials.push(materialRecord);
        }

        saveMaterials();
        renderMaterials();
        updateDashboard();
        closeMaterialForm();
    }
);


/* =========================================================
   EDIT A MATERIAL
   ========================================================= */

function editMaterial(materialId) {
    const materialToEdit = materials.find(
        function (material) {
            return material.id === materialId;
        }
    );

    if (!materialToEdit) {
        return;
    }

    closeAllActionMenus();

    editingMaterialId = materialToEdit.id;

    /*
       Place the material's current information into the form.
    */
    materialNameInput.value =
        materialToEdit.name;

    materialCategoryInput.value =
        materialToEdit.category;

    materialCompositionInput.value =
        materialToEdit.composition;

    selectedManufacturingMethods = [
        ...materialToEdit.manufacturingMethods
    ];

    materialMeltingPointInput.value =
        materialToEdit.meltingPoint;

    materialSourceInput.value =
        materialToEdit.source;

    materialDocumentLinkInput.value =
        materialToEdit.documentLink;

    manufacturingMethodError.hidden = true;

    renderSelectedManufacturingMethods();

    /*
       Change the form title and Save button for Edit mode.
    */
    materialFormTitle.textContent =
        "Edit Material";

    saveMaterialButton.textContent =
        "Update Material";

    materialForm.hidden = false;

    addMaterialButton.setAttribute(
        "aria-expanded",
        "true"
    );

    materialForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    materialNameInput.focus();
}


/* =========================================================
   DELETE A MATERIAL
   ========================================================= */

function deleteMaterial(materialId) {
    const materialToDelete = materials.find(
        function (material) {
            return material.id === materialId;
        }
    );

    if (!materialToDelete) {
        return;
    }

    closeAllActionMenus();

    /*
       Ask the user before permanently deleting the record.
    */
    const deleteConfirmed = window.confirm(
        'Are you sure you want to delete "' +
        materialToDelete.name +
        '"?\n\nThis action cannot be undone.'
    );

    if (!deleteConfirmed) {
        return;
    }

    materials = materials.filter(
        function (material) {
            return material.id !== materialId;
        }
    );

    /*
       Close the form if the deleted material was being edited.
    */
    if (editingMaterialId === materialId) {
        closeMaterialForm();
    }

    saveMaterials();
    renderMaterials();
    updateDashboard();
}


/* =========================================================
   RESET THE MATERIAL FORM
   ========================================================= */

function resetMaterialForm() {
    materialForm.reset();

    editingMaterialId = null;

    selectedManufacturingMethods = [];

    manufacturingMethodError.hidden = true;

    materialFormTitle.textContent =
        "Add a New Material";

    saveMaterialButton.textContent =
        "Save Material";

    renderSelectedManufacturingMethods();
}


/* =========================================================
   DISPLAY THE FIVE NEWEST MATERIALS
   ========================================================= */

function renderMaterials() {
    /*
       Create a copy of the array, sort it newest first,
       and display only the five newest materials.
    */
    const recentMaterials = [...materials]
        .sort(function (firstMaterial, secondMaterial) {
            return (
                getMaterialTime(secondMaterial) -
                getMaterialTime(firstMaterial)
            );
        })
        .slice(0, 5);

    materialsTableBody.replaceChildren();

    /*
       Display a message if the database is empty.
    */
    if (recentMaterials.length === 0) {
        const emptyRow =
            document.createElement("tr");

        emptyRow.className = "empty-row";

        const emptyCell =
            document.createElement("td");

        emptyCell.colSpan = 6;

        emptyCell.textContent =
            "No materials have been added yet.";

        emptyRow.appendChild(emptyCell);
        materialsTableBody.appendChild(emptyRow);

        return;
    }

    /*
       Create one table row for each recent material.
    */
    recentMaterials.forEach(
        function (material) {
            const row =
                document.createElement("tr");

            row.dataset.materialId = material.id;

            row.appendChild(
                createActionsCell(material)
            );

            row.appendChild(
                createMaterialNameCell(material)
            );

            row.appendChild(
                createTableCell(
                    material.category ||
                    "Not provided"
                )
            );

            row.appendChild(
                createTableCell(
                    formatDateAdded(
                        material.dateAdded
                    )
                )
            );

            row.appendChild(
                createTableCell(
                    material.source ||
                    "Not provided"
                )
            );

            row.appendChild(
                createDocumentLinkCell(material)
            );

            materialsTableBody.appendChild(row);
        }
    );
}


/*
   Convert Date Added into a sortable number.
*/
function getMaterialTime(material) {
    const parsedTime = new Date(
        material.dateAdded
    ).getTime();

    if (Number.isNaN(parsedTime)) {
        return 0;
    }

    return parsedTime;
}


/*
   Display the date in a readable format.
   Example: July 29, 2026
*/
function formatDateAdded(dateAdded) {
    const parsedDate = new Date(dateAdded);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Date unavailable";
    }

    return parsedDate.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


/*
   Create a normal text table cell safely.
*/
function createTableCell(value) {
    const cell = document.createElement("td");

    cell.textContent = value;

    return cell;
}


/* =========================================================
   THREE-DOT ACTION MENU
   ========================================================= */

function createActionsCell(material) {
    const cell = document.createElement("td");
    cell.className = "actions-column";

    const menuContainer =
        document.createElement("div");

    menuContainer.className = "actions-menu";

    /*
       Create the three-dot button.
    */
    const menuButton =
        document.createElement("button");

    menuButton.type = "button";
    menuButton.className =
        "actions-menu-button";

    menuButton.textContent = "⋮";

    menuButton.setAttribute(
        "aria-label",
        "Actions for " + material.name
    );

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    /*
       Create the Edit/Delete dropdown.
    */
    const dropdown =
        document.createElement("div");

    dropdown.className = "actions-dropdown";
    dropdown.hidden = true;

    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.className =
        "edit-material-button";

    editButton.textContent = "Edit";

    editButton.addEventListener(
        "click",
        function () {
            editMaterial(material.id);
        }
    );

    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className =
        "delete-material-button";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
        "click",
        function () {
            deleteMaterial(material.id);
        }
    );

    dropdown.append(
        editButton,
        deleteButton
    );

    menuButton.addEventListener(
        "click",
        function (event) {
            /*
               Stop the page click event from immediately
               closing the menu.
            */
            event.stopPropagation();

            const menuWasOpen =
                !dropdown.hidden;

            closeAllActionMenus();

            if (!menuWasOpen) {
                dropdown.hidden = false;

                menuButton.setAttribute(
                    "aria-expanded",
                    "true"
                );
            }
        }
    );

    /*
       Prevent clicks inside the menu from reaching the page.
    */
    dropdown.addEventListener(
        "click",
        function (event) {
            event.stopPropagation();
        }
    );

    menuContainer.append(
        menuButton,
        dropdown
    );

    cell.appendChild(menuContainer);

    return cell;
}


/*
   Close every open three-dot menu.
*/
function closeAllActionMenus() {
    const allDropdowns =
        document.querySelectorAll(
            ".actions-dropdown"
        );

    const allMenuButtons =
        document.querySelectorAll(
            ".actions-menu-button"
        );

    allDropdowns.forEach(function (dropdown) {
        dropdown.hidden = true;
    });

    allMenuButtons.forEach(function (button) {
        button.setAttribute(
            "aria-expanded",
            "false"
        );
    });
}


/*
   Close an action menu when clicking elsewhere.
*/
document.addEventListener(
    "click",
    closeAllActionMenus
);


/*
   Close an action menu with the Escape key.
*/
document.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Escape") {
            closeAllActionMenus();
        }
    }
);


/* =========================================================
   CLICKABLE MATERIAL NAME
   ========================================================= */

function createMaterialNameCell(material) {
    const cell = document.createElement("td");

    const materialLink =
        document.createElement("a");

    materialLink.className =
        "material-name-link";

    materialLink.textContent =
        material.name || "Unnamed material";

    /*
       This points to the future full-specifications page.

       For example:
       material-details.html?id=12345
    */
    materialLink.href =
        "material-details.html?id=" +
        encodeURIComponent(material.id);

    materialLink.setAttribute(
        "aria-label",
        "View full specifications for " +
        material.name
    );

    cell.appendChild(materialLink);

    return cell;
}


/* =========================================================
   DOCUMENT LINK
   ========================================================= */

function createDocumentLinkCell(material) {
    const cell = document.createElement("td");

    if (!material.documentLink) {
        const noDocument =
            document.createElement("span");

        noDocument.className = "no-document";
        noDocument.textContent = "Not provided";

        cell.appendChild(noDocument);

        return cell;
    }

    const documentLink =
        document.createElement("a");

    documentLink.className = "document-link";
    documentLink.href = material.documentLink;
    documentLink.textContent = "View Document";

    /*
       Open the supplier document in a new browser tab.
    */
    documentLink.target = "_blank";
    documentLink.rel = "noopener noreferrer";

    documentLink.setAttribute(
        "aria-label",
        "Open document for " + material.name
    );

    cell.appendChild(documentLink);

    return cell;
}


/* =========================================================
   UPDATE THE DASHBOARD
   ========================================================= */

function updateDashboard() {
    /*
       These totals use all saved materials, even though
       the homepage table displays only the five newest.
    */
    materialCount.textContent = materials.length;

    const categories = new Set(
        materials
            .map(function (material) {
                return material.category;
            })
            .filter(Boolean)
    );

    categoryCount.textContent = categories.size;

    recordCount.textContent = materials.length;
}


/* =========================================================
   START THE WEBSITE
   ========================================================= */

/*
   Save once during startup so older records receive their
   migrated date and updated data structure.
*/
saveMaterials();

/*
   Display the five newest materials.
*/
renderMaterials();

/*
   Display totals for the entire database.
*/
updateDashboard();