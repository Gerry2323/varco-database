"use strict";

/* Shared CSV/XLSX schema adapter used by every VARCO data page. */
(function () {
    const missing = /^(?:not\s+(?:reported|specified|available)|n\/?a|null|undefined)?$/i;

    function clean(value) {
        const text = String(value ?? "").trim();
        return text && !missing.test(text) ? text : "";
    }

    function key(value) {
        return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const fields = {
        recordId: ["record_id", "Record ID"],
        recordType: ["record_type", "Record Type"],
        dataSourceGroup: ["data_source_group", "Data Source Group"],
        parentMaterial: ["parent_material", "Parent Material"],
        name: ["material_name", "Material Name", "Name", "Material", "Powder Name"],
        supplier: ["supplier", "Supplier", "Manufacturer"],
        productNumber: ["product_code", "Product Code", "Product Number"],
        powderFamily: ["powder_family", "Powder Family"],
        category: ["category", "Category", "Classification", "Class"],
        composition: ["composition_as_reported", "Composition as Reported", "Composition"],
        compositionBasis: ["composition_basis", "Composition Basis"],
        feedstockForm: ["feedstock_form", "Feedstock Form"],
        manufacturingMethods: ["manufacturing_method", "Manufacturing Method", "Manufacturing Methods"],
        morphology: ["morphology", "particle_morphology", "Morphology", "Morphologies", "Particle Morphology"],
        particleSizeMin: ["particle_size_min_um", "Particle Size Min (µm)", "Minimum Particle Size"],
        particleSizeMax: ["particle_size_max_um", "Particle Size Max (µm)", "Maximum Particle Size"],
        particleSizeAverage: ["particle_size_average_um", "Particle Size Average (µm)", "Average Particle Size", "D50"],
        particleSizeReported: ["particle_size_range_reported", "Particle Size Range Reported"],
        sprayProcesses: ["spray_processes", "Recommended Spray Processes"],
        applicationsCharacteristics: ["applications_and_reported_characteristics", "Applications and Reported Characteristics"],
        maxServiceTemperature: ["max_service_temp_c", "Maximum Service Temperature (°C)"],
        maxServiceTemperatureF: ["max_service_temp_f", "Maximum Service Temperature (°F)"],
        densityMin: ["density_min_g_cm3", "Density Min (g/cm³)"],
        densityMax: ["density_max_g_cm3", "Density Max (g/cm³)"],
        densityReported: ["density_value_reported", "Density Value Reported", "Density (g/cm³)"],
        densityType: ["density_type", "Density Type"],
        meltingPointMin: ["melting_point_min_c", "Melting Point Min (°C)"],
        meltingPointMax: ["melting_point_max_c", "Melting Point Max (°C)"],
        meltingPointReported: ["melting_point_reported", "Melting Point Reported", "Melting Point (°C)"],
        hardnessValue: ["hardness_value", "Hardness Value", "Hardness"],
        hardnessScaleLoad: ["hardness_scale_load", "Hardness Scale and Load"],
        classification: ["classification", "Classification"],
        color: ["color", "Color"],
        sourceTitle: ["source_title", "Source Title"],
        sourceFilename: ["source_file", "Source File", "Source Filename"],
        sourcePage: ["source_page_section", "Source Page Section", "Source Page"],
        documentLink: ["source_url", "Source URL", "Document Link", "DOI or URL"],
        catalogUrl: ["catalog_url", "Catalog URL"],
        accessDate: ["access_date", "Access Date"],
        dataQualityStatus: ["evidence_class", "Evidence Class", "Data Quality Status"],
        notes: ["data_quality_note", "Data Quality Note", "Notes"],
        youngsModulusMin: ["young_modulus_min_gpa", "Young's Modulus Min (GPa)"],
        youngsModulusMax: ["young_modulus_max_gpa", "Young's Modulus Max (GPa)"],
        youngsModulusReported: ["young_modulus_gpa", "Young's Modulus (GPa)", "Youngs Modulus", "Elastic Modulus"],
        yieldStressMin: ["yield_stress_min_mpa", "Yield Stress Min (MPa)"],
        yieldStressMax: ["yield_stress_max_mpa", "Yield Stress Max (MPa)"],
        compressiveStrengthMin: ["compressive_strength_min_mpa", "Compressive Strength Min (MPa)"],
        compressiveStrengthMax: ["compressive_strength_max_mpa", "Compressive Strength Max (MPa)"],
        tensileStrengthMin: ["tensile_strength_min_mpa", "Tensile Strength Min (MPa)"],
        tensileStrengthMax: ["tensile_strength_max_mpa", "Tensile Strength Max (MPa)"],
        fractureToughnessMin: ["fracture_toughness_min_mpa_sqrt_m", "Fracture Toughness Min (MPa·m^0.5)"],
        fractureToughnessMax: ["fracture_toughness_max_mpa_sqrt_m", "Fracture Toughness Max (MPa·m^0.5)"],
        softeningTemperatureMin: ["softening_temperature_min_c", "Softening Temperature Min (°C)"],
        softeningTemperatureMax: ["softening_temperature_max_c", "Softening Temperature Max (°C)"],
        abbreviation: ["abbreviation", "Abbreviation"],
        applications: ["applications", "Applications", "Intended Applications"],
        flammabilityRating: ["flammability_rating", "Flammability Rating"],
        freshWaterRating: ["fresh_water_rating", "Fresh Water Rating"],
        saltWaterRating: ["salt_water_rating", "Salt Water Rating"],
        sunlightUvRating: ["sunlight_uv_rating", "Sunlight/UV Rating"],
        wearResistanceRating: ["wear_resistance_rating", "Wear Resistance Rating"],
        environmentRatingScale: ["environment_rating_scale", "Environment Rating Scale"],
        compatibleShapingProcesses: ["compatible_shaping_processes", "Compatible Shaping Processes"],
        atomicSymbol: ["atomic_symbol", "Atomic Symbol"],
        atomicNumber: ["atomic_number", "Atomic Number"],
        relativeAtomicWeight: ["relative_atomic_weight", "Relative Atomic Weight"],
        crystalStructure: ["crystal_structure_20c", "Crystal Structure at 20°C"],
        latticeConstantAB: ["lattice_constant_a_b_angstrom", "Lattice Constant a/b (Å)"],
        latticeConstantC: ["lattice_constant_c_angstrom", "Lattice Constant c (Å)"],
        electrodePotential: ["electrode_potential_v", "Electrode Potential (V)"],
        electrodeReaction: ["electrode_reaction", "Electrode Reaction"],
        oxidationProduct: ["oxidation_product", "Oxidation Product"],
        oxidationFreeEnergy: ["oxidation_free_energy_kj_per_mol_o2", "Oxidation Free Energy (kJ/mol O₂)"],
        additionalSourcePage: ["additional_source_page_section", "Additional Source Page Section"]
    };

    function range(minimum, maximum, unit) {
        const low = clean(minimum), high = clean(maximum);
        if (low && high) return low === high ? `${low} ${unit}` : `${low}–${high} ${unit}`;
        if (low) return `${low} ${unit}`;
        if (high) return `${high} ${unit}`;
        return "";
    }

    function rowToMaterial(headers, row) {
        const indexes = new Map(headers.map((header, index) => [key(header), index]));
        const material = {};
        Object.entries(fields).forEach(([field, headings]) => {
            const heading = [field, ...headings].find((candidate) => indexes.has(key(candidate)));
            material[field] = heading ? clean(row[indexes.get(key(heading))]) : "";
        });

        material.rawProperties = {};
        headers.forEach((header, index) => {
            const value = clean(row[index]);
            if (clean(header) && value) material.rawProperties[String(header).trim()] = value;
        });

        material.density = material.densityReported || range(material.densityMin, material.densityMax, "g/cm³");
        material.meltingPoint = material.meltingPointReported || range(material.meltingPointMin, material.meltingPointMax, "°C");
        material.youngsModulus = material.youngsModulusReported || range(material.youngsModulusMin, material.youngsModulusMax, "GPa");
        material.hardness = material.hardnessValue;
        material.tensileStrength = range(material.tensileStrengthMin, material.tensileStrengthMax, "MPa");
        material.fractureToughness = range(material.fractureToughnessMin, material.fractureToughnessMax, "MPa·m^0.5");
        if (!material.category) material.category = material.classification;
        if (!material.sourceFilename) material.sourceFilename = material.sourceTitle;
        return material;
    }

    function objectToMaterial(record) {
        const source = record && typeof record === "object" ? record : {};
        const headers = Object.keys(source);
        const normalized = rowToMaterial(headers, headers.map((header) => source[header]));
        normalized.rawProperties = {
            ...(source.rawProperties || {}),
            ...normalized.rawProperties
        };
        return { ...source, ...normalized };
    }

    window.VarcoSchema = { clean, key, fields, range, rowToMaterial, objectToMaterial };
})();