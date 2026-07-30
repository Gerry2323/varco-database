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
const spreadsheetContainer = document.getElementById(
    "spreadsheet-container"
);
const editFileButton = document.getElementById("edit-file-button");
const downloadFileButton = document.getElementById(
    "download-file-button"
);
const closeViewerButton = document.getElementById(
    "close-viewer-button"
);
const editorButtons = document.getElementById("editor-buttons");
const editHelp = document.getElementById("edit-help");
const cancelEditButton = document.getElementById(
    "cancel-edit-button"
);
const addRowButton = document.getElementById("add-row-button");
const addColumnButton = document.getElementById(
    "add-column-button"
);
const saveFileButton = document.getElementById("save-file-button");

let savedFiles = [];
let activeFile = null;
let workingRows = [];
let editing = false;

/*
    Standard columns used by the VARCO materials database.
*/
const MATERIAL_CSV_COLUMNS = [
    "Material Name",
    "Category",
    "Feedstock Form",
    "Composition",
    "Composition Basis",
    "Manufacturing Methods",
    "Morphologies",
    "Particle Size Min (µm)",
    "Particle Size Max (µm)",
    "Particle Size Average (µm)",
    "Particle Size Method",
    "Powder Flowability",
    "Apparent Density (g/cm³)",
    "Purity (%)",
    "Supplier",
    "Product Name",
    "Product Number",
    "Density (g/cm³)",
    "Porosity (%)",
    "Hardness Value",
    "Hardness Scale and Load",
    "Young's Modulus (GPa)",
    "Poisson's Ratio",
    "Tensile Strength (MPa)",
    "Fracture Toughness (MPa·m^0.5)",
    "Melting Point (°C)",
    "Maximum Service Temperature (°C)",
    "Thermal Conductivity (W/m·K)",
    "Thermal Expansion (µm/m·K)",
    "Electrical Property",
    "Corrosion Resistance",
    "Oxidation Resistance",
    "Recommended Spray Processes",
    "Wear Mechanisms",
    "Intended Applications",
    "Reported Advantages",
    "Reported Limitations",
    "Source Type",
    "Source Title",
    "Source Author or Organization",
    "Publication Year",
    "Source Filename",
    "Source Page",
    "Table or Figure Number",
    "DOI or URL",
    "Document Link",
    "Test Standards",
    "Data Quality Status",
    "Notes"
];

