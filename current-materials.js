"use strict";

/* =========================================================
   DATABASE SETTINGS

   These names must match the IndexedDB database used by the
   CSV Files page. Spreadsheet records are loaded from here.
   ========================================================= */

const DB_NAME = "varcoFileDatabase";
const STORE_NAME = "files";


/* =========================================================
   SPREADSHEET COLUMN ALIASES

   Spreadsheet columns may use different headings. These
   aliases help the database recognize equivalent headings.
   ========================================================= */

const aliases = {
    name: [
        "Material Name",
        "Name",
        "Material",
        "Powder Name",
        "Material Designation",
        "Feedstock Name",
        "Product or Material Name"
    ],

    category: [
        "Category",
        "Classification",
        "Class"
    ],

    composition: [
        "Composition as Reported",
        "Composition",
        "Chemical Composition"
    ],

    feedstockForm: [
        "Feedstock Form",
        "Form",
        "Feedstock"
    ],

    manufacturingMethods: [
        "Manufacturing Methods",
        "Manufacturing Method"
    ],

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

    supplier: [
        "Supplier",
        "Manufacturer"
    ],

    productName: [
        "Product Name"
    ],

    sprayProcesses: [
        "Recommended Spray Processes",
        "Recommended Spray Process"
    ],

    dataQualityStatus: [
        "Data Quality Status",
        "Verification Status",
        "Quality Status"
    ],

    sourceTitle: [
        "Source Title",
        "Reference",
        "Citation",
        "Article Title"
    ],

    sourceFilename: [
        "Source Filename",
        "Reference Filename",
        "CSV File"
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
   CATALOG STATE

   This object stores:
   - All loaded materials
   - Filtered materials
   - Current page
   - Rows per page
   - Current sorting settings
   ========================================================= */

const state = {
    materials: [],
    filtered: [],
    page: 1,
    pageSize: 25,
    sortKey: "name",
    sortDirection: 1
};


/* =========================================================
   PAGE ELEMENTS

   These IDs must match the IDs inside current-materials.html.
   ========================================================= */

const elements = {
    body: document.getElementById("catalog-table-body"),

    search: document.getElementById("catalog-search"),
    category: document.getElementById("catalog-category-filter"),
    form: document.getElementById("catalog-form-filter"),
    method: document.getElementById("catalog-method-filter"),
    supplier: document.getElementById("catalog-supplier-filter"),
    process: document.getElementById("catalog-process-filter"),
    quality: document.getElementById("catalog-quality-filter"),
    origin: document.getElementById("catalog-origin-filter"),

    resultCount: document.getElementById("catalog-result-count"),
    totalCount: document.getElementById("catalog-total-count"),
    categoryCount: document.getElementById("catalog-category-count"),
    supplierCount: document.getElementById("catalog-supplier-count"),
    verifiedCount: document.getElementById("catalog-verified-count"),

    status: document.getElementById("catalog-page-status"),
    pageNumber: document.getElementById("catalog-page-number"),
    previous: document.getElementById("catalog-previous-page"),
    next: document.getElementById("catalog-next-page"),
    pageSize: document.getElementById("catalog-page-size"),

    clear: document.getElementById("clear-material-filters")
};


/* =========================================================
   SMALL DATA HELPERS

   These functions clean values, normalize spreadsheet
   headings, and convert stored text into lists.
   ========================================================= */

/*
   Removes extra spaces and treats "Not reported" as an
   empty value while the data is being processed.
*/
function clean(value) {
    const text = String(value ?? "").trim();

    if (!text || text.toLowerCase() === "not reported") {
        return "";
    }

    return text;
}


/*
   Converts a heading into a simple comparison key.

   Example:
   "Material Name" becomes "materialname".
*/
function key(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}


/*
   Converts a stored value into an array.

   It supports:
   - Existing arrays
   - Semicolon-separated text
   - Vertical-bar-separated text
*/
function list(value) {
    if (Array.isArray(value)) {
        return value
            .map(clean)
            .filter(Boolean);
    }

    return clean(value)
        .split(/[;|]/)
        .map(clean)
        .filter(Boolean);
}


/* =========================================================
   LOAD MANUALLY ADDED MATERIALS

   Manual materials are stored in localStorage under the key
   "varcoMaterials".

   Older records may not have an ID. A fallback ID is added
   so every record can open the Material Details page.

   material-details.js must use the same fallback ID pattern.
   ========================================================= */

function manualMaterials() {
    try {
        const storedMaterials =
            localStorage.getItem("varcoMaterials");

        const parsed =
            JSON.parse(storedMaterials || "[]");

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((material, index) => ({
            ...material,

            // Preserve an existing ID or make one for an old record.
            id: material.id || `manual:${index}`,

            // Identifies this record as a manual entry.
            origin: "manual"
        }));
    } catch (error) {
        console.error(
            "Manual materials could not be read:",
            error
        );

        return [];
    }
}


/* =========================================================
   READ A VALUE FROM A SPREADSHEET ROW

   Finds the spreadsheet column that matches one of the
   accepted aliases and returns the value from that column.
   ========================================================= */

function valueFromRow(headers, row, field) {
    const acceptedHeadings =
        (aliases[field] || []).map(key);

    const columnIndex = headers.findIndex((header) =>
        acceptedHeadings.includes(key(header))
    );

    if (columnIndex < 0) {
        return "";
    }

    return clean(row[columnIndex]);
}


/* =========================================================
   LOAD SPREADSHEET MATERIALS FROM INDEXEDDB

   Each spreadsheet row receives a unique ID in this format:

   csv:file-id:row-number

   That ID will later allow material-details.js to locate the
   correct spreadsheet record.
   ========================================================= */

function spreadsheetMaterials() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);

        /*
           Create the file store if the database does not
           already contain it.
        */
        request.onupgradeneeded = () => {
            const database = request.result;

            if (
                !database.objectStoreNames.contains(STORE_NAME)
            ) {
                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );
            }
        };


        /*
           If IndexedDB cannot be opened, continue with only
           manual materials.
        */
        request.onerror = () => {
            console.error(
                "Spreadsheet database could not be opened."
            );

            resolve([]);
        };


        request.onsuccess = () => {
            const database = request.result;

            const transaction = database.transaction(
                STORE_NAME,
                "readonly"
            );

            const fileStore =
                transaction.objectStore(STORE_NAME);

            const getAllRequest = fileStore.getAll();


            getAllRequest.onerror = () => {
                console.error(
                    "Spreadsheet files could not be read."
                );

                database.close();
                resolve([]);
            };


            getAllRequest.onsuccess = () => {
                const records = [];

                getAllRequest.result.forEach((file) => {
                    const rows =
                        Array.isArray(file.rows)
                            ? file.rows
                            : [];

                    /*
                       The first row contains column headings.
                       At least one data row must also exist.
                    */
                    if (rows.length < 2) {
                        return;
                    }

                    const headers = rows[0];
                    const dataRows = rows.slice(1);


                    dataRows.forEach((row, index) => {
                        const name = valueFromRow(
                            headers,
                            row,
                            "name"
                        );

                        /*
                           Do not import a row when no material
                           name can be found.
                        */
                        if (!name) {
                            return;
                        }

                        const record = {
                            id: `csv:${file.id}:${index + 1}`,
                            name: name,
                            origin: "csv",
                            dateAdded: file.dateAdded
                        };


                        /*
                           Read the remaining supported fields.
                        */
                        Object.keys(aliases).forEach((field) => {
                            if (field !== "name") {
                                record[field] = valueFromRow(
                                    headers,
                                    row,
                                    field
                                );
                            }
                        });


                        /*
                           Convert fields that can contain more
                           than one value into arrays.
                        */
                        record.manufacturingMethods = list(
                            record.manufacturingMethods
                        );

                        record.sprayProcesses = list(
                            record.sprayProcesses
                        );


                        /*
                           Use the uploaded filename as the source
                           when the row does not provide one.
                        */
                        if (!record.sourceTitle) {
                            record.sourceTitle = file.name;
                        }

                        if (!record.sourceFilename) {
                            record.sourceFilename = file.name;
                        }

                        records.push(record);
                    });
                });

                database.close();
                resolve(records);
            };
        };
    });
}


