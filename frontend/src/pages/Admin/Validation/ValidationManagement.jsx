import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function ValidationManagement() {
    // Data states
    const [validationList, setValidationList] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [setError] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(15);
    
    // Filter states
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDateFrom, setFilterDateFrom] = useState("");
    const [filterDateTo, setFilterDateTo] = useState("");
    
    // Sort states
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [ setSelectedValidation] = useState(null);
    const [validationDetail, setValidationDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        fetchValidationList();
        fetchStats();
    }, [currentPage, filterStatus, filterDateFrom, filterDateTo, sortBy, sortOrder]);

    const fetchValidationList = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                sort_by: sortBy,
                sort_order: sortOrder
            };
            
            if (searchTerm) params.search = searchTerm;
            if (filterStatus) params.status = filterStatus;
            if (filterDateFrom) params.date_from = filterDateFrom;
            if (filterDateTo) params.date_to = filterDateTo;
            
            const res = await api.get("/admin/validations", { params });
            setValidationList(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
        } catch (err) {
            console.error("Failed to fetch validations:", err);
            setError(err.response?.data?.message || "Gagal memuat data validasi");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get("/admin/validations/stats");
            setStats(res.data.data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchValidationDetail = async (id) => {
        try {
            setLoadingDetail(true);
            const res = await api.get(`/admin/validations/${id}`);
            setValidationDetail(res.data.data);
        } catch (err) {
            console.error("Failed to fetch validation detail:", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = (validation) => {
        setSelectedValidation(validation);
        fetchValidationDetail(validation.id);
        setShowDetailModal(true);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchValidationList();
    };

    const handleResetFilter = () => {
        setSearchTerm("");
        setFilterStatus("");
        setFilterDateFrom("");
        setFilterDateTo("");
        setSortBy("created_at");
        setSortOrder("desc");
        setCurrentPage(1);
    };

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1); pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1); pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...'); pages.push(totalPages);
            }
        }
        return pages;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Disetujui' };
            case 'declined':
                return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
            case 'pending':
            default:
                return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: 'Tertunda' };
        }
    };

    const formatNumber = (num) => {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") || "0";
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Stat Card Component
    const StatCard = ({ title, value, icon, bgColor, subtitle }) => (
        <div className="col-xl-3 col-md-6 mb-4">
            <div 
                className="card border-0 shadow-sm h-100"
                style={{ 
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
            >
                <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div 
                            className="d-flex align-items-center justify-content-center"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                backgroundColor: bgColor || '#e8f0fe'
                            }}
                        >
                            <i className={icon} style={{ fontSize: '22px', color: '#fff' }}></i>
                        </div>
                        <div className="text-right">
                            <h3 className="mb-0 fw-bold" style={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                                {formatNumber(value)}
                            </h3>
                            <small style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
                                {subtitle || 'Total'}
                            </small>
                        </div>
                    </div>
                    <h6 style={{ color: '#555', fontSize: '0.9rem', fontWeight: '600' }}>
                        {title}
                    </h6>
                </div>
            </div>
        </div>
    );

    if (loading && validationList.length === 0) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data validasi...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid px-0">
                {/* Header Gradient */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-clipboard-check mr-2"></i>
                                            Manajemen Validasi
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Kelola dan pantau semua proses validasi pencari kerja
                                        </p>
                                    </div>
                                    <div className="d-none d-md-block">
                                        <i className="fas fa-check-double text-white" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="row">
                    <StatCard 
                        title="Total Validasi"
                        value={stats?.total}
                        icon="fas fa-clipboard-list"
                        bgColor="#3498db"
                        subtitle="Keseluruhan"
                    />
                    <StatCard 
                        title="Tertunda"
                        value={stats?.by_status?.pending}
                        icon="fas fa-clock"
                        bgColor="#f39c12"
                        subtitle="Perlu Diproses"
                    />
                    <StatCard 
                        title="Disetujui"
                        value={stats?.by_status?.accepted}
                        icon="fas fa-check-circle"
                        bgColor="#2ecc71"
                        subtitle="Terverifikasi"
                    />
                    <StatCard 
                        title="Ditolak"
                        value={stats?.by_status?.declined}
                        icon="fas fa-times-circle"
                        bgColor="#e74c3c"
                        subtitle="Dikembalikan"
                    />
                </div>

                {/* Filter & Search Bar */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-3 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-left-0" 
                                        placeholder="Cari nama..."
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} 
                                    />
                                </div>
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <select 
                                    className="form-control" 
                                    value={filterStatus} 
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="pending">Tertunda</option>
                                    <option value="accepted">Disetujui</option>
                                    <option value="declined">Ditolak</option>
                                </select>
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={filterDateFrom} 
                                    onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                                    placeholder="Dari Tanggal"
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={filterDateTo} 
                                    onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                                    placeholder="Sampai Tanggal"
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="col-md-3 text-md-right">
                                <button className="btn btn-primary mr-2" onClick={handleSearch} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-search mr-2"></i>Cari
                                </button>
                                <button className="btn btn-outline-secondary mr-2" onClick={handleResetFilter} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-redo"></i>
                                </button>
                                <button className="btn btn-outline-primary" onClick={fetchValidationList} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PENCA KERJA</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>VALIDATOR</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>KATEGORI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>STATUS</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>TANGGAL</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validationList.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <i className="fas fa-clipboard-check fa-3x text-muted mb-3"></i>
                                                    <span style={{ color: '#888' }}>Belum ada data validasi</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        validationList.map((validation, index) => {
                                            const status = getStatusBadge(validation.status);
                                            return (
                                                <tr key={validation.id}>
                                                    <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                                <i className="fas fa-user mr-2" style={{ color: '#667eea' }}></i>
                                                                {validation.society?.name || '-'}
                                                            </span>
                                                        </div>
                                                        <small style={{ color: '#888', fontSize: '0.78rem' }}>
                                                            <i className="fas fa-id-card mr-1"></i>
                                                            {validation.society?.id_card_number || '-'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {validation.validator ? (
                                                            <span style={{ fontSize: '0.85rem' }}>
                                                                <i className="fas fa-user-check mr-1" style={{ color: '#2ecc71' }}></i>
                                                                {validation.validator.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                                <i className="fas fa-minus-circle mr-1"></i>
                                                                Belum ditugaskan
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '0.85rem' }}>
                                                            <i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>
                                                            {validation.job_category?.job_category || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span 
                                                            className="badge"
                                                            style={{ 
                                                                backgroundColor: status.bg, 
                                                                color: status.color,
                                                                padding: '8px 16px', 
                                                                borderRadius: '20px', 
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                border: `2px solid ${status.color}`
                                                            }}
                                                        >
                                                            <i className={`fas ${status.icon} mr-1`}></i>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', color: '#888' }}>
                                                        {formatDate(validation.created_at)}
                                                    </td>
                                                    <td className="text-center pr-4">
                                                        <button 
                                                            className="btn btn-sm btn-info" 
                                                            onClick={() => handleViewDetail(validation)}
                                                            title="Lihat Detail" 
                                                            style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="card-footer bg-white border-0 pb-4" style={{ borderRadius: '0 0 12px 12px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(1)} style={{ borderRadius: '8px 0 0 8px' }}>
                                                <i className="fas fa-angle-double-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                                <i className="fas fa-angle-left"></i>
                                            </button>
                                        </li>
                                        {getPageNumbers().map((page, index) => (
                                            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { 
                                                        backgroundColor: '#667eea', 
                                                        borderColor: '#667eea', 
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    } : {}}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                                <i className="fas fa-angle-right"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => paginate(totalPages)} style={{ borderRadius: '0 8px 8px 0' }}>
                                                <i className="fas fa-angle-double-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>

                {/* Daily Stats Table */}
                {stats?.daily_stats && stats.daily_stats.length > 0 && (
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                                    <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                                        <i className="fas fa-chart-line text-primary mr-2"></i>
                                        Statistik Harian (30 Hari Terakhir)
                                    </h6>
                                </div>
                                <div className="card-body pt-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Tanggal</th>
                                                    <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Total</th>
                                                    <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Disetujui</th>
                                                    <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Ditolak</th>
                                                    <th className="text-center" style={{ borderTop: 'none', fontSize: '0.85rem', color: '#888' }}>Tertunda</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.daily_stats.map((day, index) => (
                                                    <tr key={index}>
                                                        <td style={{ fontSize: '0.9rem' }}>
                                                            {new Date(day.date).toLocaleDateString('id-ID', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="text-center" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                            {day.total}
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge" style={{ backgroundColor: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '20px' }}>
                                                                {day.accepted}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge" style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '4px 10px', borderRadius: '20px' }}>
                                                                {day.declined}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge" style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '4px 10px', borderRadius: '20px' }}>
                                                                {day.pending}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        }}>
                            <h5 className="modal-title">
                                <i className="fas fa-clipboard-check mr-2"></i>Detail Validasi
                            </h5>
                            <button 
                                className="close-btn text-white" 
                                onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            {loadingDetail ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-3" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    <p className="text-muted">Memuat detail validasi...</p>
                                </div>
                            ) : validationDetail ? (
                                <>
                                    {/* Validation Info Card */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-8">
                                                            <div className="mb-3">
                                                                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>STATUS VALIDASI</h6>
                                                                {(() => {
                                                                    const status = getStatusBadge(validationDetail.status);
                                                                    return (
                                                                        <span 
                                                                            className="badge"
                                                                            style={{ 
                                                                                backgroundColor: status.bg, 
                                                                                color: status.color,
                                                                                padding: '8px 16px', 
                                                                                borderRadius: '20px', 
                                                                                fontSize: '0.85rem',
                                                                                border: `2px solid ${status.color}`
                                                                            }}
                                                                        >
                                                                            <i className={`fas ${status.icon} mr-1`}></i>
                                                                            {status.label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="mb-2">
                                                                <h6 className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>KATEGORI PEKERJAAN</h6>
                                                                <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                                                                    <i className="fas fa-tag mr-2" style={{ color: '#9b59b6' }}></i>
                                                                    {validationDetail.job_category?.job_category || '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4 text-right">
                                                            <small className="text-muted">
                                                                Dibuat: {formatDate(validationDetail.created_at)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Society Info */}
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                                                <div className="card-header bg-white border-0 pt-3 pb-2">
                                                    <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                                        <i className="fas fa-user mr-2" style={{ color: '#667eea' }}></i>
                                                        Data Pencari Kerja
                                                    </h6>
                                                </div>
                                                <div className="card-body pt-0">
                                                    <table className="table table-sm table-borderless mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ fontSize: '0.85rem', color: '#888', width: '40%' }}>Nama</td>
                                                                <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>{validationDetail.society?.name || '-'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ fontSize: '0.85rem', color: '#888' }}>No. KTP</td>
                                                                <td style={{ fontSize: '0.9rem' }}>{validationDetail.society?.id_card_number || '-'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ fontSize: '0.85rem', color: '#888' }}>Gender</td>
                                                                <td style={{ fontSize: '0.9rem' }}>
                                                                    {validationDetail.society?.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ fontSize: '0.85rem', color: '#888' }}>Alamat</td>
                                                                <td style={{ fontSize: '0.9rem' }}>{validationDetail.society?.address || '-'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                                                <div className="card-header bg-white border-0 pt-3 pb-2">
                                                    <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                                        <i className="fas fa-user-check mr-2" style={{ color: '#2ecc71' }}></i>
                                                        Data Validator
                                                    </h6>
                                                </div>
                                                <div className="card-body pt-0">
                                                    {validationDetail.validator ? (
                                                        <table className="table table-sm table-borderless mb-0">
                                                            <tbody>
                                                                <tr>
                                                                    <td style={{ fontSize: '0.85rem', color: '#888', width: '40%' }}>Nama</td>
                                                                    <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>{validationDetail.validator.name}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ fontSize: '0.85rem', color: '#888' }}>ID Karyawan</td>
                                                                    <td style={{ fontSize: '0.9rem' }}>{validationDetail.validator.employee_id || '-'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-muted text-center py-3 mb-0">
                                                            <i className="fas fa-minus-circle mr-2"></i>
                                                            Belum ada validator yang ditugaskan
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
                                    <p className="text-muted mt-3">Gagal memuat detail validasi</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer-custom">
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => { setShowDetailModal(false); setValidationDetail(null); }} 
                                style={{ borderRadius: '8px' }}
                            >
                                <i className="fas fa-times mr-2"></i>Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style>{`
                .modal-backdrop-custom { 
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    background-color: rgba(0,0,0,0.5); 
                    display: flex; align-items: center; justify-content: center; 
                    z-index: 2000; padding: 20px; 
                }
                .modal-custom { 
                    background: white; border-radius: 8px; 
                    width: 650px; max-width: 100%; 
                    max-height: 90vh; overflow-y: auto; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
                }
                .modal-lg-custom { width: 800px; }
                .modal-header-custom { 
                    padding: 16px 20px; border-bottom: 1px solid #dee2e6; 
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .modal-body-custom { padding: 20px; }
                .modal-footer-custom { 
                    padding: 16px 20px; border-top: 1px solid #dee2e6; 
                    display: flex; justify-content: flex-end; gap: 10px; 
                }
                .close-btn { 
                    background: none; border: none; font-size: 20px; 
                    cursor: pointer; padding: 0; 
                }
                .close-btn:hover { opacity: 0.8; }
            `}</style>
        </MainLayouts>
    );
}