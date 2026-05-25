import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function SocietyHistory() {
    // State untuk data history
    const [jobHistory, setJobHistory] = useState([]);
    const [applicationHistory, setApplicationHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Tab aktif
    const [activeTab, setActiveTab] = useState("job"); // 'job' | 'application'

    // State untuk detail modal
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // State untuk timeline view
    const [viewMode, setViewMode] = useState("card"); // 'card' | 'timeline'

    useEffect(() => {
        fetchHistoryData();
    }, [activeTab]);


    // Fetch history data
    const fetchHistoryData = async () => {
        try {
            setLoading(true);
            
            if (activeTab === "job") {
                const response = await api.get("/society/job-history");
                setJobHistory(response.data.data || []);
            } else {
                const response = await api.get("/society/application-history");
                setApplicationHistory(response.data.data || null);
            }
            
            setError("");
        } catch (err) {
            console.error("Error fetching history:", err);
            setError("Gagal memuat data riwayat");
        } finally {
            setLoading(false);
        }
    };

    // Format tanggal
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

    // Format tanggal pendek
    const formatDateShort = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Dapatkan status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case "accepted":
                return {
                    icon: "fa-check-circle",
                    color: "#155724",
                    bg: "#d4edda",
                    label: "Diterima",
                };
            case "rejected":
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
                    label: "Pending",
                };
            default:
                return {
                    icon: "fa-question-circle",
                    color: "#6c757d",
                    bg: "#e9ecef",
                    label: "Unknown",
                };
        }
    };

    // Hitung statistik job history
    const getJobHistoryStats = () => {
        let totalAccepted = 0;
        let totalRejected = 0;

        jobHistory.forEach((job) => {
            (job.positions || []).forEach((pos) => {
                if (pos.status === "accepted") totalAccepted++;
                if (pos.status === "rejected") totalRejected++;
            });
        });

        return {
            totalCompanies: jobHistory.length,
            totalAccepted,
            totalRejected,
        };
    };

    // Hitung statistik application history
    const getApplicationStats = () => {
        if (!applicationHistory) return { pending: 0, accepted: 0, rejected: 0 };
        
        return {
            pending: applicationHistory.pending?.count || 0,
            accepted: applicationHistory.accepted?.count || 0,
            rejected: applicationHistory.rejected?.count || 0,
        };
    };

    const jobStats = getJobHistoryStats();
    const appStats = getApplicationStats();

    if (loading && jobHistory.length === 0 && !applicationHistory) {
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
                        <p className="text-muted">Memuat data riwayat...</p>
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
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                        <i className="fas fa-history text-primary mr-2"></i>
                                        Riwayat
                                    </h5>
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Lihat riwayat lamaran dan pekerjaan Anda
                                    </p>
                                </div>
                                <div className="d-flex" style={{ gap: "8px" }}>
                                    <button
                                        className={`btn btn-sm ${viewMode === "card" ? "btn-primary" : "btn-light"}`}
                                        onClick={() => setViewMode("card")}
                                        style={{ borderRadius: "8px" }}
                                    >
                                        <i className="fas fa-th-large mr-1"></i>Card
                                    </button>
                                    <button
                                        className={`btn btn-sm ${viewMode === "timeline" ? "btn-primary" : "btn-light"}`}
                                        onClick={() => setViewMode("timeline")}
                                        style={{ borderRadius: "8px" }}
                                    >
                                        <i className="fas fa-stream mr-1"></i>Timeline
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex" style={{ gap: "10px" }}>
                        <button
                            className="btn"
                            onClick={() => setActiveTab("job")}
                            style={{
                                borderRadius: "10px",
                                backgroundColor: activeTab === "job" ? "#3498db" : "#f8f9fa",
                                color: activeTab === "job" ? "white" : "#6c757d",
                                border: "none",
                                padding: "12px 24px",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                            }}
                        >
                            <i className="fas fa-briefcase mr-2"></i>Riwayat Pekerjaan
                        </button>
                        <button
                            className="btn"
                            onClick={() => setActiveTab("application")}
                            style={{
                                borderRadius: "10px",
                                backgroundColor: activeTab === "application" ? "#2ecc71" : "#f8f9fa",
                                color: activeTab === "application" ? "white" : "#6c757d",
                                border: "none",
                                padding: "12px 24px",
                                fontWeight: "600",
                                fontSize: "0.95rem",
                            }}
                        >
                            <i className="fas fa-file-alt mr-2"></i>Riwayat Aplikasi
                        </button>
                    </div>
                </div>
            </div>

            {/* Job History Tab */}
            {activeTab === "job" && (
                <>
                    {/* Statistics Cards */}
                    <div className="row mb-4">
                        <div className="col-md-4 col-6 mb-3">
                            <div
                                className="card border-0 shadow-sm text-center p-3"
                                style={{ borderRadius: "12px" }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{
                                        width: "45px",
                                        height: "45px",
                                        borderRadius: "12px",
                                        backgroundColor: "#e8f4fd",
                                    }}
                                >
                                    <i className="fas fa-building" style={{ color: "#3498db", fontSize: "20px" }}></i>
                                </div>
                                <h4 className="mb-0 fw-bold" style={{ color: "#3498db" }}>{jobStats.totalCompanies}</h4>
                                <small className="text-muted">Perusahaan</small>
                            </div>
                        </div>
                        <div className="col-md-4 col-6 mb-3">
                            <div
                                className="card border-0 shadow-sm text-center p-3"
                                style={{ borderRadius: "12px" }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{
                                        width: "45px",
                                        height: "45px",
                                        borderRadius: "12px",
                                        backgroundColor: "#d4edda",
                                    }}
                                >
                                    <i className="fas fa-check-circle" style={{ color: "#28a745", fontSize: "20px" }}></i>
                                </div>
                                <h4 className="mb-0 fw-bold" style={{ color: "#28a745" }}>{jobStats.totalAccepted}</h4>
                                <small className="text-muted">Diterima</small>
                            </div>
                        </div>
                        <div className="col-md-4 col-6 mb-3">
                            <div
                                className="card border-0 shadow-sm text-center p-3"
                                style={{ borderRadius: "12px" }}
                            >
                                <div
                                    className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{
                                        width: "45px",
                                        height: "45px",
                                        borderRadius: "12px",
                                        backgroundColor: "#f8d7da",
                                    }}
                                >
                                    <i className="fas fa-times-circle" style={{ color: "#dc3545", fontSize: "20px" }}></i>
                                </div>
                                <h4 className="mb-0 fw-bold" style={{ color: "#dc3545" }}>{jobStats.totalRejected}</h4>
                                <small className="text-muted">Ditolak</small>
                            </div>
                        </div>
                    </div>

                    {/* Job History List */}
                    {jobHistory.length > 0 ? (
                        viewMode === "card" ? (
                            /* Card View */
                            <div className="row">
                                {jobHistory.map((job) => (
                                    <div className="col-lg-6 mb-4" key={job.id}>
                                        <div
                                            className="card border-0 shadow-sm h-100"
                                            style={{
                                                borderRadius: "12px",
                                                transition: "transform 0.2s, box-shadow 0.2s",
                                                cursor: "pointer",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
                                            }}
                                            onClick={() => {
                                                setSelectedHistory(job);
                                                setShowDetailModal(true);
                                            }}
                                        >
                                            <div className="card-body p-4">
                                                {/* Company Info */}
                                                <div className="d-flex align-items-center mb-3">
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
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                                            {job.company}
                                                        </h6>
                                                        <small className="text-muted">
                                                            <i className="fas fa-calendar-alt mr-1"></i>
                                                            {formatDateShort(job.apply_date)}
                                                        </small>
                                                    </div>
                                                    {job.category && (
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
                                                            {job.category}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Positions Summary */}
                                                <div className="mb-2">
                                                    <small className="text-muted d-block mb-2">
                                                        <i className="fas fa-users mr-1"></i>Posisi:
                                                    </small>
                                                    <div className="d-flex flex-wrap" style={{ gap: "6px" }}>
                                                        {(job.positions || []).slice(0, 3).map((pos, index) => {
                                                            const status = getStatusBadge(pos.status);
                                                            return (
                                                                <span
                                                                    key={index}
                                                                    className="badge"
                                                                    style={{
                                                                        backgroundColor: status.bg,
                                                                        color: status.color,
                                                                        padding: "5px 10px",
                                                                        borderRadius: "8px",
                                                                        fontSize: "0.8rem",
                                                                        border: `1px solid ${status.color}30`,
                                                                    }}
                                                                >
                                                                    {pos.position}
                                                                    <i className={`fas ${status.icon} ml-1`} style={{ fontSize: "0.7rem" }}></i>
                                                                </span>
                                                            );
                                                        })}
                                                        {(job.positions || []).length > 3 && (
                                                            <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "#888" }}>
                                                                +{(job.positions || []).length - 3} lainnya
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* View Detail Hint */}
                                                <div className="text-right mt-2">
                                                    <small className="text-primary">
                                                        <i className="fas fa-eye mr-1"></i>Klik untuk detail
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Timeline View */
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                        <div className="card-body p-4">
                                            <div className="timeline">
                                                {jobHistory.map((job, index) => (
                                                    <div
                                                        key={job.id}
                                                        className="d-flex mb-4"
                                                        style={{ position: "relative" }}
                                                    >
                                                        {/* Timeline Line & Dot */}
                                                        <div
                                                            className="mr-3 d-flex flex-column align-items-center"
                                                            style={{ minWidth: "30px" }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: "12px",
                                                                    height: "12px",
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "#3498db",
                                                                    border: "3px solid #e8f4fd",
                                                                    marginTop: "5px",
                                                                }}
                                                            ></div>
                                                            {index < jobHistory.length - 1 && (
                                                                <div
                                                                    style={{
                                                                        width: "2px",
                                                                        flex: 1,
                                                                        backgroundColor: "#e0e0e0",
                                                                        marginTop: "4px",
                                                                    }}
                                                                ></div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div
                                                            className="flex-grow-1 p-3"
                                                            style={{
                                                                backgroundColor: "#f8f9fa",
                                                                borderRadius: "10px",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => {
                                                                setSelectedHistory(job);
                                                                setShowDetailModal(true);
                                                            }}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                                                        {job.company}
                                                                    </h6>
                                                                    <small className="text-muted">
                                                                        {formatDate(job.apply_date)}
                                                                    </small>
                                                                </div>
                                                                {job.category && (
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            backgroundColor: "#e8f4fd",
                                                                            color: "#3498db",
                                                                            padding: "4px 10px",
                                                                            borderRadius: "20px",
                                                                            fontSize: "0.75rem",
                                                                        }}
                                                                    >
                                                                        {job.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="d-flex flex-wrap mt-2" style={{ gap: "6px" }}>
                                                                {(job.positions || []).map((pos, idx) => {
                                                                    const status = getStatusBadge(pos.status);
                                                                    return (
                                                                        <span
                                                                            key={idx}
                                                                            style={{
                                                                                fontSize: "0.8rem",
                                                                                color: status.color,
                                                                                backgroundColor: status.bg,
                                                                                padding: "3px 8px",
                                                                                borderRadius: "6px",
                                                                            }}
                                                                        >
                                                                            <i className={`fas ${status.icon} mr-1`}></i>
                                                                            {pos.position}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                    <div className="card-body text-center py-5">
                                        <div className="d-flex justify-content-center mb-3">
                                            <i className="fas fa-briefcase fa-4x text-muted"></i>
                                        </div>
                                        <h5 className="text-muted">Belum Ada Riwayat Pekerjaan</h5>
                                        <p className="text-muted">
                                            Riwayat pekerjaan akan muncul setelah lamaran Anda diproses (diterima/ditolak)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Application History Tab */}
            {activeTab === "application" && (
                <>
                    {/* Statistics Cards */}
                    {applicationHistory && (
                        <div className="row mb-4">
                            <div className="col-md-4 col-6 mb-3">
                                <div
                                    className="card border-0 shadow-sm text-center p-3"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <div
                                        className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            borderRadius: "12px",
                                            backgroundColor: "#fff3cd",
                                        }}
                                    >
                                        <i className="fas fa-clock" style={{ color: "#f39c12", fontSize: "20px" }}></i>
                                    </div>
                                    <h4 className="mb-0 fw-bold" style={{ color: "#f39c12" }}>{appStats.pending}</h4>
                                    <small className="text-muted">Pending</small>
                                </div>
                            </div>
                            <div className="col-md-4 col-6 mb-3">
                                <div
                                    className="card border-0 shadow-sm text-center p-3"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <div
                                        className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            borderRadius: "12px",
                                            backgroundColor: "#d4edda",
                                        }}
                                    >
                                        <i className="fas fa-check-circle" style={{ color: "#28a745", fontSize: "20px" }}></i>
                                    </div>
                                    <h4 className="mb-0 fw-bold" style={{ color: "#28a745" }}>{appStats.accepted}</h4>
                                    <small className="text-muted">Diterima</small>
                                </div>
                            </div>
                            <div className="col-md-4 col-6 mb-3">
                                <div
                                    className="card border-0 shadow-sm text-center p-3"
                                    style={{ borderRadius: "12px" }}
                                >
                                    <div
                                        className="d-flex align-items-center justify-content-center mx-auto mb-2"
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            borderRadius: "12px",
                                            backgroundColor: "#f8d7da",
                                        }}
                                    >
                                        <i className="fas fa-times-circle" style={{ color: "#dc3545", fontSize: "20px" }}></i>
                                    </div>
                                    <h4 className="mb-0 fw-bold" style={{ color: "#dc3545" }}>{appStats.rejected}</h4>
                                    <small className="text-muted">Ditolak</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Application History by Status */}
                    {applicationHistory ? (
                        <div className="row">
                            {/* Pending Section */}
                            <div className="col-12 mb-4">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                    <div
                                        className="card-header bg-white border-0 pt-4 pb-3"
                                        style={{
                                            borderRadius: "12px 12px 0 0",
                                            borderBottom: "2px solid #f39c12",
                                        }}
                                    >
                                        <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                            <span
                                                className="badge mr-2"
                                                style={{
                                                    backgroundColor: "#fff3cd",
                                                    color: "#856404",
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                }}
                                            >
                                                {appStats.pending}
                                            </span>
                                            <i className="fas fa-clock text-warning mr-2"></i>
                                            Pending
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {applicationHistory.pending?.items?.length > 0 ? (
                                            applicationHistory.pending.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="d-flex align-items-center justify-content-between p-3 mb-2"
                                                    style={{
                                                        backgroundColor: "#fffdf5",
                                                        borderRadius: "8px",
                                                        border: "1px solid #f39c1215",
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="d-flex align-items-center justify-content-center mr-3"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                borderRadius: "8px",
                                                                backgroundColor: "#fff3cd",
                                                            }}
                                                        >
                                                            <i className="fas fa-clock text-warning"></i>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                                                                {item.position}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">{item.company}</small>
                                                        </div>
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatDateShort(item.date)}
                                                    </small>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted text-center py-3 mb-0">
                                                Tidak ada aplikasi pending
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Accepted Section */}
                            <div className="col-12 mb-4">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                    <div
                                        className="card-header bg-white border-0 pt-4 pb-3"
                                        style={{
                                            borderRadius: "12px 12px 0 0",
                                            borderBottom: "2px solid #28a745",
                                        }}
                                    >
                                        <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                            <span
                                                className="badge mr-2"
                                                style={{
                                                    backgroundColor: "#d4edda",
                                                    color: "#155724",
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                }}
                                            >
                                                {appStats.accepted}
                                            </span>
                                            <i className="fas fa-check-circle text-success mr-2"></i>
                                            Diterima
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {applicationHistory.accepted?.items?.length > 0 ? (
                                            applicationHistory.accepted.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="d-flex align-items-center justify-content-between p-3 mb-2"
                                                    style={{
                                                        backgroundColor: "#f5fff5",
                                                        borderRadius: "8px",
                                                        border: "1px solid #28a74515",
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="d-flex align-items-center justify-content-center mr-3"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                borderRadius: "8px",
                                                                backgroundColor: "#d4edda",
                                                            }}
                                                        >
                                                            <i className="fas fa-check-circle text-success"></i>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                                                                {item.position}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">{item.company}</small>
                                                        </div>
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatDateShort(item.date)}
                                                    </small>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted text-center py-3 mb-0">
                                                Tidak ada aplikasi diterima
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rejected Section */}
                            <div className="col-12 mb-4">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                    <div
                                        className="card-header bg-white border-0 pt-4 pb-3"
                                        style={{
                                            borderRadius: "12px 12px 0 0",
                                            borderBottom: "2px solid #dc3545",
                                        }}
                                    >
                                        <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                            <span
                                                className="badge mr-2"
                                                style={{
                                                    backgroundColor: "#f8d7da",
                                                    color: "#721c24",
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                }}
                                            >
                                                {appStats.rejected}
                                            </span>
                                            <i className="fas fa-times-circle text-danger mr-2"></i>
                                            Ditolak
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        {applicationHistory.rejected?.items?.length > 0 ? (
                                            applicationHistory.rejected.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="d-flex align-items-center justify-content-between p-3 mb-2"
                                                    style={{
                                                        backgroundColor: "#fff5f5",
                                                        borderRadius: "8px",
                                                        border: "1px solid #dc354515",
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="d-flex align-items-center justify-content-center mr-3"
                                                            style={{
                                                                width: "35px",
                                                                height: "35px",
                                                                borderRadius: "8px",
                                                                backgroundColor: "#f8d7da",
                                                            }}
                                                        >
                                                            <i className="fas fa-times-circle text-danger"></i>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                                                                {item.position}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">{item.company}</small>
                                                        </div>
                                                    </div>
                                                    <small className="text-muted">
                                                        {formatDateShort(item.date)}
                                                    </small>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted text-center py-3 mb-0">
                                                Tidak ada aplikasi ditolak
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="row">
                            <div className="col-12">
                                <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                    <div className="card-body text-center py-5">
                                        <div className="d-flex justify-content-center mb-3">
                                            <i className="fas fa-file-alt fa-4x text-muted"></i>
                                        </div>
                                        <h5 className="text-muted">Belum Ada Riwayat Aplikasi</h5>
                                        <p className="text-muted">
                                            Riwayat aplikasi akan muncul setelah Anda melamar pekerjaan
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedHistory && (
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
                            width: "600px",
                            maxWidth: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                    <h5 className="text-white mb-1 fw-bold">
                                        {selectedHistory.company}
                                    </h5>
                                    <p className="text-white mb-0" style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                                        <i className="fas fa-calendar-alt mr-1"></i>
                                        {formatDate(selectedHistory.apply_date)}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-sm btn-light"
                                    onClick={() => setShowDetailModal(false)}
                                    style={{ borderRadius: "50%", width: "35px", height: "35px" }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            {selectedHistory.category && (
                                <span
                                    className="badge mt-2"
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                    }}
                                >
                                    {selectedHistory.category}
                                </span>
                            )}
                        </div>

                        {/* Modal Body */}
                        <div className="p-4">
                            <h6 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
                                <i className="fas fa-list-check mr-2" style={{ color: "#2ecc71" }}></i>
                                Detail Posisi
                            </h6>

                            {(selectedHistory.positions || []).map((pos, index) => {
                                const status = getStatusBadge(pos.status);
                                return (
                                    <div
                                        key={index}
                                        className="d-flex align-items-center justify-content-between p-3 mb-2"
                                        style={{
                                            backgroundColor: status.bg,
                                            borderRadius: "8px",
                                            border: `1px solid ${status.color}30`,
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="d-flex align-items-center justify-content-center mr-3"
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "white",
                                                }}
                                            >
                                                <i
                                                    className={`fas ${status.icon}`}
                                                    style={{ color: status.color, fontSize: "18px" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                                                    {pos.position}
                                                </span>
                                                <br />
                                                <small style={{ color: status.color }}>
                                                    {formatDate(pos.date)}
                                                </small>
                                            </div>
                                        </div>
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: status.bg,
                                                color: status.color,
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                fontSize: "0.85rem",
                                                fontWeight: "600",
                                                border: `2px solid ${status.color}`,
                                            }}
                                        >
                                            <i className={`fas ${status.icon} mr-1`}></i>
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}

                            <div className="text-right mt-3">
                                <button
                                    className="btn btn-light"
                                    onClick={() => setShowDetailModal(false)}
                                    style={{ borderRadius: "8px" }}
                                >
                                    <i className="fas fa-times mr-2"></i>Tutup
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
                        <div
                            className="card-header bg-white border-0 pt-4 pb-3"
                            style={{ borderRadius: "12px 12px 0 0" }}
                        >
                            <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50", fontSize: "1rem" }}>
                                <i className="fas fa-info-circle text-info mr-2"></i>Tentang Riwayat
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#e8f4fd",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-briefcase text-primary"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                                                Riwayat Pekerjaan
                                            </p>
                                            <small style={{ color: "#888" }}>
                                                Menampilkan lamaran yang sudah selesai diproses (diterima/ditolak)
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#e8f8f5",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-file-alt text-success"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                                                Riwayat Aplikasi
                                            </p>
                                            <small style={{ color: "#888" }}>
                                                Menampilkan semua riwayat lamaran termasuk yang masih pending
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SocietyLayouts>
    );
}