/* =========================================================
   FILTER OPTION HELPERS

   These functions build the dropdown options using values
   found in the currently loaded materials.
   ========================================================= */

/*
   Returns unique values for a material field.
*/
function unique(field, isList = false) {
    const values = state.materials.flatMap((material) => {
        if (isList) {
            return list(material[field]);
        }

        return [clean(material[field])];
    });

    return [...new Set(values.filter(Boolean))]
        .sort((first, second) =>
            first.localeCompare(second)
        );
}


/*
   Adds options to a filter dropdown.
*/
function fillSelect(select, values) {
    values.forEach((value) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = value;

        select.appendChild(option);
    });
}


/*
   Checks whether a list contains the selected filter value.
*/
function includesList(value, selected) {
    if (!selected) {
        return true;
    }

    return list(value).some((item) =>
        item === selected
    );
}


/* =========================================================
   SEARCH, FILTER, AND SORT MATERIALS
   ========================================================= */

/*
   Combines all material fields into one searchable line.
*/
function searchableText(material) {
    return Object.values(material)
        .flatMap((value) =>
            Array.isArray(value)
                ? value
                : [value]
        )
        .join(" ")
        .toLowerCase();
}


/*
   Applies all active filters, sorts the results, and then
   refreshes the table.
*/
function applyFilters() {
    const query =
        elements.search.value.trim().toLowerCase();

    state.filtered = state.materials.filter((material) => {
        const matchesSearch =
            !query ||
            searchableText(material).includes(query);

        const matchesCategory =
            !elements.category.value ||
            clean(material.category) ===
                elements.category.value;

        const matchesForm =
            !elements.form.value ||
            clean(material.feedstockForm) ===
                elements.form.value;

        const matchesMethod =
            includesList(
                material.manufacturingMethods,
                elements.method.value
            );

        const matchesSupplier =
            !elements.supplier.value ||
            clean(material.supplier) ===
                elements.supplier.value;

        const matchesProcess =
            includesList(
                material.sprayProcesses,
                elements.process.value
            );

        const matchesQuality =
            !elements.quality.value ||
            clean(material.dataQualityStatus) ===
                elements.quality.value;

        const matchesOrigin =
            !elements.origin.value ||
            material.origin === elements.origin.value;

        return (
            matchesSearch &&
            matchesCategory &&
            matchesForm &&
            matchesMethod &&
            matchesSupplier &&
            matchesProcess &&
            matchesQuality &&
            matchesOrigin
        );
    });


    /*
       Sort the filtered records using the selected table
       heading and sort direction.
    */
    state.filtered.sort((first, second) => {
        const firstValue = clean(
            first[state.sortKey]
        );

        const secondValue = clean(
            second[state.sortKey]
        );

        return (
            firstValue.localeCompare(secondValue) *
            state.sortDirection
        );
    });


    /*
       Prevent the page number from going beyond the number
       of available pages.
    */
    const totalPages = Math.max(
        1,
        Math.ceil(
            state.filtered.length / state.pageSize
        )
    );

    state.page = Math.min(
        state.page,
        totalPages
    );

    render();
}