/*
    Make spreadsheet headers easier to compare.

    For example:
    material_name
    Material Name
    MATERIAL-NAME

    All become the same comparable value.
*/
function normalizedHeader(value) {
    return String(value ?? "")
        .toLowerCase()
        .replace(
            /[₂³µμ°'’".,()/%·^_-]/g,
            ""
        )
        .replace(/\s+/g, "");
}

/*
    Alternative names that may appear in uploaded spreadsheets.
*/
const COLUMN_ALIASES = {
    "Material Name": [
        "material_name",
        "name",
        "material",
        "powder name",
        "material or powder",
        "material name / designation",
        "material designation",
        "material/feedstock name",
        "feedstock material",
        "material system",
        "material / powder name",
        "material/powder name",
        "material or powder name",
        "coating material",
        "coating material name",
        "material / coating system",
        "material/coating system",
        "powder designation",
        "feedstock name",
        "alloy name",
        "ceramic name",
        "product or material name"
    ],

    "Category": [
        "classification",
        "material category",
        "class"
    ],

    "Feedstock Form": [
        "feedstock_form",
        "form",
        "material form",
        "feedstock"
    ],

    "Composition": [
        "composition_as_reported",
        "chemical composition",
        "composition as reported"
    ],

    "Composition Basis": [
        "composition_basis",
        "basis",
        "composition unit"
    ],

    "Manufacturing Methods": [
        "manufacturing_method",
        "manufacturing method",
        "powder manufacturing method"
    ],

    "Morphologies": [
        "morphology",
        "particle morphology",
        "powder morphology"
    ],

    "Particle Size Min (µm)": [
        "particle size min",
        "minimum particle size",
        "size min"
    ],

    "Particle Size Max (µm)": [
        "particle size max",
        "maximum particle size",
        "size max"
    ],

    "Particle Size Average (µm)": [
        "particle size average",
        "average particle size",
        "d50"
    ],

    "Powder Flowability": [
        "powder_flowability",
        "flowability"
    ],

    "Apparent Density (g/cm³)": [
        "apparent_density",
        "apparent density"
    ],

    "Purity (%)": [
        "purity_percent",
        "purity"
    ],

    "Supplier": [
        "manufacturer"
    ],

    "Product Name": [
        "product_name"
    ],

    "Product Number": [
        "product_number",
        "product id"
    ],

    "Density (g/cm³)": [
        "density",
        "material density"
    ],

    "Porosity (%)": [
        "porosity_percent",
        "porosity"
    ],

    "Hardness Value": [
        "hardness_value",
        "hardness"
    ],

    "Hardness Scale and Load": [
        "hardness_scale_load"
    ],

    "Young's Modulus (GPa)": [
        "youngs modulus",
        "elastic modulus",
        "young modulus"
    ],

    "Melting Point (°C)": [
        "melting point",
        "melt point",
        "solidus liquidus"
    ],

    "Maximum Service Temperature (°C)": [
        "max_service_temp_c",
        "maximum service temperature",
        "maximum service temperature c",
        "max service temperature c"
    ],

    "Recommended Spray Processes": [
        "recommended_processes",
        "recommended spray process",
        "spray processes"
    ],

    "Wear Mechanisms": [
        "wear_mechanism",
        "wear mechanism"
    ],

    "Intended Applications": [
        "applications_and_reported_characteristics",
        "applications",
        "application"
    ],

    "Reported Advantages": [
        "applications_and_reported_characteristics",
        "reported characteristics"
    ],

    "Source Type": [
        "reference type"
    ],

    "Source Title": [
        "source_article",
        "reference",
        "reference title",
        "citation",
        "article title"
    ],

    "Source Author or Organization": [
        "source author",
        "author",
        "organization"
    ],

    "Source Filename": [
        "source_file",
        "reference file",
        "reference filename",
        "csv file"
    ],

    "Source Page": [
        "source_page"
    ],

    "Table or Figure Number": [
        "source_table",
        "table number",
        "figure number"
    ],

    "DOI or URL": [
        "source_url",
        "doi",
        "url"
    ],

    "Document Link": [
        "source_url",
        "source link",
        "url",
        "reference link"
    ],

    "Test Standards": [
        "standard_or_reference",
        "test standard"
    ],

    "Data Quality Status": [
        "data_quality_status",
        "verification status",
        "quality status"
    ],

    "Notes": [
        "data_quality_note",
        "quality note"
    ]
};

/*
    Find the spreadsheet column that matches a database column.
*/
function findSourceColumn(
    headers,
    canonicalColumn
) {
    const accepted = [
        canonicalColumn,
        ...(COLUMN_ALIASES[canonicalColumn] || [])
    ].map(normalizedHeader);

    const exactIndex =
        headers.findIndex(function (header) {
            return accepted.includes(
                normalizedHeader(header)
            );
        });

    if (
        exactIndex >= 0 ||
        canonicalColumn !== "Material Name"
    ) {
        return exactIndex;
    }

    /*
        Fallback for unusual material-name headers.
    */
    return headers.findIndex(
        function (header) {
            const normalized =
                normalizedHeader(header);

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

            return (
                includesName &&
                includesMaterialKind
            );
        }
    );
}

/*
    Convert a material worksheet into the standard VARCO format.
*/
function normalizeMaterialRows(
    rows,
    filename
) {
    /*
        Locate the actual header row. This allows the spreadsheet
        to contain titles or blank rows above the table.
    */
    const headerSearchLimit =
        Math.min(rows.length, 50);

    let headerRowIndex = -1;
    let bestHeaderScore = -1;

    for (
        let rowIndex = 0;
        rowIndex < headerSearchLimit;
        rowIndex += 1
    ) {
        const candidateHeaders =
            rows[rowIndex].map(
                function (value) {
                    return String(value).trim();
                }
            );

        const hasMaterialName =
            findSourceColumn(
                candidateHeaders,
                "Material Name"
            ) >= 0;

        if (!hasMaterialName) {
            continue;
        }

        const score =
            MATERIAL_CSV_COLUMNS.reduce(
                function (
                    total,
                    column
                ) {
                    return (
                        total +
                        (
                            findSourceColumn(
                                candidateHeaders,
                                column
                            ) >= 0
                                ? 1
                                : 0
                        )
                    );
                },
                0
            );

        if (score > bestHeaderScore) {
            bestHeaderScore = score;
            headerRowIndex = rowIndex;
        }
    }

    if (headerRowIndex < 0) {
        throw new Error(
            filename +
            " does not contain a recognizable Material Name column."
        );
    }

    const originalHeaders =
        rows[headerRowIndex].map(
            function (header) {
                return String(header).trim();
            }
        );

    const usedIndexes = new Set();

    const canonicalIndexes =
        MATERIAL_CSV_COLUMNS.map(
            function (column) {
                const index =
                    findSourceColumn(
                        originalHeaders,
                        column
                    );

                if (index >= 0) {
                    usedIndexes.add(index);
                }

                return index;
            }
        );

    /*
        Preserve columns that are not part of the normal form.
    */
    const extraIndexes =
        originalHeaders
            .map(function (_, index) {
                return index;
            })
            .filter(function (index) {
                return (
                    !usedIndexes.has(index) &&
                    originalHeaders[index]
                );
            });

    const outputHeaders = [
        ...MATERIAL_CSV_COLUMNS,

        ...extraIndexes.map(
            function (index) {
                return originalHeaders[index];
            }
        )
    ];

    const materialNameIndex =
        canonicalIndexes[0];

    const outputRows =
        rows
            .slice(headerRowIndex + 1)
            .filter(function (row) {
                const materialName =
                    String(
                        row[materialNameIndex] ?? ""
                    ).trim();

                return (
                    materialName &&
                    normalizedHeader(materialName) !==
                    normalizedHeader(
                        originalHeaders[
                            materialNameIndex
                        ]
                    )
                );
            })
            .map(function (row) {
                const standardized =
                    MATERIAL_CSV_COLUMNS.map(
                        function (
                            column,
                            columnIndex
                        ) {
                            const sourceIndex =
                                canonicalIndexes[
                                    columnIndex
                                ];

                            const value =
                                sourceIndex >= 0
                                    ? String(
                                          row[
                                              sourceIndex
                                          ] ?? ""
                                      ).trim()
                                    : "";

                            if (value) {
                                return value;
                            }

                            if (
                                column ===
                                "Source Type"
                            ) {
                                return "Other";
                            }

                            if (
                                column ===
                                    "Source Title" ||
                                column ===
                                    "Source Filename"
                            ) {
                                return filename;
                            }

                            return "Not Reported";
                        }
                    );

                const extraValues =
                    extraIndexes.map(
                        function (index) {
                            return (
                                String(
                                    row[index] ?? ""
                                ).trim() ||
                                "Not Reported"
                            );
                        }
                    );

                return [
                    ...standardized,
                    ...extraValues
                ];
            });

    if (!outputRows.length) {
        throw new Error(
            filename +
            " does not contain any material data rows."
        );
    }

    return [
        outputHeaders,
        ...outputRows
    ];
}

/*
    IndexedDB functions.
*/
function openDatabase() {
    return new Promise(
        function (resolve, reject) {
            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );

            request.onupgradeneeded =
                function () {
                    const database =
                        request.result;

                    if (
                        !database
                            .objectStoreNames
                            .contains(STORE_NAME)
                    ) {
                        database.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );
                    }
                };

            request.onsuccess =
                function () {
                    resolve(request.result);
                };

            request.onerror =
                function () {
                    reject(request.error);
                };
        }
    );
}

