import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function PendingValidation() {
    // Data states
    const [validationList, setValidationList] = useState([]);
    const [totalPending, setTotalPending] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(15);
    
    // Filter states
    const [filterAssigned, setFilterAssigned] = useState("unassigned");
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '', message: '', type: 'info', onConfirm: null
    });
    const [selectedValidation, setSelectedValidation] = useState(null);
    const [validationDetail, setValidationDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    
    // Form states
    const [notesForm, setNotesForm] = useState({
        validator_notes: ''
    });

    useEffect(() => {
        fetchPendingValidations();
    }, [currentPage, filterAssigned]);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const fetchPendingValidations = async () => {
        try {
            setLoading(true);
            setError("");
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                assigned: filterAssigned
            };
            if (searchTerm) params.search = searchTerm;
            
            const res = await api.get("/validator/validations/pending", { params });
            setValidationList(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
            setTotalPending(res.data.total_pending || 0);
        } catch (err) {
            console.error("Failed to fetch pending validations:", err);
            setError(err.response?.data?.message || "Gagal memuat data validasi");
        } finally {
            setLoading(false);
        }
    };

    const fetchValidationDetail = async (id) => {
        try {
            setLoadingDetail(true);
            const res = await api.get(`/validator/validations/${id}`);
            setValidationDetail(res.data.data);
            
            // Jika validasi sudah di-assign ke validator ini, tampilkan modal approve/decline
            if (res.data.data.status === 'pending') {
                setShowDetailModal(true);
            }
        } catch (err) {
            console.error("Failed to fetch validation detail:", err);
            showAlert('Error', 'Gagal memuat detail validasi', 'error');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleViewDetail = (validation) => {
        setSelectedValidation(validation);
        fetchValidationDetail(validation.id);
    };

    const handleTakeValidation = async (validation) => {
        setProcessingId(validation.id);
        try {
            // Fetch detail akan auto-assign jika belum di-assign
            const res = await api.get(`/validator/validations/${validation.id}`);
            setValidationDetail(res.data.data);
            setSelectedValidation(res.data.data);
            setShowDetailModal(true);
            showSuccessBanner('Validasi berhasil diambil!');
            fetchPendingValidations();
        } catch (err) {
            console.log(err);
            showAlert('Error', 'Gagal mengambil validasi', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Approve
    const handleApproveClick = () => {
        setNotesForm({ validator_notes: '' });
        setShowApproveModal(true);
    };

    const handleApproveValidation = async () => {
        setSubmitting(true);
        try {
            const res = await api.post(`/validator/validations/${selectedValidation.id}/approve`, notesForm);
            setShowApproveModal(false);
            setShowDetailModal(false);
            setSelectedValidation(null);
            setValidationDetail(null);
            showSuccessBanner(res.data.message || 'Validasi berhasil disetujui!');
            fetchPendingValidations();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal menyetujui validasi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Decline
    const handleDeclineClick = () => {
        setNotesForm({ validator_notes: '' });
        setShowDeclineModal(true);
    };

    const handleDeclineValidation = async () => {
        if (!notesForm.validator_notes?.trim()) {
            showAlert('Error', 'Alasan penolakan wajib diisi', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post(`/validator/validations/${selectedValidation.id}/decline`, notesForm);
            setShowDeclineModal(false);
            setShowDetailModal(false);
            setSelectedValidation(null);
            setValidationDetail(null);
            showSuccessBanner(res.data.message || 'Validasi ditolak!');
            fetchPendingValidations();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal menolak validasi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchPendingValidations();
    };

    const handleResetFilter = () => {
        setSearchTerm("");
        setFilterAssigned("unassigned");
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

    const getAlertIcon = (type) => {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    };

    const getAlertColor = (type) => {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
    };

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
                {/* Success & Error Banners */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-check-circle mr-2"></i><strong>Berhasil!</strong> {success}
                        <button type="button" className="close" onClick={() => setSuccess("")}><span>&times;</span></button>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                        <button type="button" className="close" onClick={() => setError("")}><span>&times;</span></button>
                    </div>
                )}

                {/* Header Gradient */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-clock mr-2"></i>
                                            Validasi Tertunda
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Daftar validasi yang perlu diproses
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="text-center mr-3" style={{ 
                                            backgroundColor: 'rgba(255,255,255,0.2)', 
                                            borderRadius: '12px', 
                                            padding: '10px 16px',
                                            minWidth: '80px'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                                                {formatNumber(totalPending)}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                                                Total Tertunda
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-4 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-left-0" 
                                        placeholder="Cari nama atau No. KTP..."
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} 
                                    />
                                </div>
                            </div>
                            <div className="col-md-3 mb-2 mb-md-0">
                                <select 
                                    className="form-control" 
                                    value={filterAssigned} 
                                    onChange={(e) => { setFilterAssigned(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                >
                                    <option value="unassigned">Belum Ditugaskan</option>
                                    <option value="me">Milik Saya</option>
                                    <option value="">Semua</option>
                                </select>
                            </div>
                            <div className="col-md-5 text-md-right">
                                <button className="btn btn-warning mr-2" onClick={handleSearch} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-search mr-2"></i>Cari
                                </button>
                                <button className="btn btn-outline-secondary mr-2" onClick={handleResetFilter} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-redo"></i>
                                </button>
                                <button className="btn btn-outline-warning" onClick={fetchPendingValidations} style={{ borderRadius: '10px' }}>
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
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PENCARI KERJA</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>KATEGORI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>GENDER</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>TANGGAL</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validationList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <i className="fas fa-clipboard-check fa-3x text-muted mb-3"></i>
                                                    <span style={{ color: '#888' }}>Tidak ada validasi tertunda</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        validationList.map((validation, index) => (
                                            <tr key={validation.id}>
                                                <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td>
                                                    <div>
                                                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                            <i className="fas fa-user mr-2" style={{ color: '#f39c12' }}></i>
                                                            {validation.society?.name || '-'}
                                                        </span>
                                                    </div>
                                                    <small style={{ color: '#888', fontSize: '0.78rem' }}>
                                                        <i className="fas fa-id-card mr-1"></i>
                                                        {validation.society?.id_card_number || '-'}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem' }}>
                                                        <i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>
                                                        {validation.job_category?.job_category || '-'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge" style={{ 
                                                        backgroundColor: validation.society?.gender === 'male' ? '#e8f0fe' : '#fde8f0',
                                                        color: validation.society?.gender === 'male' ? '#3498db' : '#e91e63',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.78rem'
                                                    }}>
                                                        <i className={`fas fa-${validation.society?.gender === 'male' ? 'mars' : 'venus'} mr-1`}></i>
                                                        {validation.society?.gender === 'male' ? 'L' : 'P'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {formatDate(validation.created_at)}
                                                </td>
                                                <td className="text-center pr-4">
                                                    {validation.validator_id ? (
                                                        <button 
                                                            className="btn btn-sm btn-info mr-1" 
                                                            onClick={() => handleViewDetail(validation)}
                                                            title="Lihat & Proses" 
                                                            style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                        >
                                                            <i className="fas fa-eye mr-1"></i>Proses
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-sm btn-warning" 
                                                            onClick={() => handleTakeValidation(validation)}
                                                            disabled={processingId === validation.id}
                                                            title="Ambil Validasi" 
                                                            style={{ borderRadius: '8px', padding: '4px 12px' }}
                                                        >
                                                            {processingId === validation.id ? (
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <><i className="fas fa-hand-paper mr-1"></i>Ambil</>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
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
                                                        backgroundColor: '#f39c12', 
                                                        borderColor: '#f39c12', 
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
            </div>

            {/* ==================== ALERT MODAL ==================== */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3">
                                <i className={`fas ${getAlertIcon(alertModalConfig.type)}`} 
                                    style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>{alertModalConfig.title}</h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{alertModalConfig.message}</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-primary px-4" 
                                onClick={() => { setShowAlertModal(false); if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); }} 
                                style={{ borderRadius: '8px' }}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' 
                        }}>
                            <h5 className="modal-title">
                                <i className="fas fa-clipboard-check mr-2"></i>Detail Validasi
                            </h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setValidationDetail(null); }}>
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
                                    {/* Society Info */}
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-8">
                                                            <h5 className="fw-bold mb-2">{validationDetail.society?.name || '-'}</h5>
                                                            <table className="table table-sm table-borderless mb-0">
                                                                <tbody>
                                                                    <tr>
                                                                        <td style={{ width: '120px', color: '#888', fontSize: '0.85rem' }}>No. KTP</td>
                                                                        <td style={{ fontSize: '0.9rem' }}>: {validationDetail.society?.id_card_number || '-'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ color: '#888', fontSize: '0.85rem' }}>Gender</td>
                                                                        <td style={{ fontSize: '0.9rem' }}>
                                                                            : {validationDetail.society?.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ color: '#888', fontSize: '0.85rem' }}>Tanggal Lahir</td>
                                                                        <td style={{ fontSize: '0.9rem' }}>: {validationDetail.society?.born_date || '-'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ color: '#888', fontSize: '0.85rem' }}>Alamat</td>
                                                                        <td style={{ fontSize: '0.9rem' }}>: {validationDetail.society?.address || '-'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ color: '#888', fontSize: '0.85rem' }}>Regional</td>
                                                                        <td style={{ fontSize: '0.9rem' }}>
                                                                            : {validationDetail.society?.regional ? 
                                                                                `${validationDetail.society.regional.province} - ${validationDetail.society.regional.district}` 
                                                                                : '-'}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div className="col-md-4 text-right">
                                                            <span className="badge" style={{ 
                                                                backgroundColor: '#fff3cd', 
                                                                color: '#856404',
                                                                padding: '8px 16px', 
                                                                borderRadius: '20px', 
                                                                fontSize: '0.85rem',
                                                                border: '2px solid #856404'
                                                            }}>
                                                                <i className="fas fa-clock mr-1"></i>
                                                                Tertunda
                                                            </span>
                                                            <p className="mt-2 mb-0">
                                                                <small className="text-muted">
                                                                    Kategori: <strong>{validationDetail.job_category?.job_category || '-'}</strong>
                                                                </small>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="text-center">
                                        <button 
                                            className="btn btn-success btn-lg mr-3" 
                                            onClick={handleApproveClick}
                                            style={{ borderRadius: '10px', padding: '10px 30px' }}
                                        >
                                            <i className="fas fa-check-circle mr-2"></i>Setujui
                                        </button>
                                        <button 
                                            className="btn btn-danger btn-lg" 
                                            onClick={handleDeclineClick}
                                            style={{ borderRadius: '10px', padding: '10px 30px' }}
                                        >
                                            <i className="fas fa-times-circle mr-2"></i>Tolak
                                        </button>
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
                            <button className="btn btn-secondary" 
                                onClick={() => { setShowDetailModal(false); setValidationDetail(null); }} 
                                style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== APPROVE MODAL ==================== */}
            {showApproveModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-success text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-check-circle mr-2"></i>Setujui Validasi</h5>
                            <button className="close-btn text-white" onClick={() => setShowApproveModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <p className="text-muted">Anda akan menyetujui validasi untuk <strong>{validationDetail?.society?.name}</strong>.</p>
                            <div className="form-group">
                                <label>Catatan (Opsional)</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    value={notesForm.validator_notes} 
                                    onChange={(e) => setNotesForm({ validator_notes: e.target.value })}
                                    placeholder="Tambahkan catatan validasi..."
                                    style={{ borderRadius: '8px' }}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowApproveModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                Batal
                            </button>
                            <button className="btn btn-success" onClick={handleApproveValidation} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</>
                                ) : (
                                    <><i className="fas fa-check mr-2"></i>Setujui</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DECLINE MODAL ==================== */}
            {showDeclineModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeclineModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-times-circle mr-2"></i>Tolak Validasi</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeclineModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <p className="text-muted">Anda akan menolak validasi untuk <strong>{validationDetail?.society?.name}</strong>.</p>
                            <div className="form-group">
                                <label>Alasan Penolakan <span className="text-danger">*</span></label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    value={notesForm.validator_notes} 
                                    onChange={(e) => setNotesForm({ validator_notes: e.target.value })}
                                    placeholder="Wajib diisi - Jelaskan alasan penolakan..."
                                    style={{ borderRadius: '8px' }}
                                    required
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeclineModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                Batal
                            </button>
                            <button className="btn btn-danger" onClick={handleDeclineValidation} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</>
                                ) : (
                                    <><i className="fas fa-times mr-2"></i>Tolak</>
                                )}
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
                .modal-sm-custom { width: 450px; }
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