/* =========================================================
   TABLE DISPLAY HELPERS
   ========================================================= */

/*
   Formats the material's particle-size information.
*/
function particleSize(material) {
    const minimum =
        clean(material.particleSizeMin);

    const maximum =
        clean(material.particleSizeMax);

    const average =
        clean(material.particleSizeAverage);

    if (minimum && maximum) {
        return `${minimum}–${maximum} µm`;
    }

    if (average) {
        return `${average} µm avg.`;
    }

    return "Not reported";
}


/*
   Creates a regular table cell.
*/
function textCell(text, className = "") {
    const cell = document.createElement("td");

    cell.textContent =
        clean(text) || "Not reported";

    if (className) {
        cell.className = className;
    }

    return cell;
}


/* =========================================================
   CLICKABLE MATERIAL NAME

   Creates the first table cell and links the material to the
   reusable Material Details page.

   Example URL:
   material-details.html?id=manual%3A0
   ========================================================= */

function materialNameCell(material) {
    const cell = document.createElement("td");

    cell.className = "catalog-material-name";


    const link = document.createElement("a");

    link.className = "material-details-link";

    link.href =
        "material-details.html?id=" +
        encodeURIComponent(material.id);

    link.textContent =
        clean(material.name) ||
        "Unnamed Material";


    cell.appendChild(link);

    return cell;
}


