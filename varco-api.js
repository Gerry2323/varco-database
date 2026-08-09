"use strict";

/* Browser-safe Supabase connection. Access is enforced by Supabase RLS policies. */
const VARCO_SUPABASE_URL = "https://gbbftooygaaitanfkgal.supabase.co";
const VARCO_SUPABASE_KEY = "sb_publishable_p-iI5oii89PMJIt_1q8vow_cvoutUyJ";
const VARCO_BUCKET = "varco-files";
const VARCO_IMPORT_BATCH_SIZE = 100;

if (!window.supabase?.createClient) {
    throw new Error("Supabase did not load. Refresh the page and try again.");
}

const varcoSupabase = window.supabase.createClient(
    VARCO_SUPABASE_URL,
    VARCO_SUPABASE_KEY
);

function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "");
}

function asText(value, fallback = "Not Reported") {
    const resolved = firstDefined(value);
    return resolved === undefined ? fallback : String(resolved).trim() || fallback;
}

function asArray(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (value === undefined || value === null || value === "") return [];

    return String(value)
        .split(/[;,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

/*
 * Convert a material to plain JSON before placing it in the material_data JSONB
 * column. This retains all imported CSV headings, including fields the website
 * does not know about yet, while excluding values JSON cannot store.
 */
function cleanMaterialData(material) {
    const seen = new WeakSet();
    const serialized = JSON.stringify(material || {}, (key, value) => {
        if (typeof value === "function" || typeof value === "symbol" || typeof value === "undefined") {
            return undefined;
        }

        if (typeof value === "number" && !Number.isFinite(value)) return null;

        if (value && typeof value === "object") {
            if (seen.has(value)) return undefined;
            seen.add(value);
        }

        return value;
    });

    return serialized ? JSON.parse(serialized) : {};
}

function materialFromRow(row) {
    const importedData = row.material_data && typeof row.material_data === "object"
        ? row.material_data
        : {};

    return {
        ...importedData,
        id: row.id,
        name: firstDefined(row.material_name, importedData.name, importedData.materialName) || "Unnamed material",
        category: firstDefined(row.category, importedData.category) || "Not Reported",
        composition: firstDefined(row.composition, importedData.composition) || "Not Reported",
        compositionBasis: firstDefined(row.composition_basis, importedData.compositionBasis) || "Not specified",
        feedstockForm: firstDefined(row.feedstock_form, importedData.feedstockForm) || "Not Reported",
        manufacturingMethods: asArray(firstDefined(row.manufacturing_methods, importedData.manufacturingMethods)),
        morphologies: asArray(firstDefined(row.morphologies, importedData.morphologies)),
        supplier: firstDefined(row.supplier, importedData.supplier) || "Not Reported",
        productName: firstDefined(row.product_name, importedData.productName) || "Not Reported",
        productNumber: firstDefined(row.product_number, importedData.productNumber) || "Not Reported",
        sourceType: firstDefined(row.source_type, importedData.sourceType) || "Not Reported",
        sourceTitle: firstDefined(row.source_title, importedData.sourceTitle) || "Not Reported",
        sourceFilename: firstDefined(row.source_filename, importedData.sourceFilename) || "Not Reported",
        documentLink: firstDefined(row.document_link, importedData.documentLink) || "Not Reported",
        dateAdded: row.created_at || importedData.dateAdded || null,
        dateUpdated: row.updated_at || importedData.dateUpdated || null,
        origin: importedData.origin || "shared"
    };
}

function materialToRow(material, userId) {
    const completeData = cleanMaterialData(material);

    /* Keep normalized values in JSONB as well as the searchable SQL columns. */
    completeData.name = asText(firstDefined(material.name, material.materialName), "Unnamed material");
    completeData.category = asText(material.category);
    completeData.composition = asText(material.composition);
    completeData.compositionBasis = asText(material.compositionBasis, "Not specified");
    completeData.feedstockForm = asText(material.feedstockForm);
    completeData.manufacturingMethods = asArray(material.manufacturingMethods);
    completeData.morphologies = asArray(material.morphologies);
    completeData.supplier = asText(material.supplier);
    completeData.productName = asText(material.productName);
    completeData.productNumber = asText(material.productNumber);
    completeData.sourceType = asText(material.sourceType);
    completeData.sourceTitle = asText(material.sourceTitle);
    completeData.sourceFilename = asText(material.sourceFilename);
    completeData.documentLink = asText(material.documentLink);

    return {
        material_name: completeData.name,
        category: completeData.category,
        composition: completeData.composition,
        composition_basis: completeData.compositionBasis,
        feedstock_form: completeData.feedstockForm,
        manufacturing_methods: completeData.manufacturingMethods,
        morphologies: completeData.morphologies,
        supplier: completeData.supplier,
        product_name: completeData.productName,
        product_number: completeData.productNumber,
        source_type: completeData.sourceType,
        source_title: completeData.sourceTitle,
        source_filename: completeData.sourceFilename,
        document_link: completeData.documentLink,
        material_data: completeData,
        ...(userId ? { created_by: userId } : {})
    };
}

function requireSuccess(result) {
    if (result.error) throw result.error;
    return result.data;
}

function chunks(items, size) {
    const groups = [];
    for (let index = 0; index < items.length; index += size) {
        groups.push(items.slice(index, index + size));
    }
    return groups;
}

window.varcoApi = {
    client: varcoSupabase,

    async currentUser() {
        const { data, error } = await varcoSupabase.auth.getUser();
        if (error) return null;
        return data.user || null;
    },

    async listMaterials() {
        const data = requireSuccess(await varcoSupabase
            .from("materials")
            .select("*")
            .order("created_at", { ascending: false }));
        return (data || []).map(materialFromRow);
    },

    async saveMaterial(material) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before saving materials.");

        const row = materialToRow(material, user.id);
        if (material.id) {
            /* created_by belongs to the original insert and should not be replaced. */
            delete row.created_by;
            const data = requireSuccess(await varcoSupabase
                .from("materials")
                .update(row)
                .eq("id", material.id)
                .select()
                .single());
            return materialFromRow(data);
        }

        const data = requireSuccess(await varcoSupabase
            .from("materials")
            .insert(row)
            .select()
            .single());
        return materialFromRow(data);
    },

    async deleteMaterial(id) {
        if (!(await this.currentUser())) {
            throw new Error("Sign in as a teammate before deleting materials.");
        }
        requireSuccess(await varcoSupabase.from("materials").delete().eq("id", id));
    },

    async importMaterials(records, fileId) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before importing files.");
        if (!Array.isArray(records) || !records.length) return [];

        const importedRows = [];
        for (const recordBatch of chunks(records, VARCO_IMPORT_BATCH_SIZE)) {
            const rows = recordBatch.map((record) => materialToRow(record, user.id));
            const inserted = requireSuccess(await varcoSupabase
                .from("materials")
                .insert(rows)
                .select());
            importedRows.push(...(inserted || []));
        }

        if (fileId && importedRows.length) {
            const sourceLinks = importedRows.map((row) => ({
                material_id: row.id,
                file_id: fileId
            }));

            for (const linkBatch of chunks(sourceLinks, VARCO_IMPORT_BATCH_SIZE)) {
                requireSuccess(await varcoSupabase
                    .from("material_file_sources")
                    .insert(linkBatch));
            }
        }

        return importedRows.map(materialFromRow);
    },

    async listFiles() {
        const rows = requireSuccess(await varcoSupabase
            .from("uploaded_files")
            .select("*")
            .order("created_at", { ascending: false }));

        return (rows || []).map((row) => ({
            id: row.id,
            name: row.file_name,
            storagePath: row.storage_path,
            originalType: row.file_type || "FILE",
            rowCount: row.row_count || 0,
            materialCount: row.material_count || 0,
            allSheetNames: row.sheet_names || [],
            dateAdded: row.created_at,
            dateModified: row.updated_at
        }));
    },

    async uploadFile(file, metadata = {}) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before uploading files.");

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        requireSuccess(await varcoSupabase.storage.from(VARCO_BUCKET).upload(path, file));

        try {
            return requireSuccess(await varcoSupabase
                .from("uploaded_files")
                .insert({
                    file_name: file.name,
                    storage_path: path,
                    file_type: metadata.fileType || file.type || "FILE",
                    file_size: file.size,
                    row_count: metadata.rowCount || 0,
                    material_count: metadata.materialCount || 0,
                    sheet_names: metadata.sheetNames || [],
                    uploaded_by: user.id
                })
                .select()
                .single());
        } catch (error) {
            /* Avoid leaving an orphaned file if its database record cannot be created. */
            await varcoSupabase.storage.from(VARCO_BUCKET).remove([path]);
            throw error;
        }
    },

    async downloadFile(path) {
        return requireSuccess(await varcoSupabase.storage.from(VARCO_BUCKET).download(path));
    },

    publicFileUrl(path) {
        return varcoSupabase.storage.from(VARCO_BUCKET).getPublicUrl(path).data.publicUrl;
    },

    async deleteFile(file) {
        if (!(await this.currentUser())) {
            throw new Error("Sign in as a teammate before deleting files.");
        }

        requireSuccess(await varcoSupabase.rpc("delete_varco_file", {
            target_file_id: file.id
        }));

        const storageResult = await varcoSupabase.storage
            .from(VARCO_BUCKET)
            .remove([file.storagePath]);

        if (storageResult.error) {
            throw new Error(
                "The database record was deleted, but the stored file could not be removed. " +
                storageResult.error.message
            );
        }
    },

    async signIn(email) {
        return requireSuccess(await varcoSupabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.href.split("#")[0] }
        }));
    },

    async signOut() {
        requireSuccess(await varcoSupabase.auth.signOut());
    }
};

async function installAuthBar() {
    const bar = document.createElement("div");
    bar.className = "varco-auth-bar";
    document.body.prepend(bar);

    async function render() {
        const user = await window.varcoApi.currentUser();
        bar.replaceChildren();

        const status = document.createElement("span");
        status.textContent = user
            ? `Signed in: ${user.email}`
            : "Public view — sign in to edit";

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = user ? "Sign out" : "Teammate sign in";
        button.addEventListener("click", async () => {
            if (user) {
                await window.varcoApi.signOut();
                await render();
                window.location.reload();
                return;
            }

            const email = window.prompt("Enter your approved teammate email address:");
            if (!email) return;

            try {
                await window.varcoApi.signIn(email.trim());
                window.alert("Check your email for the secure Supabase sign-in link.");
            } catch (error) {
                window.alert(error.message);
            }
        });

        bar.append(status, button);
    }

    await render();
    varcoSupabase.auth.onAuthStateChange(() => render());
}

document.addEventListener("DOMContentLoaded", installAuthBar);