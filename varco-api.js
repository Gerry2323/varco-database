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
        const rows = records.map((record) => materialToRow(record, user.id));
        const insertedRows = requireSuccess(await varcoSupabase
            .from("materials")
            .insert(rows)
            .select());

        if (fileId) {
            const sourceLinks = insertedRows.map((row) => ({
                material_id: row.id,
                file_id: fileId
            }));
            requireSuccess(await varcoSupabase
                .from("material_file_sources")
                .insert(sourceLinks));
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