/* =========================================================
   SOURCE TABLE CELL

   If a valid source URL exists, the source becomes clickable.
   Otherwise, the source title or filename is displayed.
   ========================================================= */

function sourceCell(material) {
    const cell = document.createElement("td");

    const label =
        clean(material.sourceTitle) ||
        clean(material.sourceFilename) ||
        "Not reported";

    const url =
        clean(material.documentLink);


    if (/^https?:\/\//i.test(url)) {
        const link = document.createElement("a");

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = label;

        cell.appendChild(link);
    } else {
        cell.textContent = label;
    }

    return cell;
}


/* =========================================================
   RENDER THE CURRENT TABLE PAGE

   Displays only the materials that belong on the current
   page after searching, filtering, and sorting.
   ========================================================= */

function render() {
    const totalPages = Math.max(
        1,
        Math.ceil(
            state.filtered.length / state.pageSize
        )
    );

    const start =
        (state.page - 1) * state.pageSize;

    const visibleMaterials =
        state.filtered.slice(
            start,
            start + state.pageSize
        );


    /*
       Remove the old table rows before drawing the new ones.
    */
    elements.body.replaceChildren();


    /*
       Display a message when there are no matching records.
    */
    if (!visibleMaterials.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        row.className = "empty-row";
        cell.colSpan = 10;

        if (state.materials.length) {
            cell.textContent =
                "No materials match these filters.";
        } else {
            cell.textContent =
                "No materials have been added or imported yet.";
        }

        row.appendChild(cell);
        elements.body.appendChild(row);
    } else {
        /*
           Create one table row for each visible material.
        */
        visibleMaterials.forEach((material) => {
            const row = document.createElement("tr");

            row.append(
                // Clickable material name
                materialNameCell(material),

                // Category
                textCell(material.category),

                // Composition
                textCell(material.composition),

                // Feedstock form
                textCell(material.feedstockForm),

                // Particle size
                textCell(particleSize(material)),

                // Supplier
                textCell(material.supplier),

                // Recommended spray processes
                textCell(
                    list(material.sprayProcesses).join(", ")
                ),

                // Data quality
                textCell(material.dataQualityStatus),

                // Record origin
                textCell(
                    material.origin === "csv"
                        ? "Spreadsheet Import"
                        : "Manual Entry"
                ),

                // Source
                sourceCell(material)
            );

            elements.body.appendChild(row);
        });
    }


    /*
       Update the table result information.
    */
    elements.resultCount.textContent =
        state.filtered.length;

    if (state.filtered.length) {
        const endingRecord = Math.min(
            start + visibleMaterials.length,
            state.filtered.length
        );

        elements.status.textContent =
            `Showing ${start + 1}–${endingRecord} ` +
            `of ${state.filtered.length}`;
    } else {
        elements.status.textContent =
            "Showing 0 materials";
    }


    /*
       Update pagination controls.
    */
    elements.pageNumber.textContent =
        `Page ${state.page} of ${totalPages}`;

    elements.previous.disabled =
        state.page <= 1;

    elements.next.disabled =
        state.page >= totalPages;
}


/* =========================================================
   UPDATE THE FOUR SUMMARY CARDS
   ========================================================= */

