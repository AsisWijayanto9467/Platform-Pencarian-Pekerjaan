import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function Bookmark() {
    // State untuk data bookmark
    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // State untuk search lokal
    const [searchKeyword, setSearchKeyword] = useState("");

    // State untuk detail vacancy
    const [selectedVacancy, setSelectedVacancy] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // State untuk apply job
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyData, setApplyData] = useState({
        vacancy_id: "",
        positions: [],
        notes: "",
    });
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyError, setApplyError] = useState("");

    // State untuk remove bookmark modal
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [removeTarget, setRemoveTarget] = useState(null);
    const [removeLoading, setRemoveLoading] = useState(false);

    // State untuk bulk remove
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkRemoveLoading, setBulkRemoveLoading] = useState(false);

    // State untuk sort
    const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'company'

    useEffect(() => {
        fetchBookmarkedJobs();
    }, []);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    // Fetch bookmarked jobs
    const fetchBookmarkedJobs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/society/bookmarks");
            setBookmarkedJobs(response.data.data || []);
            setError("");
        } catch (err) {
            console.error("Error fetching bookmarks:", err);
            setError("Gagal memuat data bookmark");
        } finally {
            setLoading(false);
        }
    };

    // Remove bookmark
    const handleRemoveBookmark = async (vacancyId) => {
        setRemoveLoading(true);
        try {
            await api.delete(`/society/bookmarks/${vacancyId}`);
            setShowRemoveModal(false);
            setRemoveTarget(null);
            showSuccessBanner("Bookmark berhasil dihapus");
            fetchBookmarkedJobs();
            
            // Tutup detail modal jika yang dihapus sedang ditampilkan
            if (selectedVacancy && selectedVacancy.id === vacancyId) {
                setShowDetailModal(false);
                setSelectedVacancy(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Gagal menghapus bookmark");
        } finally {
            setRemoveLoading(false);
        }
    };

    // Bulk remove bookmarks
    const handleBulkRemove = async () => {
        if (selectedIds.length === 0) return;

        setBulkRemoveLoading(true);
        try {
            const removePromises = selectedIds.map((id) =>
                api.delete(`/society/bookmarks/${id}`)
            );
            await Promise.all(removePromises);
            
            setSelectedIds([]);
            showSuccessBanner(`${selectedIds.length} bookmark berhasil dihapus`);
            fetchBookmarkedJobs();
        } catch (err) {
            console.log(err);
            setError("Gagal menghapus beberapa bookmark");
        } finally {
            setBulkRemoveLoading(false);
        }
    };

    // Toggle select for bulk remove
    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Select/Deselect all
    const toggleSelectAll = () => {
        if (selectedIds.length === filteredJobs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredJobs.map((job) => job.id));
        }
    };

    // View vacancy detail
    const viewVacancyDetail = async (id) => {
        try {
            setDetailLoading(true);
            const response = await api.get(`/society/vacancies/${id}`);
            setSelectedVacancy(response.data.vacancy);
            setShowDetailModal(true);
        } catch (err) {
            console.error("Error fetching detail:", err);
            setError("Gagal memuat detail lowongan");
        } finally {
            setDetailLoading(false);
        }
    };

    // Apply job
    const handleApplyJob = async () => {
        if (applyData.positions.length === 0) {
            setApplyError("Silakan pilih minimal satu posisi");
            return;
        }
        if (!applyData.notes.trim()) {
            setApplyError("Silakan isi catatan lamaran");
            return;
        }

        setApplyLoading(true);
        setApplyError("");
        try {
            const response = await api.post("/society/applications", {
                vacancy_id: applyData.vacancy_id,
                positions: applyData.positions,
                notes: applyData.notes,
            });
            setShowApplyModal(false);
            setApplyData({ vacancy_id: "", positions: [], notes: "" });
            showSuccessBanner(response.data.message || "Lamaran berhasil dikirim!");
            viewVacancyDetail(selectedVacancy.id);
        } catch (err) {
            setApplyError(err.response?.data?.message || "Gagal mengirim lamaran");
        } finally {
            setApplyLoading(false);
        }
    };

    // Toggle position selection for apply
    const togglePositionSelect = (positionId) => {
        setApplyData((prev) => ({
            ...prev,
            positions: prev.positions.includes(positionId)
                ? prev.positions.filter((id) => id !== positionId)
                : [...prev.positions, positionId],
        }));
        setApplyError("");
    };

    // Filter dan sort bookmarks
    const getFilteredAndSortedJobs = () => {
        let filtered = [...bookmarkedJobs];

        // Search filter
        if (searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase();
            filtered = filtered.filter(
                (job) =>
                    job.company?.toLowerCase().includes(keyword) ||
                    job.address?.toLowerCase().includes(keyword) ||
                    job.description?.toLowerCase().includes(keyword) ||
                    job.category?.job_category?.toLowerCase().includes(keyword) ||
                    (job.avaliable_position || []).some((pos) =>
                        pos.position?.toLowerCase().includes(keyword)
                    )
            );
        }

        // Sort
        switch (sortBy) {
            case "newest":
                filtered.sort((a, b) => new Date(b.bookmarked_at) - new Date(a.bookmarked_at));
                break;
            case "oldest":
                filtered.sort((a, b) => new Date(a.bookmarked_at) - new Date(b.bookmarked_at));
                break;
            case "company":
                filtered.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
                break;
            default:
                break;
        }

        return filtered;
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const getPositionBadgeColor = (index) => {
        const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"];
        return colors[index % colors.length];
    };

    const filteredJobs = getFilteredAndSortedJobs();

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
                        <p className="text-muted">Memuat data bookmark...</p>
                    </div>
                </div>
            </SocietyLayouts>
        );
    }

    return (
        <SocietyLayouts>
            {/* Success & Error Banners */}
            {success && (
                <div
                    className="alert alert-success alert-dismissible fade show border-0 shadow-sm"
                    role="alert"
                    style={{ borderRadius: "10px" }}
                >
                    <i className="fas fa-check-circle mr-2"></i>
                    <strong>Berhasil!</strong> {success}
                    <button type="button" className="close" onClick={() => setSuccess("")}>
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

            {/* Header Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="d-flex align-items-center justify-content-center mr-3"
                                        style={{
                                            width: "55px",
                                            height: "55px",
                                            borderRadius: "14px",
                                            backgroundColor: "#fef3f2",
                                        }}
                                    >
                                        <i
                                            className="fas fa-bookmark"
                                            style={{ color: "#e74c3c", fontSize: "24px" }}
                                        ></i>
                                    </div>
                                    <div>
                                        <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                            Lowongan Tersimpan
                                        </h5>
                                        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                            {bookmarkedJobs.length} lowongan tersimpan di bookmark Anda
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Sort Bar */}
                            <div className="row">
                                <div className="col-md-6 mb-2">
                                    <div className="input-group">
                                        <div className="input-group-prepend">
                                            <span
                                                className="input-group-text"
                                                style={{
                                                    backgroundColor: "#f8f9fa",
                                                    border: "1px solid #e0e0e0",
                                                    borderRight: "none",
                                                    borderRadius: "8px 0 0 8px",
                                                }}
                                            >
                                                <i className="fas fa-search text-muted"></i>
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Cari di bookmark..."
                                            value={searchKeyword}
                                            onChange={(e) => setSearchKeyword(e.target.value)}
                                            style={{
                                                border: "1px solid #e0e0e0",
                                                borderLeft: "none",
                                                borderRadius: "0 8px 8px 0",
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3 mb-2">
                                    <select
                                        className="form-control"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        style={{ borderRadius: "8px", border: "1px solid #e0e0e0" }}
                                    >
                                        <option value="newest">Terbaru Disimpan</option>
                                        <option value="oldest">Terlama Disimpan</option>
                                        <option value="company">Nama Perusahaan</option>
                                    </select>
                                </div>
                                <div className="col-md-3 mb-2">
                                    {selectedIds.length > 0 ? (
                                        <button
                                            className="btn btn-danger btn-block"
                                            onClick={handleBulkRemove}
                                            disabled={bulkRemoveLoading}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            {bulkRemoveLoading ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-trash mr-2"></i>
                                                    Hapus {selectedIds.length} Terpilih
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-outline-danger btn-block"
                                            onClick={toggleSelectAll}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-check-square mr-2"></i>
                                            Pilih Semua
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bookmarks List */}
            <div className="row">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((vacancy) => (
                        <div className="col-lg-6 mb-4" key={vacancy.id}>
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    borderRadius: "12px",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    borderLeft: selectedIds.includes(vacancy.id)
                                        ? "4px solid #e74c3c"
                                        : "4px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                                }}
                            >
                                {/* Select Checkbox */}
                                <div
                                    className="position-absolute"
                                    style={{ top: "12px", left: "12px", zIndex: 1 }}
                                >
                                    <div
                                        className="custom-control custom-checkbox"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id={`select-${vacancy.id}`}
                                            checked={selectedIds.includes(vacancy.id)}
                                            onChange={() => toggleSelect(vacancy.id)}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <label
                                            className="custom-control-label"
                                            htmlFor={`select-${vacancy.id}`}
                                            style={{ cursor: "pointer" }}
                                        ></label>
                                    </div>
                                </div>

                                <div className="card-body p-4 pl-5">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="d-flex align-items-center justify-content-center mr-3"
                                                style={{
                                                    width: "50px",
                                                    height: "50px",
                                                    borderRadius: "12px",
                                                    backgroundColor: "#e8f4fd",
                                                }}
                                            >
                                                <i
                                                    className="fas fa-building"
                                                    style={{ color: "#3498db", fontSize: "22px" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                                    {vacancy.company}
                                                </h6>
                                                <small className="text-muted">
                                                    <i className="fas fa-map-marker-alt mr-1"></i>
                                                    {vacancy.address || "Lokasi tidak tersedia"}
                                                </small>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => {
                                                setRemoveTarget(vacancy.id);
                                                setShowRemoveModal(true);
                                            }}
                                            style={{
                                                borderRadius: "50%",
                                                width: "40px",
                                                height: "40px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "#fef3f2",
                                                border: "none",
                                                transition: "all 0.2s",
                                            }}
                                            title="Hapus bookmark"
                                        >
                                            <i
                                                className="fas fa-bookmark"
                                                style={{ color: "#e74c3c", fontSize: "18px" }}
                                            ></i>
                                        </button>
                                    </div>

                                    {/* Category Badge */}
                                    {vacancy.category && (
                                        <div className="mb-2">
                                            <span
                                                className="badge"
                                                style={{
                                                    backgroundColor: "#f0f0f0",
                                                    color: "#555",
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "0.8rem",
                                                }}
                                            >
                                                <i className="fas fa-tag mr-1"></i>
                                                {vacancy.category.job_category}
                                            </span>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                                        {truncateText(vacancy.description, 100)}
                                    </p>

                                    {/* Available Positions */}
                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-2">
                                            <i className="fas fa-users mr-1"></i>Posisi Tersedia:
                                        </small>
                                        <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
                                            {(vacancy.avaliable_position || []).slice(0, 3).map((pos, index) => (
                                                <span
                                                    key={pos.id}
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: `${getPositionBadgeColor(index)}15`,
                                                        color: getPositionBadgeColor(index),
                                                        padding: "6px 10px",
                                                        borderRadius: "8px",
                                                        fontSize: "0.8rem",
                                                        border: `1px solid ${getPositionBadgeColor(index)}30`,
                                                    }}
                                                >
                                                    {pos.position}
                                                    <span className="ml-1" style={{ opacity: 0.7 }}>
                                                        ({pos.apply_capacity}/{pos.capacity})
                                                    </span>
                                                </span>
                                            ))}
                                            {(vacancy.avaliable_position || []).length > 3 && (
                                                <span
                                                    className="badge"
                                                    style={{ backgroundColor: "#f0f0f0", color: "#888" }}
                                                >
                                                    +{(vacancy.avaliable_position || []).length - 3} lainnya
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bookmarked Date */}
                                    <div className="mb-3">
                                        <small className="text-muted">
                                            <i className="fas fa-bookmark mr-1" style={{ color: "#e74c3c" }}></i>
                                            Disimpan: {formatDateShort(vacancy.bookmarked_at)}
                                        </small>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex justify-content-between align-items-center">
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => {
                                                setRemoveTarget(vacancy.id);
                                                setShowRemoveModal(true);
                                            }}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-trash mr-1"></i>Hapus
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => viewVacancyDetail(vacancy.id)}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                background:
                                                    "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                                                border: "none",
                                            }}
                                        >
                                            <i className="fas fa-eye mr-2"></i>Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    /* Empty State */
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body text-center py-5">
                                <div className="d-flex justify-content-center mb-3">
                                    <div
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            borderRadius: "50%",
                                            backgroundColor: "#fef3f2",
                                        }}
                                    >
                                        <i
                                            className="far fa-bookmark fa-3x"
                                            style={{ color: "#e74c3c" }}
                                        ></i>
                                    </div>
                                </div>
                                <h5 className="text-muted">
                                    {searchKeyword ? "Bookmark Tidak Ditemukan" : "Belum Ada Bookmark"}
                                </h5>
                                <p className="text-muted mb-3">
                                    {searchKeyword
                                        ? `Tidak ada bookmark yang cocok dengan "${searchKeyword}"`
                                        : "Anda belum menyimpan lowongan pekerjaan apapun. Jelajahi lowongan dan simpan yang menarik!"}
                                </p>
                                {searchKeyword && (
                                    <button
                                        className="btn btn-outline-secondary mr-2"
                                        onClick={() => setSearchKeyword("")}
                                        style={{ borderRadius: "8px" }}
                                    >
                                        <i className="fas fa-times mr-2"></i>Hapus Pencarian
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={() => (window.location.href = "/society/job-vacancies")}
                                    style={{
                                        borderRadius: "8px",
                                        background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                                        border: "none",
                                    }}
                                >
                                    <i className="fas fa-search mr-2"></i>Jelajahi Lowongan
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedVacancy && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                        padding: "20px",
                    }}
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            width: "700px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Modal Header */}
                                <div
                                    className="p-4"
                                    style={{
                                        background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                                        borderRadius: "12px 12px 0 0",
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="text-white mb-1 fw-bold">
                                                {selectedVacancy.company}
                                            </h5>
                                            <p
                                                className="text-white mb-0"
                                                style={{ opacity: 0.9, fontSize: "0.9rem" }}
                                            >
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {selectedVacancy.address}
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-light"
                                            onClick={() => setShowDetailModal(false)}
                                            style={{
                                                borderRadius: "50%",
                                                width: "35px",
                                                height: "35px",
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                    {selectedVacancy.category && (
                                        <span
                                            className="badge mt-2"
                                            style={{
                                                backgroundColor: "rgba(255,255,255,0.2)",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                            }}
                                        >
                                            {selectedVacancy.category.job_category}
                                        </span>
                                    )}
                                </div>

                                {/* Modal Body */}
                                <div className="p-4">
                                    {/* Description */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-2" style={{ color: "#2c3e50" }}>
                                            <i
                                                className="fas fa-info-circle mr-2"
                                                style={{ color: "#3498db" }}
                                            ></i>
                                            Deskripsi Pekerjaan
                                        </h6>
                                        <p
                                            className="text-muted"
                                            style={{ lineHeight: "1.8", whiteSpace: "pre-line" }}
                                        >
                                            {selectedVacancy.description}
                                        </p>
                                    </div>

                                    {/* Available Positions */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
                                            <i
                                                className="fas fa-users mr-2"
                                                style={{ color: "#2ecc71" }}
                                            ></i>
                                            Posisi Tersedia
                                        </h6>
                                        <div className="row">
                                            {(selectedVacancy.avaliable_position || []).map((pos) => (
                                                <div className="col-md-6 mb-2" key={pos.id}>
                                                    <div
                                                        className="d-flex align-items-center justify-content-between p-3"
                                                        style={{
                                                            backgroundColor: "#f8f9fa",
                                                            borderRadius: "8px",
                                                        }}
                                                    >
                                                        <div>
                                                            <span
                                                                style={{
                                                                    fontWeight: "600",
                                                                    fontSize: "0.9rem",
                                                                }}
                                                            >
                                                                {pos.position}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">
                                                                {pos.apply_capacity}/{pos.capacity} pelamar
                                                            </small>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: "50px",
                                                                height: "50px",
                                                                borderRadius: "50%",
                                                                backgroundColor:
                                                                    pos.apply_capacity >= pos.capacity
                                                                        ? "#f8d7da"
                                                                        : "#d4edda",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: "1.2rem",
                                                                    fontWeight: "bold",
                                                                    color:
                                                                        pos.apply_capacity >= pos.capacity
                                                                            ? "#dc3545"
                                                                            : "#28a745",
                                                                }}
                                                            >
                                                                {pos.capacity - pos.apply_capacity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex justify-content-between">
                                        <button
                                            className="btn btn-outline-danger"
                                            onClick={() => {
                                                setRemoveTarget(selectedVacancy.id);
                                                setShowRemoveModal(true);
                                            }}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-trash mr-2"></i>Hapus Bookmark
                                        </button>
                                        <div>
                                            {selectedVacancy.has_applied ? (
                                                <button
                                                    className="btn btn-success"
                                                    disabled
                                                    style={{ borderRadius: "8px" }}
                                                >
                                                    <i className="fas fa-check-circle mr-2"></i>Sudah Melamar
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => {
                                                        setApplyData({
                                                            vacancy_id: selectedVacancy.id,
                                                            positions: [],
                                                            notes: "",
                                                        });
                                                        setApplyError("");
                                                        setShowApplyModal(true);
                                                    }}
                                                    style={{ borderRadius: "8px" }}
                                                >
                                                    <i className="fas fa-paper-plane mr-2"></i>Lamar Sekarang
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {showApplyModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2100,
                        padding: "20px",
                    }}
                    onClick={() => setShowApplyModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "32px",
                            width: "500px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <i
                                className="fas fa-paper-plane"
                                style={{
                                    fontSize: "48px",
                                    color: "#3498db",
                                    backgroundColor: "#e8f4fd",
                                    padding: "16px",
                                    borderRadius: "50%",
                                }}
                            />
                        </div>
                        <h5 className="text-center mb-1 fw-bold">Lamar Pekerjaan</h5>
                        <p className="text-center text-muted mb-3">{selectedVacancy?.company}</p>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-users mr-1" style={{ color: "#2ecc71" }}></i>
                                Pilih Posisi (bisa lebih dari satu)
                            </label>
                            <div style={{ maxHeight: "200px", overflow: "auto" }}>
                                {(selectedVacancy?.avaliable_position || []).map((pos) => (
                                    <div
                                        key={pos.id}
                                        className={`d-flex align-items-center justify-content-between p-3 mb-2 ${
                                            pos.apply_capacity >= pos.capacity
                                                ? "text-muted"
                                                : ""
                                        }`}
                                        style={{
                                            borderRadius: "8px",
                                            cursor: pos.apply_capacity >= pos.capacity ? "not-allowed" : "pointer",
                                            backgroundColor: applyData.positions.includes(pos.id)
                                                ? "#e8f4fd"
                                                : "#f8f9fa",
                                            border: applyData.positions.includes(pos.id)
                                                ? "2px solid #3498db"
                                                : "1px solid #e0e0e0",
                                            opacity: pos.apply_capacity >= pos.capacity ? 0.6 : 1,
                                        }}
                                        onClick={() => {
                                            if (pos.apply_capacity < pos.capacity) {
                                                togglePositionSelect(pos.id);
                                            }
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="mr-3"
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "6px",
                                                    border: `2px solid ${
                                                        applyData.positions.includes(pos.id)
                                                            ? "#3498db"
                                                            : "#bdc3c7"
                                                    }`,
                                                    backgroundColor: applyData.positions.includes(pos.id)
                                                        ? "#3498db"
                                                        : "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {applyData.positions.includes(pos.id) && (
                                                    <i
                                                        className="fas fa-check"
                                                        style={{
                                                            color: "white",
                                                            fontSize: "12px",
                                                        }}
                                                    ></i>
                                                )}
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                                                    {pos.position}
                                                </span>
                                                <br />
                                                <small>
                                                    {pos.apply_capacity}/{pos.capacity} pelamar
                                                    {pos.apply_capacity >= pos.capacity && " - PENUH"}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <i className="fas fa-sticky-note mr-1" style={{ color: "#e67e22" }}></i>
                                Catatan Lamaran <span className="text-danger">*</span>
                            </label>
                            <textarea
                                className={`form-control ${applyError && !applyData.notes.trim() ? "is-invalid" : ""}`}
                                rows="3"
                                placeholder="Tulis catatan atau alasan melamar..."
                                value={applyData.notes}
                                onChange={(e) => {
                                    setApplyData((prev) => ({ ...prev, notes: e.target.value }));
                                    setApplyError("");
                                }}
                                style={{ borderRadius: "8px" }}
                            ></textarea>
                        </div>

                        {applyError && (
                            <div className="alert alert-danger py-2 text-center" style={{ borderRadius: "8px" }}>
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {applyError}
                            </div>
                        )}

                        <div className="d-flex gap-2 justify-content-center mt-4">
                            <button
                                className="btn btn-light"
                                onClick={() => setShowApplyModal(false)}
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                            >
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleApplyJob}
                                disabled={applyLoading}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                                    border: "none",
                                }}
                            >
                                {applyLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane mr-2"></i>Kirim Lamaran
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Bookmark Confirmation Modal */}
            {showRemoveModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2200,
                        padding: "20px",
                    }}
                    onClick={() => {
                        setShowRemoveModal(false);
                        setRemoveTarget(null);
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "10px",
                            padding: "32px",
                            width: "420px",
                            maxWidth: "100%",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: "20px" }}>
                            <i
                                className="fas fa-bookmark"
                                style={{
                                    fontSize: "48px",
                                    color: "#e74c3c",
                                    backgroundColor: "#fef3f2",
                                    padding: "16px",
                                    borderRadius: "50%",
                                }}
                            />
                        </div>
                        <h5 style={{ marginBottom: "12px", fontWeight: "bold", color: "#333" }}>
                            Hapus Bookmark?
                        </h5>
                        <p style={{ color: "#666", marginBottom: "24px" }}>
                            Lowongan ini akan dihapus dari daftar tersimpan Anda. Anda tetap bisa
                            menyimpannya kembali nanti.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setRemoveTarget(null);
                                }}
                                className="btn btn-light"
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                                disabled={removeLoading}
                            >
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button
                                onClick={() => handleRemoveBookmark(removeTarget)}
                                disabled={removeLoading}
                                className="btn btn-danger"
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                            >
                                {removeLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-trash mr-2"></i>Ya, Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SocietyLayouts>
    );
}