async function readAllFiles() {
    const database =
        await openDatabase();

    return new Promise(
        function (resolve, reject) {
            const transaction =
                database.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const request =
                transaction
                    .objectStore(
                        STORE_NAME
                    )
                    .getAll();

            request.onsuccess =
                function () {
                    resolve(request.result);
                };

            request.onerror =
                function () {
                    reject(request.error);
                };

            transaction.oncomplete =
                function () {
                    database.close();
                };
        }
    );
}

async function putFile(fileRecord) {
    const database =
        await openDatabase();

    return new Promise(
        function (resolve, reject) {
            const transaction =
                database.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            transaction
                .objectStore(STORE_NAME)
                .put(fileRecord);

            transaction.oncomplete =
                function () {
                    database.close();
                    resolve();
                };

            transaction.onerror =
                function () {
                    reject(transaction.error);
                };
        }
    );
}

async function removeFile(id) {
    const database =
        await openDatabase();

    return new Promise(
        function (resolve, reject) {
            const transaction =
                database.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            transaction
                .objectStore(STORE_NAME)
                .delete(id);

            transaction.oncomplete =
                function () {
                    database.close();
                    resolve();
                };

            transaction.onerror =
                function () {
                    reject(transaction.error);
                };
        }
    );
}

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now() +
        "-" +
        Math.random()
            .toString(16)
            .slice(2)
    );
}

