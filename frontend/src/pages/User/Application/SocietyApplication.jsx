import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function SocietyApplication() {
    // State untuk data aplikasi
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // State untuk filter status
    const [statusFilter, setStatusFilter] = useState(""); // '' | 'pending' | 'accepted' | 'rejected'

    // State untuk detail aplikasi
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    // State untuk cancel/withdraw modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(""); // 'cancel' | 'withdraw'
    const [confirmLoading, setConfirmLoading] = useState(false);

    // State untuk statistik
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
    });

    useEffect(() => {
        fetchApplications();
    }, [statusFilter]);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    // Fetch semua aplikasi
    const fetchApplications = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            
            const response = await api.get("/society/applications", { params });
            const vacancies = response.data.vacancies || [];
            setApplications(vacancies);
            
            // Hitung statistik
            calculateStats(vacancies);
            setError("");
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError("Gagal memuat data lamaran");
        } finally {
            setLoading(false);
        }
    };

    // Hitung statistik aplikasi
    const calculateStats = (vacancies) => {
        let total = 0;
        let pending = 0;
        let accepted = 0;
        let rejected = 0;

        vacancies.forEach((vacancy) => {
            (vacancy.positions || []).forEach((pos) => {
                total++;
                if (pos.apply_status === "pending") pending++;
                else if (pos.apply_status === "accepted") accepted++;
                else if (pos.apply_status === "rejected") rejected++;
            });
        });

        setStats({ total, pending, accepted, rejected });
    };

    // Lihat detail aplikasi
    const viewApplicationDetail = async (applicationId) => {
        try {
            setDetailLoading(true);
            const response = await api.get(`/society/applications/${applicationId}`);
            setSelectedApplication(response.data.data);
            setShowDetailModal(true);
        } catch (err) {
            console.log(err);
            setError("Gagal memuat detail lamaran");
        } finally {
            setDetailLoading(false);
        }
    };

    // Cancel aplikasi
    const handleCancelApplication = async () => {
        setConfirmLoading(true);
        try {
            const response = await api.delete(`/society/applications/${selectedApplication?.id}/cancel`);
            setShowConfirmModal(false);
            setShowDetailModal(false);
            showSuccessBanner(response.data.message || "Lamaran berhasil dibatalkan!");
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.message || "Gagal membatalkan lamaran");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Withdraw aplikasi
    const handleWithdrawApplication = async () => {
        setConfirmLoading(true);
        try {
            const response = await api.post(`/society/applications/${selectedApplication?.id}/withdraw`);
            setShowConfirmModal(false);
            setShowDetailModal(false);
            showSuccessBanner(response.data.message || "Lamaran berhasil ditarik!");
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.message || "Gagal menarik lamaran");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Buka modal konfirmasi
    const openConfirmModal = (action) => {
        setConfirmAction(action);
        setShowConfirmModal(true);
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

    // Cek apakah aplikasi bisa dicancel (semua posisi masih pending)
    const canCancel = (positions) => {
        if (!positions || positions.length === 0) return true;
        return positions.every((pos) => pos.apply_status === "pending");
    };

    // Cek apakah ada posisi yang sudah diterima
    const hasAcceptedPosition = (positions) => {
        if (!positions || positions.length === 0) return false;
        return positions.some((pos) => pos.apply_status === "accepted");
    };

    if (loading && applications.length === 0) {
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
                        <p className="text-muted">Memuat data lamaran...</p>
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
                                <div>
                                    <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                        <i className="fas fa-file-alt text-primary mr-2"></i>
                                        Lamaran Saya
                                    </h5>
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Pantau status lamaran pekerjaan Anda
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-3 col-6 mb-3">
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
                            <i className="fas fa-briefcase" style={{ color: "#3498db", fontSize: "20px" }}></i>
                        </div>
                        <h4 className="mb-0 fw-bold" style={{ color: "#3498db" }}>{stats.total}</h4>
                        <small className="text-muted">Total Lamaran</small>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
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
                        <h4 className="mb-0 fw-bold" style={{ color: "#f39c12" }}>{stats.pending}</h4>
                        <small className="text-muted">Pending</small>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
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
                        <h4 className="mb-0 fw-bold" style={{ color: "#28a745" }}>{stats.accepted}</h4>
                        <small className="text-muted">Diterima</small>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
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
                        <h4 className="mb-0 fw-bold" style={{ color: "#dc3545" }}>{stats.rejected}</h4>
                        <small className="text-muted">Ditolak</small>
                    </div>
                </div>
            </div>

            {/* Filter Status */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
                        <button
                            className="btn"
                            onClick={() => setStatusFilter("")}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: statusFilter === "" ? "#3498db" : "#f8f9fa",
                                color: statusFilter === "" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-list mr-2"></i>Semua
                        </button>
                        <button
                            className="btn"
                            onClick={() => setStatusFilter("pending")}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: statusFilter === "pending" ? "#f39c12" : "#f8f9fa",
                                color: statusFilter === "pending" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-clock mr-2"></i>Pending
                        </button>
                        <button
                            className="btn"
                            onClick={() => setStatusFilter("accepted")}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: statusFilter === "accepted" ? "#28a745" : "#f8f9fa",
                                color: statusFilter === "accepted" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-check-circle mr-2"></i>Diterima
                        </button>
                        <button
                            className="btn"
                            onClick={() => setStatusFilter("rejected")}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: statusFilter === "rejected" ? "#dc3545" : "#f8f9fa",
                                color: statusFilter === "rejected" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-times-circle mr-2"></i>Ditolak
                        </button>
                    </div>
                </div>
            </div>

            {/* Applications List */}
            <div className="row">
                {applications.length > 0 ? (
                    applications.map((vacancy) => (
                        <div className="col-lg-6 mb-4" key={vacancy.id}>
                            <div
                                className="card border-0 shadow-sm h-100"
                                style={{
                                    borderRadius: "12px",
                                    transition: "transform 0.2s, box-shadow 0.2s",
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
                                                {vacancy.company}
                                            </h6>
                                            <small className="text-muted">
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {vacancy.address || "Lokasi tidak tersedia"}
                                            </small>
                                        </div>
                                        {vacancy.category && (
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
                                                {vacancy.category.job_category}
                                            </span>
                                        )}
                                    </div>

                                    {/* Applied Positions */}
                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-2">
                                            <i className="fas fa-users mr-1"></i>Posisi Dilamar:
                                        </small>
                                        <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
                                            {(vacancy.positions || []).map((pos) => {
                                                const status = getStatusBadge(pos.apply_status);
                                                return (
                                                    <div
                                                        key={pos.id}
                                                        className="d-flex align-items-center"
                                                        style={{
                                                            backgroundColor: status.bg,
                                                            borderRadius: "8px",
                                                            padding: "6px 10px",
                                                            border: `1px solid ${status.color}30`,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontSize: "0.85rem",
                                                                fontWeight: "600",
                                                                color: "#333",
                                                                marginRight: "8px",
                                                            }}
                                                        >
                                                            {pos.position}
                                                        </span>
                                                        <span
                                                            className="badge"
                                                            style={{
                                                                backgroundColor: status.bg,
                                                                color: status.color,
                                                                fontSize: "0.7rem",
                                                                padding: "3px 8px",
                                                            }}
                                                        >
                                                            <i className={`fas ${status.icon} mr-1`}></i>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Apply Date */}
                                    <div className="mb-3">
                                        <small className="text-muted">
                                            <i className="fas fa-calendar-alt mr-1"></i>
                                            Dilamar pada: {formatDate(vacancy.apply_date)}
                                        </small>
                                    </div>

                                    {/* Action Button */}
                                    <div className="text-right">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => viewApplicationDetail(vacancy.application_id)}
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
                                    <i className="fas fa-file-alt fa-4x text-muted"></i>
                                </div>
                                <h5 className="text-muted">Belum Ada Lamaran</h5>
                                <p className="text-muted">
                                    {statusFilter
                                        ? `Tidak ada lamaran dengan status ${statusFilter}`
                                        : "Anda belum melamar pekerjaan apapun"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedApplication && (
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
                                            <h5 className="text-white mb-1 fw-bold">
                                                {selectedApplication.vacancy?.company}
                                            </h5>
                                            <p className="text-white mb-0" style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {selectedApplication.vacancy?.address}
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
                                    {selectedApplication.vacancy?.category && (
                                        <span
                                            className="badge mt-2"
                                            style={{
                                                backgroundColor: "rgba(255,255,255,0.2)",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                            }}
                                        >
                                            {selectedApplication.vacancy.category.job_category}
                                        </span>
                                    )}
                                </div>

                                {/* Modal Body */}
                                <div className="p-4">
                                    {/* Application Info */}
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                                <i className="fas fa-calendar-alt mr-1"></i>Tanggal Melamar
                                            </label>
                                            <p style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                                                {formatDate(selectedApplication.date)}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <label style={{ color: "#888", fontSize: "0.8rem" }}>
                                                <i className="fas fa-id-card mr-1"></i>ID Lamaran
                                            </label>
                                            <p style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                                                #{selectedApplication.id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedApplication.notes && (
                                        <div className="mb-4">
                                            <h6 className="fw-bold mb-2" style={{ color: "#2c3e50" }}>
                                                <i className="fas fa-sticky-note mr-2" style={{ color: "#e67e22" }}></i>
                                                Catatan Lamaran
                                            </h6>
                                            <p className="text-muted" style={{ lineHeight: "1.8", fontStyle: "italic" }}>
                                                "{selectedApplication.notes}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Positions Status */}
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
                                            <i className="fas fa-list-check mr-2" style={{ color: "#2ecc71" }}></i>
                                            Status Posisi
                                        </h6>
                                        <div className="row">
                                            {(selectedApplication.positions || []).map((pos) => {
                                                const status = getStatusBadge(pos.status);
                                                return (
                                                    <div className="col-12 mb-2" key={pos.id}>
                                                        <div
                                                            className="d-flex align-items-center justify-content-between p-3"
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
                                                                        style={{
                                                                            color: status.color,
                                                                            fontSize: "18px",
                                                                        }}
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
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="text-right">
                                        {canCancel(selectedApplication.positions) && (
                                            <button
                                                className="btn btn-danger mr-2"
                                                onClick={() => openConfirmModal("cancel")}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                <i className="fas fa-trash mr-2"></i>Batalkan Lamaran
                                            </button>
                                        )}
                                        {hasAcceptedPosition(selectedApplication.positions) && (
                                            <button
                                                className="btn btn-warning"
                                                onClick={() => openConfirmModal("withdraw")}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                <i className="fas fa-undo mr-2"></i>Tarik Lamaran
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-light ml-2"
                                            onClick={() => setShowDetailModal(false)}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-times mr-2"></i>Tutup
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Modal (Cancel/Withdraw) */}
            {showConfirmModal && (
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
                    onClick={() => setShowConfirmModal(false)}
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
                                className={`fas fa-${confirmAction === "cancel" ? "trash" : "undo"}`}
                                style={{
                                    fontSize: "48px",
                                    color: confirmAction === "cancel" ? "#dc3545" : "#f39c12",
                                    backgroundColor:
                                        confirmAction === "cancel" ? "#f8d7da" : "#fff3cd",
                                    padding: "16px",
                                    borderRadius: "50%",
                                }}
                            />
                        </div>
                        <h5 style={{ marginBottom: "12px", fontWeight: "bold", color: "#333" }}>
                            {confirmAction === "cancel"
                                ? "Batalkan Lamaran?"
                                : "Tarik Lamaran?"}
                        </h5>
                        <p style={{ color: "#666", marginBottom: "24px" }}>
                            {confirmAction === "cancel"
                                ? "Lamaran yang dibatalkan akan dihapus permanen."
                                : "Lamaran yang ditarik akan ditandai sebagai ditolak. Tindakan ini tidak dapat dibatalkan."}
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="btn btn-light"
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                                disabled={confirmLoading}
                            >
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button
                                onClick={
                                    confirmAction === "cancel"
                                        ? handleCancelApplication
                                        : handleWithdrawApplication
                                }
                                disabled={confirmLoading}
                                className={`btn btn-${confirmAction === "cancel" ? "danger" : "warning"}`}
                                style={{ padding: "10px 24px", borderRadius: "8px" }}
                            >
                                {confirmLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>Memproses...
                                    </>
                                ) : (
                                    <>
                                        <i
                                            className={`fas fa-${confirmAction === "cancel" ? "trash" : "undo"} mr-2`}
                                        ></i>
                                        Ya, {confirmAction === "cancel" ? "Batalkan" : "Tarik"}
                                    </>
                                )}
                            </button>
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
                                <i className="fas fa-info-circle text-info mr-2"></i>Informasi Status Lamaran
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#fff3cd",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-clock text-warning"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                                                Status Pending
                                            </p>
                                            <small style={{ color: "#888" }}>
                                                Lamaran sedang diproses oleh perusahaan
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#d4edda",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-check-circle text-success"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                                                Diterima
                                            </p>
                                            <small style={{ color: "#888" }}>
                                                Selamat! Lamaran Anda diterima
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#f8d7da",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-times-circle text-danger"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                                                Ditolak
                                            </p>
                                            <small style={{ color: "#888" }}>
                                                Lamaran tidak memenuhi kriteria
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