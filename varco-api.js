"use strict";

/* Browser-safe Supabase connection. Access is enforced by the RLS policies. */
const VARCO_SUPABASE_URL = "https://gbbftooygaaitanfkgal.supabase.co";
const VARCO_SUPABASE_KEY = "sb_publishable_p-iI5oii89PMJIt_1q8vow_cvoutUyJ";
const VARCO_BUCKET = "varco-files";

if (!window.supabase?.createClient) {
    throw new Error("Supabase did not load. Refresh the page and try again.");
}

const varcoSupabase = window.supabase.createClient(
    VARCO_SUPABASE_URL,
    VARCO_SUPABASE_KEY
);

function materialFromRow(row) {
    return {
        ...(row.material_data || {}),
        id: row.id,
        name: row.material_name,
        category: row.category,
        composition: row.composition,
        compositionBasis: row.composition_basis,
        feedstockForm: row.feedstock_form,
        manufacturingMethods: row.manufacturing_methods || [],
        morphologies: row.morphologies || [],
        supplier: row.supplier,
        productName: row.product_name,
        productNumber: row.product_number,
        sourceType: row.source_type,
        sourceTitle: row.source_title,
        sourceFilename: row.source_filename,
        documentLink: row.document_link,
        dateAdded: row.created_at,
        dateUpdated: row.updated_at,
        origin: row.material_data?.origin || "shared"
    };
}

function materialToRow(material, userId) {
    return {
        material_name: material.name || "Unnamed material",
        category: material.category || "Not Reported",
        composition: material.composition || "Not Reported",
        composition_basis: material.compositionBasis || "Not specified",
        feedstock_form: material.feedstockForm || "Not Reported",
        manufacturing_methods: material.manufacturingMethods || [],
        morphologies: material.morphologies || [],
        supplier: material.supplier || "Not Reported",
        product_name: material.productName || "Not Reported",
        product_number: material.productNumber || "Not Reported",
        source_type: material.sourceType || "Not Reported",
        source_title: material.sourceTitle || "Not Reported",
        source_filename: material.sourceFilename || "Not Reported",
        document_link: material.documentLink || "Not Reported",
        material_data: material,
        ...(userId ? { created_by: userId } : {})
    };
}

function requireSuccess(result) {
    if (result.error) throw result.error;
    return result.data;
}

function batches(items, size = 100) {
    const result = [];
    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size));
    }
    return result;
}

