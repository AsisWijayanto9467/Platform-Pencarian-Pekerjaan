import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function SocietyValidation() {
    const [validationData, setValidationData] = useState(null);
    const [categoryList, setCategoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Mode: 'view' | 'submit' | 'edit'
    const [mode, setMode] = useState("view");

    // Form states
    const [formData, setFormData] = useState({
        work_experience: "",
        job_category_id: "",
        job_position: "",
        reason_accepted: "",
    });
    const [formErrors, setFormErrors] = useState({});

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchValidationStatus();
        fetchCategoryList();
    }, []);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const fetchValidationStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get("/society/validation");
            setValidationData(response.data.data);
            setError("");

            // Set form data jika ada validasi pending
            if (response.data.data && response.data.data.status === "pending") {
                setFormData({
                    work_experience: response.data.data.work_experience || "",
                    job_category_id: response.data.data.job_category?.id || "",
                    job_position: response.data.data.job_position || "",
                    reason_accepted: response.data.data.reason_accepted || "",
                });
            }
        } catch (err) {
            console.error("Error fetching validation:", err);
            setError("Gagal memuat data validasi");
        } finally {
            setLoading(false);
        }
    };

    // ✅ PERBAIKAN: Gunakan endpoint society untuk categories
    const fetchCategoryList = async () => {
        try {
            // Coba endpoint society dulu
            const res = await api.get("/society/get-category");
            setCategoryList(res.data.data || []);
        } catch (err) {
            console.log("Failed to fetch from society endpoint:", err);
            try {
                // Fallback ke officer endpoint
                const res = await api.get("/officer/categories");
                setCategoryList(res.data.data || []);
            } catch (err2) {
                console.log("Failed to fetch from officer endpoint:", err2);
                try {
                    // Fallback ke admin endpoint
                    const res = await api.get("/admin/job-categories");
                    setCategoryList(res.data.data || []);
                } catch (err3) {
                    console.error("Failed to fetch categories:", err3);
                    setCategoryList([]);
                }
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.work_experience?.trim())
            errors.work_experience = "Pengalaman kerja wajib diisi";
        if (!formData.job_category_id)
            errors.job_category_id = "Kategori pekerjaan wajib dipilih";
        if (!formData.job_position?.trim())
            errors.job_position = "Posisi pekerjaan wajib diisi";
        if (!formData.reason_accepted?.trim())
            errors.reason_accepted = "Alasan diterima wajib diisi";
        return errors;
    };

    // Submit Validation
    const handleSubmitValidation = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post("/society/validation", formData);
            setValidationData(res.data.data);
            setMode("view");
            showSuccessBanner(res.data.message || "Validasi berhasil diajukan!");
            fetchValidationStatus();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                const errors = {};
                Object.keys(responseData.errors).forEach((key) => {
                    errors[key] = Array.isArray(responseData.errors[key])
                        ? responseData.errors[key][0]
                        : responseData.errors[key];
                });
                setFormErrors(errors);
            } else {
                setError(responseData?.message || "Gagal mengajukan validasi");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Update Validation
    const handleUpdateValidation = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.put("/society/validation", formData);
            setValidationData(res.data.data);
            setMode("view");
            showSuccessBanner(res.data.message || "Validasi berhasil diperbarui!");
            fetchValidationStatus();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                const errors = {};
                Object.keys(responseData.errors).forEach((key) => {
                    errors[key] = Array.isArray(responseData.errors[key])
                        ? responseData.errors[key][0]
                        : responseData.errors[key];
                });
                setFormErrors(errors);
            } else {
                setError(responseData?.message || "Gagal memperbarui validasi");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel Validation
    const handleCancelValidation = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete("/society/validation");
            setShowDeleteModal(false);
            setValidationData(null);
            setMode("view");
            showSuccessBanner(res.data.message || "Validasi berhasil dibatalkan!");
        } catch (err) {
            setError(err.response?.data?.message || "Gagal membatalkan validasi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartSubmit = () => {
        setFormData({
            work_experience: "",
            job_category_id: "",
            job_position: "",
            reason_accepted: "",
        });
        setFormErrors({});
        setMode("submit");
    };

    const handleStartEdit = () => {
        setFormData({
            work_experience: validationData?.work_experience || "",
            job_category_id: validationData?.job_category?.id || "",
            job_position: validationData?.job_position || "",
            reason_accepted: validationData?.reason_accepted || "",
        });
        setFormErrors({});
        setMode("edit");
    };

    const handleCancelForm = () => {
        setMode("view");
        setFormErrors({});
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "accepted":
                return {
                    icon: "fa-check-circle",
                    color: "#155724",
                    bg: "#d4edda",
                    label: "Tervalidasi",
                };
            case "declined":
                return {
                    icon: "fa-times-circle",
                    color: "#721c24",
                    bg: "#f8d7da",
                    label: "Ditolak",
                };
            case "pending":
                return {
                    icon: "fa-clock",
                    color: "#856404",
                    bg: "#fff3cd",
                    label: "Menunggu Validasi",
                };
            default:
                return {
                    icon: "fa-question-circle",
                    color: "#6c757d",
                    bg: "#e9ecef",
                    label: "Belum Validasi",
                };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <SocietyLayouts>
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "60vh" }}
                >
                    <div className="text-center">
                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                            style={{ width: "3rem", height: "3rem" }}
                        >
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data validasi...</p>
                    </div>
                </div>
            </SocietyLayouts>
        );
    }

    const hasValidation = validationData !== null;
    const isPending = validationData?.status === "pending";
    const status = getStatusBadge(validationData?.status);

    return (
        <SocietyLayouts>
            {/* Banners */}
            {success && (
                <div
                    className="alert alert-success alert-dismissible fade show border-0 shadow-sm"
                    role="alert"
                    style={{ borderRadius: "10px" }}
                >
                    <i className="fas fa-check-circle mr-2"></i>
                    <strong>Berhasil!</strong> {success}
                    <button
                        type="button"
                        className="close"
                        onClick={() => setSuccess("")}
                    >
                        <span>&times;</span>
                    </button>
                </div>
            )}
            {error && (
                <div
                    className="alert alert-danger alert-dismissible fade show border-0 shadow-sm"
                    role="alert"
                    style={{ borderRadius: "10px" }}
                >
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                    <button type="button" className="close" onClick={() => setError("")}>
                        <span>&times;</span>
                    </button>
                </div>
            )}

            {/* Status Card */}
            <div className="row mb-4">
                <div className="col-12">
                    <div
                        className="card border-0 shadow-sm"
                        style={{ borderRadius: "12px" }}
                    >
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="d-flex align-items-center justify-content-center mr-3"
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "14px",
                                            backgroundColor: hasValidation ? status.bg : "#f8d7da",
                                        }}
                                    >
                                        <i
                                            className={`fas ${status.icon}`}
                                            style={{
                                                fontSize: "26px",
                                                color: hasValidation ? status.color : "#dc3545",
                                            }}
                                        ></i>
                                    </div>
                                    <div>
                                        <h6
                                            className="mb-1 fw-bold"
                                            style={{ color: "#2c3e50", fontSize: "1.1rem" }}
                                        >
                                            Status Validasi
                                        </h6>
                                        <div>
                                            <span
                                                className="badge"
                                                style={{
                                                    backgroundColor: status.bg,
                                                    color: status.color,
                                                    padding: "8px 16px",
                                                    borderRadius: "20px",
                                                    fontSize: "0.9rem",
                                                    fontWeight: "600",
                                                    border: `2px solid ${status.color}`,
                                                }}
                                            >
                                                <i className={`fas ${status.icon} mr-1`}></i>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {!hasValidation && mode === "view" && (
                                        <button
                                            className="btn btn-success"
                                            onClick={handleStartSubmit}
                                            style={{ borderRadius: "10px" }}
                                        >
                                            <i className="fas fa-plus-circle mr-2"></i>Ajukan Validasi
                                        </button>
                                    )}
                                    {isPending && mode === "view" && (
                                        <div>
                                            <button
                                                className="btn btn-warning mr-2"
                                                onClick={handleStartEdit}
                                                style={{ borderRadius: "10px" }}
                                            >
                                                <i className="fas fa-edit mr-2"></i>Edit Validasi
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => setShowDeleteModal(true)}
                                                style={{ borderRadius: "10px" }}
                                            >
                                                <i className="fas fa-trash mr-2"></i>Batalkan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form or Detail */}
            {mode === "submit" || mode === "edit" ? (
                <div className="row">
                    <div className="col-12">
                        <div
                            className="card border-0 shadow-sm"
                            style={{ borderRadius: "12px" }}
                        >
                            <div
                                className="card-header bg-white border-0 pt-4 pb-3"
                                style={{ borderRadius: "12px 12px 0 0" }}
                            >
                                <h6
                                    className="mb-0 fw-bold"
                                    style={{ color: "#2c3e50", fontSize: "1rem" }}
                                >
                                    <i
                                        className={`fas fa-${mode === "submit" ? "plus-circle" : "edit"} text-primary mr-2`}
                                    ></i>
                                    {mode === "submit"
                                        ? "Form Pengajuan Validasi"
                                        : "Edit Validasi"}
                                </h6>
                            </div>
                            <div className="card-body">
                                <form
                                    onSubmit={
                                        mode === "submit"
                                            ? handleSubmitValidation
                                            : handleUpdateValidation
                                    }
                                >
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>
                                                    <i
                                                        className="fas fa-tag mr-1"
                                                        style={{ color: "#9b59b6" }}
                                                    ></i>
                                                    Kategori Pekerjaan{" "}
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    name="job_category_id"
                                                    className={`form-control ${formErrors.job_category_id ? "is-invalid" : ""}`}
                                                    value={formData.job_category_id}
                                                    onChange={handleInputChange}
                                                    style={{ borderRadius: "8px" }}
                                                >
                                                    <option value="">-- Pilih Kategori --</option>
                                                    {categoryList.length > 0 ? (
                                                        categoryList.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.job_category}
                                                                {cat.is_active === false && " (Nonaktif)"}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>Memuat kategori...</option>
                                                    )}
                                                </select>
                                                {formErrors.job_category_id && (
                                                    <small className="text-danger">
                                                        {formErrors.job_category_id}
                                                    </small>
                                                )}
                                                {categoryList.length === 0 && (
                                                    <small className="text-warning">
                                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                                        Gagal memuat kategori. Silahkan refresh halaman.
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>
                                                    <i
                                                        className="fas fa-briefcase mr-1"
                                                        style={{ color: "#e67e22" }}
                                                    ></i>
                                                    Posisi Pekerjaan{" "}
                                                    <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="job_position"
                                                    className={`form-control ${formErrors.job_position ? "is-invalid" : ""}`}
                                                    value={formData.job_position}
                                                    onChange={handleInputChange}
                                                    placeholder="Contoh: Web Developer"
                                                    style={{ borderRadius: "8px" }}
                                                />
                                                {formErrors.job_position && (
                                                    <small className="text-danger">
                                                        {formErrors.job_position}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i
                                                className="fas fa-history mr-1"
                                                style={{ color: "#3498db" }}
                                            ></i>
                                            Pengalaman Kerja <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            name="work_experience"
                                            rows="3"
                                            className={`form-control ${formErrors.work_experience ? "is-invalid" : ""}`}
                                            value={formData.work_experience}
                                            onChange={handleInputChange}
                                            placeholder="Jelaskan pengalaman kerja Anda..."
                                            style={{ borderRadius: "8px" }}
                                        ></textarea>
                                        {formErrors.work_experience && (
                                            <small className="text-danger">
                                                {formErrors.work_experience}
                                            </small>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <i
                                                className="fas fa-check-circle mr-1"
                                                style={{ color: "#2ecc71" }}
                                            ></i>
                                            Alasan Diterima <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            name="reason_accepted"
                                            rows="3"
                                            className={`form-control ${formErrors.reason_accepted ? "is-invalid" : ""}`}
                                            value={formData.reason_accepted}
                                            onChange={handleInputChange}
                                            placeholder="Jelaskan mengapa Anda cocok untuk posisi ini..."
                                            style={{ borderRadius: "8px" }}
                                        ></textarea>
                                        {formErrors.reason_accepted && (
                                            <small className="text-danger">
                                                {formErrors.reason_accepted}
                                            </small>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <button
                                            type="button"
                                            className="btn btn-light mr-2"
                                            onClick={handleCancelForm}
                                            disabled={submitting}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-times mr-2"></i>Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn text-white"
                                            disabled={submitting}
                                            style={{
                                                borderRadius: "8px",
                                                background:
                                                    "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                                                border: "none",
                                            }}
                                        >
                                            {submitting ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save mr-2"></i>
                                                    {mode === "submit"
                                                        ? "Ajukan Validasi"
                                                        : "Simpan Perubahan"}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : hasValidation ? (
                /* Detail View */
                <div className="row">
                    <div className="col-12">
                        <div
                            className="card border-0 shadow-sm"
                            style={{ borderRadius: "12px" }}
                        >
                            <div
                                className="card-header bg-white border-0 pt-4 pb-3"
                                style={{ borderRadius: "12px 12px 0 0" }}
                            >
                                <h6
                                    className="mb-0 fw-bold"
                                    style={{ color: "#2c3e50", fontSize: "1rem" }}
                                >
                                    <i className="fas fa-info-circle text-primary mr-2"></i>
                                    Detail Validasi
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                            <i className="fas fa-tag mr-1"></i>Kategori Pekerjaan
                                        </label>
                                        <p style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                                            {validationData?.job_category?.job_category || "-"}
                                        </p>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                            <i className="fas fa-briefcase mr-1"></i>Posisi Pekerjaan
                                        </label>
                                        <p style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                                            {validationData?.job_position || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                            <i className="fas fa-history mr-1"></i>Pengalaman Kerja
                                        </label>
                                        <p style={{ fontSize: "0.95rem" }}>
                                            {validationData?.work_experience || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                            <i className="fas fa-check-circle mr-1"></i>Alasan Diterima
                                        </label>
                                        <p style={{ fontSize: "0.95rem" }}>
                                            {validationData?.reason_accepted || "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Validator Info */}
                                {validationData?.validator && (
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                                <i className="fas fa-user-check mr-1"></i>Validator
                                            </label>
                                            <p style={{ fontSize: "0.95rem", fontWeight: "600" }}>
                                                {validationData.validator.name}
                                            </p>
                                        </div>
                                        {validationData?.validator_notes && (
                                            <div className="col-md-6 mb-3">
                                                <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                                    <i className="fas fa-sticky-note mr-1"></i>Catatan Validator
                                                </label>
                                                <p style={{ fontSize: "0.9rem", fontStyle: "italic" }}>
                                                    "{validationData.validator_notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <hr />
                                <div className="row">
                                    <div className="col-md-6">
                                        <small className="text-muted">
                                            Diajukan: {formatDate(validationData?.created_at)}
                                        </small>
                                    </div>
                                    <div className="col-md-6 text-right">
                                        <small className="text-muted">
                                            Terakhir Diperbarui: {formatDate(validationData?.updated_at)}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="row">
                    <div className="col-12">
                        <div
                            className="card border-0 shadow-sm"
                            style={{ borderRadius: "12px" }}
                        >
                            <div className="card-body text-center py-5">
                                <div className="d-flex justify-content-center mb-3">
                                    <i className="fas fa-clipboard-check fa-4x text-muted"></i>
                                </div>
                                <h5 className="text-muted">Belum Ada Validasi</h5>
                                <p className="text-muted mb-3">
                                    Anda belum mengajukan validasi. Validasi diperlukan untuk melamar pekerjaan.
                                </p>
                                <button
                                    className="btn btn-success"
                                    onClick={handleStartSubmit}
                                    style={{ borderRadius: "10px" }}
                                >
                                    <i className="fas fa-plus-circle mr-2"></i>Ajukan Validasi Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                        <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: "12px 12px 0 0" }}>
                            <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50", fontSize: "1rem" }}>
                                <i className="fas fa-info-circle text-info mr-2"></i>Informasi Validasi
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className="mr-3" style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#fff3cd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="fas fa-clock text-warning"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>Status Pending</p>
                                            <small style={{ color: "#888" }}>Menunggu diverifikasi oleh validator</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className="mr-3" style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#d4edda", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="fas fa-check-circle text-success"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>Tervalidasi</p>
                                            <small style={{ color: "#888" }}>Anda bisa melamar pekerjaan</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div className="mr-3" style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#f8d7da", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <i className="fas fa-times-circle text-danger"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>Ditolak</p>
                                            <small style={{ color: "#888" }}>Ajukan validasi baru jika perlu</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
                        alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px",
                    }}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white", borderRadius: "10px", padding: "32px",
                            width: "420px", maxWidth: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: "20px" }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: "48px", color: "#dc3545", backgroundColor: "#f8d7da", padding: "16px", borderRadius: "50%" }} />
                        </div>
                        <h5 style={{ marginBottom: "12px", fontWeight: "bold", color: "#333" }}>Batalkan Validasi?</h5>
                        <p style={{ color: "#666", marginBottom: "24px" }}>Validasi yang dibatalkan akan dihapus permanen.</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-light" style={{ padding: "10px 24px", borderRadius: "8px" }}>
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button onClick={handleCancelValidation} disabled={submitting} className="btn btn-danger" style={{ padding: "10px 24px", borderRadius: "8px" }}>
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</> : <><i className="fas fa-trash mr-2"></i>Ya, Batalkan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SocietyLayouts>
    );
}