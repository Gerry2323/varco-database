// Get the webpage elements we need
const addMaterialButton = document.getElementById("add-material-button");
const closeFormButton = document.getElementById("close-form-button");
const cancelButton = document.getElementById("cancel-button");
const materialForm = document.getElementById("material-form");
const materialSearch = document.getElementById("material-search");
const tableBody = document.getElementById("materials-table-body");

const materialCount = document.getElementById("material-count");
const categoryCount = document.getElementById("category-count");
const recordCount = document.getElementById("record-count");

// Load previously saved materials from the browser
let materials = JSON.parse(localStorage.getItem("varcoMaterials")) || [];

// Open the Add Material form
function openMaterialForm() {
    materialForm.hidden = false;
    document.getElementById("material-name").focus();
}

// Close and clear the form
function closeMaterialForm() {
    materialForm.hidden = true;
    materialForm.reset();
}

// Save the materials array in the browser
function saveMaterials() {
    localStorage.setItem("varcoMaterials", JSON.stringify(materials));
}

// Update the dashboard numbers
function updateDashboard() {
    const categories = new Set(
        materials.map((material) => material.category)
    );

    materialCount.textContent = materials.length;
    categoryCount.textContent = categories.size;
    recordCount.textContent = materials.length;
}

// Display materials in the table
function displayMaterials(materialsToDisplay = materials) {
    tableBody.innerHTML = "";

    if (materialsToDisplay.length === 0) {
        tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    No matching materials were found.
                </td>
            </tr>
        `;

        updateDashboard();
        return;
    }

    materialsToDisplay.forEach((material) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.category}</td>
            <td>${material.composition}</td>
            <td>${material.meltingPoint || "Not provided"}</td>
            <td>${material.source || "Not provided"}</td>
        `;

        tableBody.appendChild(row);
    });

    updateDashboard();
}

// Open the form when Add Material is clicked
addMaterialButton.addEventListener("click", openMaterialForm);

// Close the form with the X or Cancel button
closeFormButton.addEventListener("click", closeMaterialForm);
cancelButton.addEventListener("click", closeMaterialForm);

// Save a new material
materialForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const newMaterial = {
        id: Date.now(),
        name: document.getElementById("material-name").value.trim(),
        category: document.getElementById("material-category").value,
        composition: document
            .getElementById("material-composition")
            .value.trim(),
        meltingPoint: document
            .getElementById("material-melting-point")
            .value.trim(),
        source: document.getElementById("material-source").value.trim()
    };

    materials.push(newMaterial);

    saveMaterials();
    displayMaterials();
    closeMaterialForm();
});

// Search the saved materials
materialSearch.addEventListener("input", () => {
    const searchText = materialSearch.value.toLowerCase().trim();

    const filteredMaterials = materials.filter((material) => {
        return (
            material.name.toLowerCase().includes(searchText) ||
            material.category.toLowerCase().includes(searchText) ||
            material.composition.toLowerCase().includes(searchText) ||
            material.meltingPoint.toLowerCase().includes(searchText) ||
            material.source.toLowerCase().includes(searchText)
        );
    });

    displayMaterials(filteredMaterials);
});

// Display saved materials when the page opens
displayMaterials();