function extensionOf(name) {
    return name
        .split(".")
        .pop()
        .toLowerCase();
}

function baseName(name) {
    const position =
        name.lastIndexOf(".");

    return position > 0
        ? name.slice(0, position)
        : name;
}

/*
    Read CSV, TSV, XLS, and XLSX workbooks.
*/
function parseWorkbook(
    arrayBuffer,
    filename
) {
    if (typeof XLSX === "undefined") {
        throw new Error(
            "The spreadsheet reader did not load. Check your internet connection and refresh."
        );
    }

    const workbook =
        XLSX.read(
            arrayBuffer,
            {
                type: "array",
                cellDates: true
            }
        );

    const sheets =
        workbook.SheetNames
            .map(function (sheetName) {
                const rows =
                    XLSX.utils.sheet_to_json(
                        workbook.Sheets[
                            sheetName
                        ],
                        {
                            header: 1,
                            defval: "",
                            raw: false
                        }
                    );

                if (!rows.length) {
                    return null;
                }

                const width =
                    Math.max(
                        ...rows.map(
                            function (row) {
                                return row.length;
                            }
                        )
                    );

                return {
                    sheetName: sheetName,

                    rows: rows.map(
                        function (row) {
                            return Array.from(
                                {
                                    length: width
                                },

                                function (
                                    _,
                                    index
                                ) {
                                    return String(
                                        row[index] ??
                                        ""
                                    );
                                }
                            );
                        }
                    )
                };
            })
            .filter(Boolean);

    if (!sheets.length) {
        throw new Error(
            filename +
            " does not contain any rows."
        );
    }

    return sheets;
}

