import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function SocietyJobVacancies() {
    // State untuk data lowongan
    const [vacancies, setVacancies] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // State untuk search & filter
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'recommended' | 'bookmarked'

    // State untuk bookmarked jobs
    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [bookmarkLoading, setBookmarkLoading] = useState({});

    // State untuk detail vacancy
    const [selectedVacancy, setSelectedVacancy] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // State untuk apply job
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState("");
    const [applyLoading, setApplyLoading] = useState(false);
    const [applyError, setApplyError] = useState("");

    // State untuk filter
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [categories, setCategories] = useState([]);
    const [filterData, setFilterData] = useState({
        job_category_id: "",
        position: "",
        sort_by: "created_at",
        sort_order: "desc",
    });

    useEffect(() => {
        fetchVacancies();
        fetchRecommendedJobs();
        fetchCategories();
    }, []);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    // Fetch all vacancies
    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const response = await api.get("/society/vacancies");
            setVacancies(response.data.vacancies || []);
            setError("");
        } catch (err) {
            console.error("Error fetching vacancies:", err);
            setError("Gagal memuat data lowongan");
        } finally {
            setLoading(false);
        }
    };

    // Fetch recommended jobs
    const fetchRecommendedJobs = async () => {
        try {
            const response = await api.get("/society/recommended-jobs");
            setRecommendedJobs(response.data.data || []);
        } catch (err) {
            console.error("Error fetching recommended jobs:", err);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const res = await api.get("/society/get-category");
            setCategories(res.data.data || []);
        } catch (err) {
            console.log("Failed to fetch categories:", err);
        }
    };

    // Fetch bookmarked jobs
    const fetchBookmarkedJobs = async () => {
        try {
            const response = await api.get("/society/bookmarks");
            setBookmarkedJobs(response.data.data || []);
        } catch (err) {
            console.error("Error fetching bookmarks:", err);
        }
    };

    // Search vacancies
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchKeyword.trim()) {
            setIsSearching(false);
            setSearchResults(null);
            return;
        }

        try {
            setLoading(true);
            const response = await api.get("/society/vacancies/search", {
                params: { keyword: searchKeyword },
            });
            setSearchResults(response.data);
            setIsSearching(true);
            setActiveTab("all");
        } catch (err) {
            console.log(err);
            setError("Gagal melakukan pencarian");
        } finally {
            setLoading(false);
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchKeyword("");
        setIsSearching(false);
        setSearchResults(null);
        fetchVacancies();
    };

    // Handle filter
    const handleFilterApply = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterData.job_category_id) params.job_category_id = filterData.job_category_id;
            if (filterData.position) params.position = filterData.position;
            if (filterData.sort_by) params.sort_by = filterData.sort_by;
            if (filterData.sort_order) params.sort_order = filterData.sort_order;

            const response = await api.get("/society/vacancies/filter", { params });
            setVacancies(response.data.data?.data || []);
            setShowFilterModal(false);
            showSuccessBanner("Filter berhasil diterapkan");
        } catch (err) {
            console.log(err);
            setError("Gagal menerapkan filter");
        } finally {
            setLoading(false);
        }
    };

    // Clear filter
    const clearFilter = () => {
        setFilterData({
            job_category_id: "",
            position: "",
            sort_by: "created_at",
            sort_order: "desc",
        });
        fetchVacancies();
        setShowFilterModal(false);
    };

    // View vacancy detail
    const viewVacancyDetail = async (id) => {
        try {
            setDetailLoading(true);
            const response = await api.get(`/society/vacancies/${id}`);
            setSelectedVacancy(response.data.vacancy);
            setShowDetailModal(true);
        } catch (err) {
            console.log(err);
            setError("Gagal memuat detail lowongan");
        } finally {
            setDetailLoading(false);
        }
    };

    // Toggle bookmark
    const toggleBookmark = async (vacancyId, isBookmarked) => {
        setBookmarkLoading((prev) => ({ ...prev, [vacancyId]: true }));
        try {
            if (isBookmarked) {
                await api.delete(`/society/bookmarks/${vacancyId}`);
                showSuccessBanner("Bookmark berhasil dihapus");
            } else {
                await api.post(`/society/bookmarks/${vacancyId}`);
                showSuccessBanner("Lowongan berhasil dibookmark");
            }

            // Update data
            fetchVacancies();
            fetchRecommendedJobs();
            if (activeTab === "bookmarked") fetchBookmarkedJobs();

            // Update detail jika sedang terbuka
            if (selectedVacancy && selectedVacancy.id === vacancyId) {
                viewVacancyDetail(vacancyId);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengubah bookmark");
        } finally {
            setBookmarkLoading((prev) => ({ ...prev, [vacancyId]: false }));
        }
    };

    // Apply job
    const handleApplyJob = async () => {
        if (!selectedPosition) {
            setApplyError("Silakan pilih posisi yang dilamar");
            return;
        }

        setApplyLoading(true);
        setApplyError("");
        try {
            await api.post("/society/applications", {
                job_vacancy_id: selectedVacancy.id,
                position_id: selectedPosition,
            });
            setShowApplyModal(false);
            setSelectedPosition("");
            showSuccessBanner("Lamaran berhasil dikirim!");
            viewVacancyDetail(selectedVacancy.id);
        } catch (err) {
            setApplyError(err.response?.data?.message || "Gagal mengirim lamaran");
        } finally {
            setApplyLoading(false);
        }
    };

    // Get displayed vacancies based on active tab
    const getDisplayedVacancies = () => {
        if (isSearching && searchResults) {
            return searchResults.vacancies || [];
        }

        switch (activeTab) {
            case "recommended":
                return recommendedJobs;
            case "bookmarked":
                return bookmarkedJobs;
            default:
                return vacancies;
        }
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const getPositionBadgeColor = (index) => {
        const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"];
        return colors[index % colors.length];
    };

    if (loading && vacancies.length === 0) {
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
                        <p className="text-muted">Memuat data lowongan...</p>
                    </div>
                </div>
            </SocietyLayouts>
        );
    }

    const displayedVacancies = getDisplayedVacancies();

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
                                <div>
                                    <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                        <i className="fas fa-briefcase text-primary mr-2"></i>
                                        Lowongan Pekerjaan
                                    </h5>
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Temukan pekerjaan yang sesuai dengan keahlian Anda
                                    </p>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch}>
                                <div className="input-group" style={{ borderRadius: "10px", overflow: "hidden" }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cari lowongan, perusahaan, atau posisi..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        style={{ borderRadius: "10px 0 0 10px", border: "1px solid #e0e0e0" }}
                                    />
                                    <div className="input-group-append">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            style={{ borderRadius: "0", border: "none" }}
                                        >
                                            <i className="fas fa-search mr-2"></i>Cari
                                        </button>
                                        {isSearching && (
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={clearSearch}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-outline-primary"
                                            type="button"
                                            onClick={() => setShowFilterModal(true)}
                                            style={{ borderRadius: "0 10px 10px 0" }}
                                        >
                                            <i className="fas fa-filter mr-2"></i>Filter
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {isSearching && searchResults && (
                                <div className="mt-2">
                                    <small className="text-muted">
                                        <i className="fas fa-info-circle mr-1"></i>
                                        Ditemukan {searchResults.total} hasil untuk "{searchResults.keyword}"
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex" style={{ gap: "10px" }}>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveTab("all");
                                setIsSearching(false);
                                setSearchResults(null);
                                setSearchKeyword("");
                            }}
                            style={{
                                borderRadius: "10px",
                                backgroundColor: activeTab === "all" ? "#3498db" : "#f8f9fa",
                                color: activeTab === "all" ? "white" : "#6c757d",
                                border: "none",
                                padding: "10px 20px",
                                fontWeight: "600",
                            }}
                        >
                            <i className="fas fa-list mr-2"></i>Semua Lowongan
                        </button>
                        <button
                            className="btn"
                            onClick={() => setActiveTab("recommended")}
                            style={{
                                borderRadius: "10px",
                                backgroundColor: activeTab === "recommended" ? "#e67e22" : "#f8f9fa",
                                color: activeTab === "recommended" ? "white" : "#6c757d",
                                border: "none",
                                padding: "10px 20px",
                                fontWeight: "600",
                            }}
                        >
                            <i className="fas fa-star mr-2"></i>Rekomendasi
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveTab("bookmarked");
                                fetchBookmarkedJobs();
                            }}
                            style={{
                                borderRadius: "10px",
                                backgroundColor: activeTab === "bookmarked" ? "#e74c3c" : "#f8f9fa",
                                color: activeTab === "bookmarked" ? "white" : "#6c757d",
                                border: "none",
                                padding: "10px 20px",
                                fontWeight: "600",
                            }}
                        >
                            <i className="fas fa-bookmark mr-2"></i>Tersimpan
                        </button>
                    </div>
                </div>
            </div>

            {/* Vacancies List */}
            <div className="row">
                {displayedVacancies.length > 0 ? (
                    displayedVacancies.map((vacancy) => (
                        <div className="col-lg-6 mb-4" key={vacancy.id}>
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{ borderRadius: "12px", transition: "transform 0.2s, box-shadow 0.2s" }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                                }}
                            >
                                <div className="card-body p-4">
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
                                                <i className="fas fa-building" style={{ color: "#3498db", fontSize: "22px" }}></i>
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
                                            onClick={() => toggleBookmark(vacancy.id, vacancy.is_bookmarked)}
                                            disabled={bookmarkLoading[vacancy.id]}
                                            style={{
                                                borderRadius: "50%",
                                                width: "40px",
                                                height: "40px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: vacancy.is_bookmarked ? "#fef3f2" : "#f8f9fa",
                                                border: "none",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {bookmarkLoading[vacancy.id] ? (
                                                <i className="fas fa-spinner fa-spin" style={{ color: "#e74c3c" }}></i>
                                            ) : (
                                                <i
                                                    className={vacancy.is_bookmarked ? "fas fa-bookmark" : "far fa-bookmark"}
                                                    style={{ color: vacancy.is_bookmarked ? "#e74c3c" : "#bdc3c7", fontSize: "18px" }}
                                                ></i>
                                            )}
                                        </button>
                                    </div>

                                    {/* Category Badge */}
                                    {vacancy.category && (
                                        <div className="mb-3">
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
                                        {truncateText(vacancy.description, 120)}
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
                                                <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "#888" }}>
                                                    +{(vacancy.avaliable_position || []).length - 3} lainnya
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="text-right">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => viewVacancyDetail(vacancy.id)}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
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
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body text-center py-5">
                                <div className="d-flex justify-content-center mb-3">
                                    <i className="fas fa-search fa-4x text-muted"></i>
                                </div>
                                <h5 className="text-muted">Tidak Ada Lowongan</h5>
                                <p className="text-muted">
                                    {activeTab === "bookmarked"
                                        ? "Anda belum menyimpan lowongan apapun"
                                        : activeTab === "recommended"
                                        ? "Tidak ada rekomendasi lowongan saat ini"
                                        : "Belum ada lowongan pekerjaan yang tersedia"}
                                </p>
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
                                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        borderRadius: "12px 12px 0 0",
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 className="text-white mb-1 fw-bold">{selectedVacancy.company}</h5>
                                            <p className="text-white mb-0" style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {selectedVacancy.address}
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => toggleBookmark(selectedVacancy.id, selectedVacancy.is_bookmarked)}
                                            disabled={bookmarkLoading[selectedVacancy.id]}
                                            style={{
                                                borderRadius: "50%",
                                                width: "45px",
                                                height: "45px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "rgba(255,255,255,0.2)",
                                                border: "none",
                                            }}
                                        >
                                            {bookmarkLoading[selectedVacancy.id] ? (
                                                <i className="fas fa-spinner fa-spin text-white"></i>
                                            ) : (
                                                <i
                                                    className={selectedVacancy.is_bookmarked ? "fas fa-bookmark" : "far fa-bookmark"}
                                                    style={{ color: "white", fontSize: "20px" }}
                                                ></i>
                                            )}
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
                                            <i className="fas fa-info-circle mr-2" style={{ color: "#3498db" }}></i>
                                            Deskripsi Pekerjaan
                                        </h6>
                                        <p className="text-muted" style={{ lineHeight: "1.8", whiteSpace: "pre-line" }}>
                                            {selectedVacancy.description}
                                        </p>
                                    </div>

                                    {/* Available Positions */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
                                            <i className="fas fa-users mr-2" style={{ color: "#2ecc71" }}></i>
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
                                                            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
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
                                    <div className="text-right">
                                        {selectedVacancy.has_applied ? (
                                            <button className="btn btn-success" disabled style={{ borderRadius: "8px" }}>
                                                <i className="fas fa-check-circle mr-2"></i>Sudah Melamar
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => {
                                                    setShowApplyModal(true);
                                                    setSelectedPosition("");
                                                    setApplyError("");
                                                }}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                <i className="fas fa-paper-plane mr-2"></i>Lamar Sekarang
                                            </button>
                                        )}
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
                            borderRadius: "10px",
                            padding: "32px",
                            width: "450px",
                            maxWidth: "100%",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                            textAlign: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3">
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
                        <h5 className="mb-3 fw-bold">Lamar Pekerjaan</h5>
                        <p className="text-muted mb-3">{selectedVacancy?.company}</p>

                        <div className="form-group text-left">
                            <label>Pilih Posisi</label>
                            <select
                                className={`form-control ${applyError ? "is-invalid" : ""}`}
                                value={selectedPosition}
                                onChange={(e) => {
                                    setSelectedPosition(e.target.value);
                                    setApplyError("");
                                }}
                                style={{ borderRadius: "8px" }}
                            >
                                <option value="">-- Pilih Posisi --</option>
                                {(selectedVacancy?.avaliable_position || []).map((pos) => (
                                    <option
                                        key={pos.id}
                                        value={pos.id}
                                        disabled={pos.apply_capacity >= pos.capacity}
                                    >
                                        {pos.position} ({pos.apply_capacity}/{pos.capacity})
                                        {pos.apply_capacity >= pos.capacity ? " - PENUH" : ""}
                                    </option>
                                ))}
                            </select>
                            {applyError && <small className="text-danger">{applyError}</small>}
                        </div>

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

            {/* Filter Modal */}
            {showFilterModal && (
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
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "10px",
                            padding: "32px",
                            width: "500px",
                            maxWidth: "100%",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h5 className="mb-4 fw-bold">
                            <i className="fas fa-filter mr-2 text-primary"></i>Filter Lowongan
                        </h5>

                        <div className="form-group">
                            <label>Kategori Pekerjaan</label>
                            <select
                                className="form-control"
                                value={filterData.job_category_id}
                                onChange={(e) =>
                                    setFilterData((prev) => ({ ...prev, job_category_id: e.target.value }))
                                }
                                style={{ borderRadius: "8px" }}
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.job_category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Posisi</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Cari posisi..."
                                value={filterData.position}
                                onChange={(e) =>
                                    setFilterData((prev) => ({ ...prev, position: e.target.value }))
                                }
                                style={{ borderRadius: "8px" }}
                            />
                        </div>

                        <div className="form-group">
                            <label>Urutkan Berdasarkan</label>
                            <select
                                className="form-control"
                                value={filterData.sort_by}
                                onChange={(e) =>
                                    setFilterData((prev) => ({ ...prev, sort_by: e.target.value }))
                                }
                                style={{ borderRadius: "8px" }}
                            >
                                <option value="created_at">Tanggal Posting</option>
                                <option value="company">Nama Perusahaan</option>
                            </select>
                        </div>

                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <button
                                className="btn btn-light mr-2"
                                onClick={clearFilter}
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                            >
                                <i className="fas fa-redo mr-2"></i>Reset
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleFilterApply}
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                                    border: "none",
                                }}
                            >
                                <i className="fas fa-check mr-2"></i>Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SocietyLayouts>
    );
}