function updateSummary() {
    /*
       Total number of manual and spreadsheet materials.
    */
    elements.totalCount.textContent =
        state.materials.length;


    /*
       Number of unique categories.
    */
    elements.categoryCount.textContent =
        unique("category").length;


    /*
       Number of unique suppliers.
    */
    elements.supplierCount.textContent =
        unique("supplier").length;


    /*
       Number of records marked as verified or directly
       reported.
    */
    const verifiedMaterials =
        state.materials.filter((material) =>
            /verified|directly reported/i.test(
                clean(material.dataQualityStatus)
            )
        );

    elements.verifiedCount.textContent =
        verifiedMaterials.length;
}


/* =========================================================
   INITIAL PAGE LOAD

   Combines:
   - Manual records from localStorage
   - Spreadsheet records from IndexedDB

   It then creates the dropdown options and displays the
   materials table.
   ========================================================= */

async function initialize() {
    const manualRecords =
        manualMaterials();

    const spreadsheetRecords =
        await spreadsheetMaterials();


    /*
       Combine both record sources into one catalog.
    */
    state.materials = [
        ...manualRecords,
        ...spreadsheetRecords
    ];


    /*
       Create the filter dropdown options.
    */
    fillSelect(
        elements.category,
        unique("category")
    );

    fillSelect(
        elements.form,
        unique("feedstockForm")
    );

    fillSelect(
        elements.method,
        unique("manufacturingMethods", true)
    );

    fillSelect(
        elements.supplier,
        unique("supplier")
    );

    fillSelect(
        elements.process,
        unique("sprayProcesses", true)
    );

    fillSelect(
        elements.quality,
        unique("dataQualityStatus")
    );


    /*
       Update the cards and display the table.
    */
    updateSummary();
    applyFilters();
}


/* =========================================================
   SEARCH AND FILTER EVENTS

   Search updates while typing. Dropdown filters update after
   a new option is selected.
   ========================================================= */

const filterControls = [
    elements.search,
    elements.category,
    elements.form,
    elements.method,
    elements.supplier,
    elements.process,
    elements.quality,
    elements.origin
];


filterControls.forEach((control) => {
    const eventName =
        control === elements.search
            ? "input"
            : "change";

    control.addEventListener(eventName, () => {
        state.page = 1;
        applyFilters();
    });
});


/* =========================================================
   ROWS-PER-PAGE EVENT
   ========================================================= */

elements.pageSize.addEventListener("change", () => {
    state.pageSize =
        Number(elements.pageSize.value);

    state.page = 1;

    applyFilters();
});


/* =========================================================
   PREVIOUS PAGE EVENT
   ========================================================= */

elements.previous.addEventListener("click", () => {
    if (state.page > 1) {
        state.page -= 1;
        render();
    }
});


/* =========================================================
   NEXT PAGE EVENT
   ========================================================= */

elements.next.addEventListener("click", () => {
    const moreMaterialsExist =
        state.page * state.pageSize <
        state.filtered.length;

    if (moreMaterialsExist) {
        state.page += 1;
        render();
    }
});


/* =========================================================
   CLEAR ALL FILTERS EVENT
   ========================================================= */

elements.clear.addEventListener("click", () => {
    /*
       Clear the search field.
    */
    elements.search.value = "";


    /*
       Return every dropdown to its first option.
    */
    const dropdowns = [
        elements.category,
        elements.form,
        elements.method,
        elements.supplier,
        elements.process,
        elements.quality,
        elements.origin
    ];

    dropdowns.forEach((select) => {
        select.value = "";
    });


    /*
       Return to the first page and redraw the table.
    */
    state.page = 1;
    applyFilters();
});


/* =========================================================
   TABLE SORTING EVENTS

   Clicking the same heading again reverses the sorting
   direction.
   ========================================================= */

document
    .querySelectorAll(".sort-button")
    .forEach((button) => {
        button.addEventListener("click", () => {
            const selectedSortKey =
                button.dataset.sort;

            /*
               Reverse direction when the same heading is
               clicked again.
            */
            if (state.sortKey === selectedSortKey) {
                state.sortDirection *= -1;
            } else {
                state.sortKey = selectedSortKey;
                state.sortDirection = 1;
            }

            applyFilters();
        });
    });


/* =========================================================
   START THE CURRENT MATERIALS PAGE
   ========================================================= */

initialize();