/*
    Upload and process selected files.
*/
async function handleFiles(fileList) {
    const allowed = [
        "csv",
        "tsv",
        "xls",
        "xlsx"
    ];

    let added = 0;
    let importedMaterialCount = 0;
    let importedFromCsvImport = false;

    for (const file of fileList) {
        const extension =
            extensionOf(file.name);

        if (
            !allowed.includes(extension)
        ) {
            showMessage(
                file.name +
                " was skipped. Use CSV, TSV, XLS, or XLSX.",
                true
            );

            continue;
        }

        try {
            const arrayBuffer =
                await file.arrayBuffer();

            const parsedSheets =
                parseWorkbook(
                    arrayBuffer,
                    file.name
                );

            /*
                If CSV_Import exists, use only that sheet for
                the main material database.
            */
            const csvImportSheet =
                parsedSheets.find(
                    function (sheet) {
                        return (
                            normalizedHeader(
                                sheet.sheetName
                            ) ===
                            "csvimport"
                        );
                    }
                );

            const materialSheetCandidates =
                csvImportSheet
                    ? [csvImportSheet]
                    : parsedSheets;

            if (csvImportSheet) {
                importedFromCsvImport = true;
            }

            const normalizedMaterialSheets = [];

            materialSheetCandidates.forEach(
                function (sheet) {
                    try {
                        normalizedMaterialSheets.push({
                            sheetName:
                                sheet.sheetName,

                            rows:
                                normalizeMaterialRows(
                                    sheet.rows,
                                    file.name +
                                    " — " +
                                    sheet.sheetName
                                )
                        });
                    } catch (sheetError) {
                        console.info(
                            sheetError.message
                        );
                    }
                }
            );

            if (
                !normalizedMaterialSheets.length
            ) {
                throw new Error(
                    file.name +
                    " has no worksheet with a recognizable Material Name column."
                );
            }

            const combinedRows = [
                normalizedMaterialSheets[0]
                    .rows[0],

                ...normalizedMaterialSheets.flatMap(
                    function (sheet) {
                        return sheet.rows.slice(1);
                    }
                )
            ];

            const materialRowsInFile =
                combinedRows.length - 1;

            const now =
                new Date().toISOString();

            /*
                Save the normalized materials and every original
                worksheet in the browser database.
            */
            await putFile({
                id: createId(),
                name: file.name,

                originalType:
                    extension.toUpperCase(),

                sheetName:
                    normalizedMaterialSheets
                        .map(function (sheet) {
                            return sheet.sheetName;
                        })
                        .join(", "),

                allSheetNames:
                    parsedSheets.map(
                        function (sheet) {
                            return sheet.sheetName;
                        }
                    ),

                workbookSheets:
                    parsedSheets.map(
                        function (sheet) {
                            return {
                                sheetName:
                                    sheet.sheetName,

                                rows:
                                    sheet.rows
                            };
                        }
                    ),

                rows: combinedRows,

                materialCount:
                    materialRowsInFile,

                dateAdded: now,
                dateModified: now
            });

            added += 1;

            importedMaterialCount +=
                materialRowsInFile;
        } catch (error) {
            console.error(error);

            showMessage(
                error.message,
                true
            );
        }
    }

    if (added) {
        const sourceDescription =
            added === 1 &&
            importedFromCsvImport
                ? " from CSV_Import"
                : "";

        showMessage(
            added +
            " file" +
            (
                added === 1
                    ? ""
                    : "s"
            ) +
            " uploaded successfully. " +
            importedMaterialCount +
            " material record" +
            (
                importedMaterialCount === 1
                    ? ""
                    : "s"
            ) +
            " imported" +
            sourceDescription +
            "."
        );
    }

    fileInput.value = "";

    await refreshFileList();
}

function showMessage(
    message,
    isError = false
) {
    fileMessage.textContent =
        message;

    fileMessage.classList.toggle(
        "error-message",
        isError
    );
}

/*
    Refresh the uploaded-files table.
*/
async function refreshFileList() {
    savedFiles =
        (
            await readAllFiles()
        ).sort(
            function (
                firstFile,
                secondFile
            ) {
                return (
                    new Date(
                        secondFile.dateAdded
                    ).getTime() -
                    new Date(
                        firstFile.dateAdded
                    ).getTime()
                );
            }
        );

    uploadedFileCount.textContent =
        savedFiles.length;

    renderFileList();
}

function renderFileList() {
    const query =
        fileSearch
            .value
            .trim()
            .toLowerCase();

    const visibleFiles =
        savedFiles.filter(
            function (file) {
                return file.name
                    .toLowerCase()
                    .includes(query);
            }
        );

    fileTableBody.replaceChildren();

    if (!visibleFiles.length) {
        const row =
            document.createElement("tr");

        row.className = "empty-row";

        const cell =
            document.createElement("td");

        cell.colSpan = 6;

        cell.textContent =
            savedFiles.length
                ? "No files match your search."
                : "No files have been uploaded yet.";

        row.appendChild(cell);
        fileTableBody.appendChild(row);

        return;
    }

    visibleFiles.forEach(
        function (file) {
            const row =
                document.createElement("tr");

            row.append(
                textCell(
                    file.name,
                    "file-name-cell"
                ),

                textCell(
                    file.originalType
                ),

                textCell(
                    String(
                        Math.max(
                            file.rows.length - 1,
                            0
                        )
                    )
                ),

                textCell(
                    formatDate(
                        file.dateAdded
                    )
                ),

                textCell(
                    formatDate(
                        file.dateModified
                    )
                ),

                actionCell(file)
            );

            fileTableBody.appendChild(row);
        }
    );
}

