import React, { useState, useEffect } from "react";
import SocietyLayouts from "../../layouts/SocietyLayouts";
import api from "../../../services/api";

export default function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // State untuk filter
    const [activeFilter, setActiveFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("");

    // State untuk pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // State untuk loading indikator per notifikasi
    const [markReadLoading, setMarkReadLoading] = useState({});
    const [markAllLoading, setMarkAllLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, [activeFilter, currentPage]);

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: 10,
            };

            // Set filter params
            if (activeFilter === "unread") {
                params.is_read = 0;
            } else if (activeFilter === "application") {
                params.type = "application";
            } else if (activeFilter === "validation") {
                params.type = "validation";
            } else if (activeFilter === "system") {
                params.type = "system";
            }

            if (typeFilter) {
                params.type = typeFilter;
            }

            const response = await api.get("/society/notifications", { params });
            
            // Log response untuk debugging
            console.log("Notification response:", response.data);
            
            // Gunakan fallback values
            const responseData = response?.data?.data;
            
            if (responseData) {
                setNotifications(responseData.data || responseData || []);
                setCurrentPage(responseData.current_page || 1);
                setLastPage(responseData.last_page || 1);
            } else {
                // Jika responseData null/undefined, gunakan array kosong
                setNotifications([]);
                setCurrentPage(1);
                setLastPage(1);
            }
            
            setUnreadCount(response?.data?.unread_count || 0);
            setError("");
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError("Gagal memuat notifikasi");
            // Set default values on error
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };


    // Mark single notification as read
    const handleMarkAsRead = async (notificationId) => {
        setMarkReadLoading((prev) => ({ ...prev, [notificationId]: true }));
        try {
            await api.patch(`/society/notifications/${notificationId}/read`);
            
            // Update local state
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            showSuccessBanner("Notifikasi ditandai sudah dibaca");
        } catch (err) {
            console.log(err);
            setError("Gagal menandai notifikasi");
        } finally {
            setMarkReadLoading((prev) => ({ ...prev, [notificationId]: false }));
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        setMarkAllLoading(true);
        try {
            await api.patch("/society/notifications/read-all");
            
            // Update local state
            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, is_read: true }))
            );
            setUnreadCount(0);
            showSuccessBanner("Semua notifikasi ditandai sudah dibaca");
        } catch (err) {
            console.log(err);
            setError("Gagal menandai semua notifikasi");
        } finally {
            setMarkAllLoading(false);
        }
    };

    // Format relative time (e.g., "2 jam yang lalu")
    const getRelativeTime = (dateString) => {
        if (!dateString) return "-";
        
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMinutes < 1) return "Baru saja";
        if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "application":
                return {
                    icon: "fa-file-alt",
                    color: "#3498db",
                    bg: "#e8f4fd",
                    label: "Lamaran",
                };
            case "validation":
                return {
                    icon: "fa-clipboard-check",
                    color: "#2ecc71",
                    bg: "#e8f8f5",
                    label: "Validasi",
                };
            case "system":
                return {
                    icon: "fa-cog",
                    color: "#9b59b6",
                    bg: "#f3eef8",
                    label: "Sistem",
                };
            default:
                return {
                    icon: "fa-bell",
                    color: "#f39c12",
                    bg: "#fef9e7",
                    label: "Umum",
                };
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Clear all filters
    const clearFilters = () => {
        setActiveFilter("all");
        setTypeFilter("");
        setCurrentPage(1);
    };

    if (loading && notifications.length === 0) {
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
                        <p className="text-muted">Memuat notifikasi...</p>
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
                                <div className="d-flex align-items-center">
                                    <div
                                        className="d-flex align-items-center justify-content-center mr-3"
                                        style={{
                                            width: "55px",
                                            height: "55px",
                                            borderRadius: "14px",
                                            backgroundColor: "#e8f4fd",
                                        }}
                                    >
                                        <i
                                            className="fas fa-bell"
                                            style={{ color: "#3498db", fontSize: "24px" }}
                                        ></i>
                                    </div>
                                    <div>
                                        <h5 className="mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                                            Notifikasi
                                        </h5>
                                        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                            {unreadCount > 0
                                                ? `Anda memiliki ${unreadCount} notifikasi belum dibaca`
                                                : "Semua notifikasi sudah dibaca"}
                                        </p>
                                    </div>
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={handleMarkAllAsRead}
                                        disabled={markAllLoading}
                                        style={{ borderRadius: "10px", padding: "10px 20px" }}
                                    >
                                        {markAllLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check-double mr-2"></i>
                                                Tandai Semua Dibaca
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex flex-wrap" style={{ gap: "8px" }}>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveFilter("all");
                                setTypeFilter("");
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: activeFilter === "all" && !typeFilter ? "#3498db" : "#f8f9fa",
                                color: activeFilter === "all" && !typeFilter ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-inbox mr-2"></i>Semua
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveFilter("unread");
                                setTypeFilter("");
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: activeFilter === "unread" ? "#e74c3c" : "#f8f9fa",
                                color: activeFilter === "unread" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-envelope mr-2"></i>Belum Dibaca
                            {unreadCount > 0 && (
                                <span
                                    className="badge ml-1"
                                    style={{
                                        backgroundColor: "white",
                                        color: "#e74c3c",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveFilter("application");
                                setTypeFilter("application");
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: activeFilter === "application" ? "#3498db" : "#f8f9fa",
                                color: activeFilter === "application" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-file-alt mr-2"></i>Lamaran
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveFilter("validation");
                                setTypeFilter("validation");
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: activeFilter === "validation" ? "#2ecc71" : "#f8f9fa",
                                color: activeFilter === "validation" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-clipboard-check mr-2"></i>Validasi
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                setActiveFilter("system");
                                setTypeFilter("system");
                                setCurrentPage(1);
                            }}
                            style={{
                                borderRadius: "20px",
                                padding: "8px 20px",
                                backgroundColor: activeFilter === "system" ? "#9b59b6" : "#f8f9fa",
                                color: activeFilter === "system" ? "white" : "#6c757d",
                                border: "none",
                                fontWeight: "600",
                                fontSize: "0.9rem",
                            }}
                        >
                            <i className="fas fa-cog mr-2"></i>Sistem
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-0">
                            {notifications.length > 0 ? (
                                <>
                                    {notifications.map((notification, index) => {
                                        const notifIcon = getNotificationIcon(notification.type);
                                        const isUnread = !notification.is_read;

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`d-flex align-items-start p-4 ${
                                                    index < notifications.length - 1
                                                        ? ""
                                                        : ""
                                                }`}
                                                style={{
                                                    backgroundColor: isUnread ? "#f8faff" : "white",
                                                    borderBottom:
                                                        index < notifications.length - 1
                                                            ? "1px solid #f0f0f0"
                                                            : "none",
                                                    borderLeft: isUnread ? "4px solid #3498db" : "4px solid transparent",
                                                    transition: "background-color 0.2s",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => {
                                                    if (isUnread) {
                                                        handleMarkAsRead(notification.id);
                                                    }
                                                }}
                                            >
                                                {/* Icon */}
                                                <div
                                                    className="d-flex align-items-center justify-content-center mr-3"
                                                    style={{
                                                        width: "45px",
                                                        height: "45px",
                                                        borderRadius: "12px",
                                                        backgroundColor: notifIcon.bg,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <i
                                                        className={`fas ${notifIcon.icon}`}
                                                        style={{
                                                            color: notifIcon.color,
                                                            fontSize: "20px",
                                                        }}
                                                    ></i>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6
                                                                className={`mb-1 ${
                                                                    isUnread ? "fw-bold" : ""
                                                                }`}
                                                                style={{
                                                                    color: "#2c3e50",
                                                                    fontSize: "0.95rem",
                                                                }}
                                                            >
                                                                {notification.title}
                                                            </h6>
                                                            <p
                                                                className="mb-1"
                                                                style={{
                                                                    color: "#666",
                                                                    fontSize: "0.85rem",
                                                                    lineHeight: "1.5",
                                                                }}
                                                            >
                                                                {notification.message}
                                                            </p>
                                                            <div className="d-flex align-items-center mt-1">
                                                                <small className="text-muted">
                                                                    <i className="far fa-clock mr-1"></i>
                                                                    {getRelativeTime(notification.created_at)}
                                                                </small>
                                                                <span
                                                                    className="badge ml-2"
                                                                    style={{
                                                                        backgroundColor: notifIcon.bg,
                                                                        color: notifIcon.color,
                                                                        fontSize: "0.7rem",
                                                                        padding: "3px 8px",
                                                                        borderRadius: "10px",
                                                                    }}
                                                                >
                                                                    {notifIcon.label}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="d-flex align-items-center ml-3">
                                                            {isUnread && (
                                                                <>
                                                                    <div
                                                                        style={{
                                                                            width: "10px",
                                                                            height: "10px",
                                                                            borderRadius: "50%",
                                                                            backgroundColor: "#3498db",
                                                                            marginRight: "12px",
                                                                        }}
                                                                    ></div>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMarkAsRead(notification.id);
                                                                        }}
                                                                        disabled={markReadLoading[notification.id]}
                                                                        style={{
                                                                            borderRadius: "8px",
                                                                            backgroundColor: "#e8f4fd",
                                                                            color: "#3498db",
                                                                            border: "none",
                                                                            fontSize: "0.8rem",
                                                                        }}
                                                                    >
                                                                        {markReadLoading[notification.id] ? (
                                                                            <i className="fas fa-spinner fa-spin"></i>
                                                                        ) : (
                                                                            <>
                                                                                <i className="fas fa-check mr-1"></i>
                                                                                Tandai Dibaca
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </>
                                                            )}
                                                            {!isUnread && (
                                                                <i
                                                                    className="fas fa-check-circle"
                                                                    style={{ color: "#bdc3c7", fontSize: "18px" }}
                                                                ></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {lastPage > 1 && (
                                        <div className="d-flex justify-content-center align-items-center p-4 border-top">
                                            <button
                                                className="btn btn-light mr-2"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                            <div className="d-flex" style={{ gap: "5px" }}>
                                                {Array.from({ length: lastPage }, (_, i) => i + 1).map(
                                                    (page) => (
                                                        <button
                                                            key={page}
                                                            className="btn"
                                                            onClick={() => handlePageChange(page)}
                                                            style={{
                                                                borderRadius: "8px",
                                                                backgroundColor:
                                                                    currentPage === page
                                                                        ? "#3498db"
                                                                        : "#f8f9fa",
                                                                color:
                                                                    currentPage === page
                                                                        ? "white"
                                                                        : "#6c757d",
                                                                border: "none",
                                                                width: "40px",
                                                                fontWeight: "600",
                                                            }}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-light ml-2"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === lastPage}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-5">
                                    <div className="d-flex justify-content-center mb-3">
                                        <div
                                            className="d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "100px",
                                                height: "100px",
                                                borderRadius: "50%",
                                                backgroundColor: "#f0f4f8",
                                            }}
                                        >
                                            <i
                                                className="far fa-bell fa-3x"
                                                style={{ color: "#bdc3c7" }}
                                            ></i>
                                        </div>
                                    </div>
                                    <h5 className="text-muted">Tidak Ada Notifikasi</h5>
                                    <p className="text-muted mb-3">
                                        {activeFilter !== "all"
                                            ? `Tidak ada notifikasi dengan filter yang dipilih`
                                            : "Anda belum memiliki notifikasi apapun"}
                                    </p>
                                    {activeFilter !== "all" && (
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={clearFilters}
                                            style={{ borderRadius: "8px" }}
                                        >
                                            <i className="fas fa-redo mr-2"></i>Reset Filter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                        <div
                            className="card-header bg-white border-0 pt-4 pb-3"
                            style={{ borderRadius: "12px 12px 0 0" }}
                        >
                            <h6 className="mb-0 fw-bold" style={{ color: "#2c3e50", fontSize: "1rem" }}>
                                <i className="fas fa-info-circle text-info mr-2"></i>Tentang Notifikasi
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3 col-6 mb-3">
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
                                            <i className="fas fa-file-alt text-primary"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                                                Lamaran
                                            </p>
                                            <small style={{ color: "#888", fontSize: "0.75rem" }}>
                                                Status lamaran
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 col-6 mb-3">
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
                                            <i className="fas fa-clipboard-check text-success"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                                                Validasi
                                            </p>
                                            <small style={{ color: "#888", fontSize: "0.75rem" }}>
                                                Status validasi
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 col-6 mb-3">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="mr-3"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "10px",
                                                backgroundColor: "#f3eef8",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i className="fas fa-cog text-purple"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                                                Sistem
                                            </p>
                                            <small style={{ color: "#888", fontSize: "0.75rem" }}>
                                                Info sistem
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 col-6 mb-3">
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
                                            <i className="fas fa-dot-circle text-primary"></i>
                                        </div>
                                        <div>
                                            <p className="mb-0" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                                                Indikator Biru
                                            </p>
                                            <small style={{ color: "#888", fontSize: "0.75rem" }}>
                                                Notifikasi belum dibaca
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