window.varcoApi = {
    client: varcoSupabase,

    async currentUser() {
        const { data } = await varcoSupabase.auth.getUser();
        return data.user || null;
    },

    async listMaterials() {
        const data = requireSuccess(await varcoSupabase
            .from("materials")
            .select("*")
            .order("created_at", { ascending: false }));
        return data.map(materialFromRow);
    },

    async saveMaterial(material) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before saving materials.");
        const row = materialToRow(material, user.id);
        if (material.id) {
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
        if (!(await this.currentUser())) throw new Error("Sign in as a teammate before deleting materials.");
        requireSuccess(await varcoSupabase.from("materials").delete().eq("id", id));
    },

    async importMaterials(records, fileId) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before importing files.");
        if (!records.length) return [];
        /* Keep the source-file relationship on every material row. This is
           the primary link used by deletion and remains available even when
           an older database has no INSERT policy for material_file_sources. */
        const rows = records.map((record) => materialToRow({
            ...record,
            ...(fileId ? { sourceFileId: fileId } : {})
        }, user.id));
        const insertedRows = requireSuccess(await varcoSupabase
            .from("materials")
            .insert(rows)
            .select());

        if (fileId) {
            const sourceLinks = insertedRows.map((row) => ({
                material_id: row.id,
                file_id: fileId
            }));
            const linkResult = await varcoSupabase
                .from("material_file_sources")
                .insert(sourceLinks);
            if (linkResult.error) {
                console.warn(
                    "Materials were published, but the optional source-link table was not updated:",
                    linkResult.error
                );
            }
        }

        return insertedRows.map(materialFromRow);
    },

    async listFiles() {
        return requireSuccess(await varcoSupabase
            .from("uploaded_files")
            .select("*")
            .order("created_at", { ascending: false }))
            .map((row) => ({
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

    /* Preview orphaned imports by their exact source filename. This is
       intentionally read-only and is also useful after an older file record
       has already been removed. */
    async inspectImportByFilename(filename) {
        const exactName = String(filename || "").trim();
        if (!exactName) throw new Error("Enter the exact uploaded filename.");
        const files = requireSuccess(await varcoSupabase
            .from("uploaded_files")
            .select("id, file_name, storage_path, material_count, created_at")
            .eq("file_name", exactName));
        const materials = requireSuccess(await varcoSupabase
            .from("materials")
            .select("id, material_name, source_filename, material_data, created_at")
            .eq("source_filename", exactName));
        return { filename: exactName, files, materials };
    },

    /* Guarded cleanup for an import whose uploaded_files row is already gone.
       Requiring the exact current count prevents a stale command from deleting
       a changed set of records. */
    async deleteImportByFilename(filename, expectedMaterialCount) {
        if (!(await this.currentUser())) {
            throw new Error("Sign in as a teammate before deleting an import.");
        }
        const preview = await this.inspectImportByFilename(filename);
        if (preview.materials.length !== Number(expectedMaterialCount)) {
            throw new Error(
                `Cleanup stopped: expected ${expectedMaterialCount} materials, ` +
                `but found ${preview.materials.length}. Run the preview again.`
            );
        }
        if (preview.files.length) {
            throw new Error(
                "Cleanup stopped because a file record still exists. Delete it from the Uploaded Files page instead."
            );
        }
        /* Delete by the already verified exact filename. This keeps the URL
           short even when an orphaned import contains hundreds of rows. */
        if (preview.materials.length) {
            requireSuccess(await varcoSupabase
                .from("materials")
                .delete()
                .eq("source_filename", preview.filename));
        }
        const verification = await this.inspectImportByFilename(preview.filename);
        if (verification.materials.length) {
            throw new Error(
                `Cleanup could not be verified; ${verification.materials.length} material records remain.`
            );
        }
        return {
            filename: preview.filename,
            deletedMaterials: preview.materials.length,
            deletedFiles: 0
        };
    },

    async uploadFile(file, metadata) {
        const user = await this.currentUser();
        if (!user) throw new Error("Sign in as a teammate before uploading files.");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        requireSuccess(await varcoSupabase.storage.from(VARCO_BUCKET).upload(path, file));
        const data = requireSuccess(await varcoSupabase.from("uploaded_files").insert({
            file_name: file.name,
            storage_path: path,
            file_type: metadata.fileType,
            file_size: file.size,
            row_count: metadata.rowCount,
            material_count: metadata.materialCount,
            sheet_names: metadata.sheetNames,
            uploaded_by: user.id
        }).select().single());
        return data;
    },

    async downloadFile(path) {
        return requireSuccess(await varcoSupabase.storage.from(VARCO_BUCKET).download(path));
    },

    publicFileUrl(path) {
        return varcoSupabase.storage.from(VARCO_BUCKET).getPublicUrl(path).data.publicUrl;
    },

    async deleteFile(file) {
        if (!(await this.currentUser())) throw new Error("Sign in as a teammate before deleting files.");

        const fileRows = requireSuccess(await varcoSupabase
            .from("uploaded_files")
            .select("id, file_name, storage_path, material_count")
            .eq("id", file.id));
        if (fileRows.length !== 1) {
            throw new Error("Deletion stopped because the Supabase file record could not be verified.");
        }
        const fileRow = fileRows[0];

        /* Resolve materials through both relationships supported by VARCO:
           the embedded sourceFileId and the material_file_sources table. */
        const embedded = requireSuccess(await varcoSupabase
            .from("materials")
            .select("id")
            .contains("material_data", { sourceFileId: file.id }));
        const linkResult = await varcoSupabase
            .from("material_file_sources")
            .select("material_id")
            .eq("file_id", file.id);
        const links = linkResult.error ? [] : linkResult.data;
        if (linkResult.error) {
            console.warn("The optional material-file link table could not be read:", linkResult.error);
        }
        const materialIds = new Set([
            ...embedded.map((row) => row.id),
            ...links.map((row) => row.material_id)
        ]);

        /* Compatibility fallback for imports made by a buggy older build.
           It is allowed only when this is the sole uploaded file with that
           exact name, and only for rows marked as spreadsheet imports. */
        if (!materialIds.size) {
            const sameNameFiles = requireSuccess(await varcoSupabase
                .from("uploaded_files")
                .select("id")
                .eq("file_name", fileRow.file_name));
            if (sameNameFiles.length !== 1 || sameNameFiles[0].id !== file.id) {
                throw new Error(
                    "Deletion stopped because this filename is not unique. No materials or files were removed."
                );
            }
            const legacyRows = requireSuccess(await varcoSupabase
                .from("materials")
                .select("id")
                .eq("source_filename", fileRow.file_name)
                .contains("material_data", { origin: "shared-csv" }));
            legacyRows.forEach((row) => materialIds.add(row.id));
        }

        if (Number(fileRow.material_count) > 0 && !materialIds.size) {
            throw new Error(
                "Deletion stopped because no imported materials could be linked to this file. Nothing was removed."
            );
        }

        if (materialIds.size) {
            const ids = Array.from(materialIds);
            for (const idBatch of batches(ids)) {
                requireSuccess(await varcoSupabase
                    .from("materials")
                    .delete()
                    .in("id", idBatch));
            }
            const remaining = [];
            for (const idBatch of batches(ids)) {
                remaining.push(...requireSuccess(await varcoSupabase
                    .from("materials")
                    .select("id")
                    .in("id", idBatch)));
            }
            if (remaining.length) {
                throw new Error(
                    `Deletion stopped: ${remaining.length} linked material records remain in Supabase.`
                );
            }
        }

        requireSuccess(await varcoSupabase.rpc("delete_varco_file", {
            target_file_id: file.id
        }));

        const remainingFile = requireSuccess(await varcoSupabase
            .from("uploaded_files")
            .select("id")
            .eq("id", file.id));
        if (remainingFile.length) {
            throw new Error("The materials were deleted, but the file record could not be removed.");
        }

        const storagePath = file.storagePath || fileRow.storage_path;
        const storageResult = await varcoSupabase.storage
            .from(VARCO_BUCKET)
            .remove([storagePath]);
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
        status.textContent = user ? `Signed in: ${user.email}` : "Public view — sign in to edit";
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