function textCell(
    text,
    className = ""
) {
    const cell =
        document.createElement("td");

    cell.textContent = text;

    if (className) {
        cell.className = className;
    }

    return cell;
}

/*
    Create View, Edit, Rename, and Delete buttons.
*/
function actionCell(file) {
    const cell =
        document.createElement("td");

    const actions =
        document.createElement("div");

    actions.className = "file-actions";

    const actionDefinitions = [
        [
            "View",
            function () {
                openViewer(
                    file,
                    false
                );
            }
        ],

        [
            "Edit",
            function () {
                openViewer(
                    file,
                    true
                );
            }
        ],

        [
            "Rename",
            function () {
                renameSavedFile(file);
            }
        ],

        [
            "Delete",
            function () {
                deleteSavedFile(file);
            }
        ]
    ];

    actionDefinitions.forEach(
        function (definition) {
            const label =
                definition[0];

            const handler =
                definition[1];

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";
            button.textContent = label;

            button.className =
                label === "Delete"
                    ? "table-action danger-action"
                    : "table-action";

            button.addEventListener(
                "click",
                handler
            );

            actions.appendChild(button);
        }
    );

    cell.appendChild(actions);

    return cell;
}

async function renameSavedFile(file) {
    const extension =
        extensionOf(file.name);

    const requestedName =
        window.prompt(
            "Enter a new file name:",
            baseName(file.name)
        );

    if (requestedName === null) {
        return;
    }

    const cleanName =
        requestedName
            .trim()
            .replace(
                /[\\/:*?"<>|]/g,
                "-"
            );

    if (!cleanName) {
        showMessage(
            "The file name cannot be empty.",
            true
        );

        return;
    }

    file.name =
        cleanName +
        "." +
        extension;

    file.dateModified =
        new Date().toISOString();

    await putFile(file);

    showMessage(
        "Renamed file to " +
        file.name +
        "."
    );

    await refreshFileList();
}

async function deleteSavedFile(file) {
    const confirmed =
        window.confirm(
            'Delete "' +
            file.name +
            '"? This cannot be undone.'
        );

    if (!confirmed) {
        return;
    }

    await removeFile(file.id);

    if (
        activeFile &&
        activeFile.id === file.id
    ) {
        closeViewer();
    }

    showMessage(
        file.name +
        " was deleted."
    );

    await refreshFileList();
}

function openViewer(
    file,
    startEditing
) {
    activeFile = file;

    workingRows =
        file.rows.map(
            function (row) {
                return [...row];
            }
        );

    fileViewer.hidden = false;

    viewerTitle.textContent =
        file.name;

    viewerDetails.textContent =
        file.originalType +
        " • " +
        Math.max(
            file.rows.length - 1,
            0
        ) +
        " data row(s) • Sheet: " +
        file.sheetName;

    setEditing(startEditing);

    fileViewer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function closeViewer() {
    activeFile = null;
    workingRows = [];
    editing = false;
    fileViewer.hidden = true;
}

function setEditing(shouldEdit) {
    editing = shouldEdit;

    editFileButton.hidden =
        editing;

    editorButtons.hidden =
        !editing;

    editHelp.hidden =
        !editing;

    renderSpreadsheet();
}

function renderSpreadsheet() {
    const table =
        document.createElement("table");

    table.className =
        "spreadsheet-table";

    const tableBody =
        document.createElement("tbody");

    workingRows.forEach(
        function (
            rowValues,
            rowIndex
        ) {
            const tableRow =
                document.createElement("tr");

            rowValues.forEach(
                function (
                    value,
                    columnIndex
                ) {
                    const cell =
                        document.createElement(
                            rowIndex === 0
                                ? "th"
                                : "td"
                        );

                    cell.textContent =
                        value;

                    if (editing) {
                        cell.contentEditable =
                            "true";

                        cell.spellcheck = false;

                        cell.addEventListener(
                            "input",
                            function () {
                                workingRows[
                                    rowIndex
                                ][
                                    columnIndex
                                ] =
                                    cell.textContent;
                            }
                        );
                    }

                    tableRow.appendChild(
                        cell
                    );
                }
            );

            tableBody.appendChild(
                tableRow
            );
        }
    );

    table.appendChild(
        tableBody
    );

    spreadsheetContainer
        .replaceChildren(table);
}

function addRow() {
    const columnCount =
        workingRows[0]?.length ||
        1;

    workingRows.push(
        new Array(
            columnCount
        ).fill("")
    );

    renderSpreadsheet();
}

function addColumn() {
    if (
        workingRows.length === 0
    ) {
        workingRows.push([]);
    }

    workingRows.forEach(
        function (
            row,
            rowIndex
        ) {
            const columnNumber =
                row.length + 1;

            row.push(
                rowIndex === 0
                    ? "New Column " +
                      columnNumber
                    : ""
            );
        }
    );

    renderSpreadsheet();
}

async function saveEdits() {
    if (!activeFile) {
        return;
    }

    activeFile.rows =
        workingRows.map(
            function (row) {
                return [...row];
            }
        );

    activeFile.dateModified =
        new Date().toISOString();

    await putFile(activeFile);

    showMessage(
        'Changes to "' +
        activeFile.name +
        '" were saved.'
    );

    await refreshFileList();

    setEditing(false);
}

function downloadActiveFile() {
    if (!activeFile) {
        return;
    }

    if (
        typeof XLSX === "undefined"
    ) {
        showMessage(
            "The spreadsheet reader is unavailable.",
            true
        );

        return;
    }

    const worksheet =
        XLSX.utils.aoa_to_sheet(
            activeFile.rows
        );

    const csvText =
        XLSX.utils.sheet_to_csv(
            worksheet
        );

    const csvBlob =
        new Blob(
            [
                "\uFEFF" +
                csvText
            ],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );

    const downloadAddress =
        URL.createObjectURL(
            csvBlob
        );

    const temporaryLink =
        document.createElement("a");

    temporaryLink.href =
        downloadAddress;

    temporaryLink.download =
        baseName(
            activeFile.name
        ) +
        ".csv";

    document.body.appendChild(
        temporaryLink
    );

    temporaryLink.click();
    temporaryLink.remove();

    URL.revokeObjectURL(
        downloadAddress
    );
}

function formatDate(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}

/*
    Upload events.
*/
chooseFilesButton.addEventListener(
    "click",
    function () {
        fileInput.click();
    }
);

fileInput.addEventListener(
    "change",
    function () {
        handleFiles(
            fileInput.files
        );
    }
);

fileSearch.addEventListener(
    "input",
    renderFileList
);

uploadZone.addEventListener(
    "dragover",
    function (event) {
        event.preventDefault();

        uploadZone.classList.add(
            "dragging"
        );
    }
);

uploadZone.addEventListener(
    "dragleave",
    function () {
        uploadZone.classList.remove(
            "dragging"
        );
    }
);

uploadZone.addEventListener(
    "drop",
    function (event) {
        event.preventDefault();

        uploadZone.classList.remove(
            "dragging"
        );

        handleFiles(
            event.dataTransfer.files
        );
    }
);

/*
    Spreadsheet viewer events.
*/
editFileButton.addEventListener(
    "click",
    function () {
        setEditing(true);
    }
);

downloadFileButton.addEventListener(
    "click",
    downloadActiveFile
);

closeViewerButton.addEventListener(
    "click",
    closeViewer
);

cancelEditButton.addEventListener(
    "click",
    function () {
        if (!activeFile) {
            return;
        }

        workingRows =
            activeFile.rows.map(
                function (row) {
                    return [...row];
                }
            );

        setEditing(false);
    }
);

addRowButton.addEventListener(
    "click",
    addRow
);

addColumnButton.addEventListener(
    "click",
    addColumn
);

saveFileButton.addEventListener(
    "click",
    saveEdits
);

/*
    Load saved files when the page opens.
*/
refreshFileList().catch(
    function (error) {
        console.error(error);

        showMessage(
            "Files could not be loaded: " +
            error.message,
            true
        );
    }
);