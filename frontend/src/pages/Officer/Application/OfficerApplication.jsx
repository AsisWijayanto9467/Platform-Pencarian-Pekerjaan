import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function OfficerApplication() {
    // Data states
    const [applicationList, setApplicationList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(20);
    
    // Filter states
    const [filterStatus, setFilterStatus] = useState("");
    
    // Selection states (for bulk process)
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    
    // Modal states
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showBulkProcessModal, setShowBulkProcessModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '', message: '', type: 'info', onConfirm: null
    });
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    
    // Form states
    const [processForm, setProcessForm] = useState({
        status: 'accepted',
        notes: ''
    });

    useEffect(() => {
        fetchApplications();
    }, [currentPage, filterStatus]);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
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

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError("");
            const params = { page: currentPage, per_page: itemsPerPage };
            if (searchTerm) params.search = searchTerm;
            if (filterStatus) params.status = filterStatus;
            
            const res = await api.get("/officer/applications", { params });
            setApplicationList(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
            // Reset selection
            setSelectedIds([]);
            setSelectAll(false);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
            setError(err.response?.data?.message || "Gagal memuat data lamaran");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchApplications();
    };

    const handleResetFilter = () => {
        setSearchTerm("");
        setFilterStatus("");
        setCurrentPage(1);
    };

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allPendingIds = applicationList
                .filter(app => app.status === 'pending')
                .map(app => app.id);
            setSelectedIds(allPendingIds);
            setSelectAll(true);
        } else {
            setSelectedIds([]);
            setSelectAll(false);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Single Process
    const handleProcessClick = (application) => {
        setSelectedApplication(application);
        setProcessForm({ status: 'accepted', notes: '' });
        setShowProcessModal(true);
    };

    const handleProcessApplication = async () => {
        setSubmitting(true);
        setProcessingId(selectedApplication.id);
        try {
            const res = await api.post(`/officer/applications/${selectedApplication.id}/process`, processForm);
            setShowProcessModal(false);
            setSelectedApplication(null);
            showSuccessBanner(res.data.message || 'Lamaran berhasil diproses!');
            fetchApplications();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal memproses lamaran', 'error');
        } finally {
            setSubmitting(false);
            setProcessingId(null);
        }
    };

    // Bulk Process
    const handleBulkProcessClick = () => {
        if (selectedIds.length === 0) {
            showAlert('Peringatan', 'Pilih minimal 1 lamaran untuk diproses', 'warning');
            return;
        }
        setProcessForm({ status: 'accepted', notes: '' });
        setShowBulkProcessModal(true);
    };

    const handleBulkProcess = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/officer/applications/bulk-process', {
                application_ids: selectedIds,
                status: processForm.status,
                notes: processForm.notes
            });
            setShowBulkProcessModal(false);
            showSuccessBanner(res.data.message || `${res.data.data?.total_processed || 0} lamaran berhasil diproses!`);
            fetchApplications();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal memproses lamaran', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return { icon: 'fa-check-circle', color: '#155724', bg: '#d4edda', label: 'Diterima' };
            case 'rejected':
                return { icon: 'fa-times-circle', color: '#721c24', bg: '#f8d7da', label: 'Ditolak' };
            case 'pending':
            default:
                return { icon: 'fa-clock', color: '#856404', bg: '#fff3cd', label: 'Pending' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    if (loading && applicationList.length === 0) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data lamaran...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid px-0">
                {/* Banners */}
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

                {/* Header */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold"><i className="fas fa-file-alt mr-2"></i>Kelola Lamaran</h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>Proses lamaran pekerjaan dari pencari kerja</p>
                                    </div>
                                    {selectedIds.length > 0 && (
                                        <button className="btn btn-light" onClick={handleBulkProcessClick} style={{ borderRadius: '10px', fontWeight: '600' }}>
                                            <i className="fas fa-check-double mr-2"></i>Proses ({selectedIds.length})
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-4 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}><i className="fas fa-search text-muted"></i></span>
                                    </div>
                                    <input type="text" className="form-control border-left-0" placeholder="Cari nama atau No. KTP..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                            <div className="col-md-3 mb-2 mb-md-0">
                                <select className="form-control" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}>
                                    <option value="">Semua Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Diterima</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </div>
                            <div className="col-md-5 text-md-right">
                                <button className="btn btn-warning mr-2" onClick={handleSearch} style={{ borderRadius: '10px' }}><i className="fas fa-search mr-2"></i>Cari</button>
                                <button className="btn btn-outline-secondary mr-2" onClick={handleResetFilter} style={{ borderRadius: '10px' }}><i className="fas fa-redo"></i></button>
                                <button className="btn btn-outline-warning" onClick={fetchApplications} style={{ borderRadius: '10px' }}><i className="fas fa-sync-alt"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', width: '40px' }}>
                                            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                                        </th>
                                        <th className="pl-2" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PELAMAR</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PERUSAHAAN</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>POSISI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>STATUS</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>TANGGAL</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicationList.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <div className="d-flex flex-column align-items-center justify-content-center">
                                                    <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                                                    <span style={{ color: '#888' }}>Belum ada data lamaran</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        applicationList.map((app, index) => {
                                            const status = getStatusBadge(app.status);
                                            const isPending = app.status === 'pending';
                                            return (
                                                <tr key={app.id}>
                                                    <td className="pl-4">
                                                        {isPending && (
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedIds.includes(app.id)} 
                                                                onChange={() => handleSelectOne(app.id)} 
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="pl-2" style={{ fontSize: '0.85rem', color: '#888' }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                    <td>
                                                        <div><span style={{ fontWeight: '600', fontSize: '0.9rem' }}><i className="fas fa-user mr-2" style={{ color: '#e67e22' }}></i>{app.society?.name || '-'}</span></div>
                                                        <small style={{ color: '#888', fontSize: '0.78rem' }}><i className="fas fa-id-card mr-1"></i>{app.society?.id_card_number || '-'}</small>
                                                    </td>
                                                    <td><span style={{ fontSize: '0.85rem' }}><i className="fas fa-building mr-1" style={{ color: '#e67e22' }}></i>{app.job_vacancy?.company || '-'}</span></td>
                                                    <td><span style={{ fontSize: '0.85rem' }}><i className="fas fa-list-ol mr-1" style={{ color: '#9b59b6' }}></i>{app.available_position?.position || '-'}</span></td>
                                                    <td className="text-center">
                                                        <span className="badge" style={{ backgroundColor: status.bg, color: status.color, padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: `1px solid ${status.color}` }}>
                                                            <i className={`fas ${status.icon} mr-1`}></i>{status.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem', color: '#888' }}>{formatDate(app.created_at)}</td>
                                                    <td className="text-center pr-4">
                                                        {isPending ? (
                                                            <button className="btn btn-sm btn-warning" onClick={() => handleProcessClick(app)} disabled={processingId === app.id} style={{ borderRadius: '8px', padding: '4px 12px' }}>
                                                                {processingId === app.id ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check-double mr-1"></i>Proses</>}
                                                            </button>
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Selesai</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div className="card-footer bg-white border-0 pb-4" style={{ borderRadius: '0 0 12px 12px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data</small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => paginate(1)} style={{ borderRadius: '8px 0 0 8px' }}><i className="fas fa-angle-double-left"></i></button></li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => paginate(currentPage - 1)}><i className="fas fa-angle-left"></i></button></li>
                                        {getPageNumbers().map((page, index) => (
                                            <li key={index} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { backgroundColor: '#e67e22', borderColor: '#e67e22', color: '#fff', fontWeight: 'bold' } : {}}>{page}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => paginate(currentPage + 1)}><i className="fas fa-angle-right"></i></button></li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}><button className="page-link" onClick={() => paginate(totalPages)} style={{ borderRadius: '0 8px 8px 0' }}><i className="fas fa-angle-double-right"></i></button></li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== MODALS ========== */}
            <ModalStyles />
            
            {/* Alert Modal */}
            {showAlertModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body-custom text-center py-4">
                            <div className="mb-3"><i className={`fas ${getAlertIcon(alertModalConfig.type)}`} style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}></i></div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>{alertModalConfig.title}</h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{alertModalConfig.message}</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-primary px-4" onClick={() => { setShowAlertModal(false); if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); }} style={{ borderRadius: '8px' }}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Process Modal */}
            {showProcessModal && selectedApplication && (
                <div className="modal-backdrop-custom" onClick={() => setShowProcessModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-check-double mr-2"></i>Proses Lamaran</h5>
                            <button className="close-btn text-white" onClick={() => setShowProcessModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-custom">
                            <p className="text-muted mb-3">
                                Memproses lamaran <strong>{selectedApplication.society?.name}</strong> untuk posisi <strong>{selectedApplication.available_position?.position}</strong> di <strong>{selectedApplication.job_vacancy?.company}</strong>.
                            </p>
                            <div className="form-group">
                                <label>Status <span className="text-danger">*</span></label>
                                <select className="form-control" value={processForm.status} onChange={(e) => setProcessForm(prev => ({ ...prev, status: e.target.value }))} style={{ borderRadius: '8px' }}>
                                    <option value="accepted">Terima</option>
                                    <option value="rejected">Tolak</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Catatan (Opsional)</label>
                                <textarea className="form-control" rows="2" value={processForm.notes} onChange={(e) => setProcessForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Tambahkan catatan..." style={{ borderRadius: '8px' }}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowProcessModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>Batal</button>
                            <button className="btn btn-warning" onClick={handleProcessApplication} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</> : <><i className="fas fa-check mr-2"></i>Proses</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Process Modal */}
            {showBulkProcessModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowBulkProcessModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-check-double mr-2"></i>Proses Massal</h5>
                            <button className="close-btn text-white" onClick={() => setShowBulkProcessModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-custom">
                            <p className="text-muted mb-3">Anda akan memproses <strong>{selectedIds.length}</strong> lamaran sekaligus.</p>
                            <div className="form-group">
                                <label>Status <span className="text-danger">*</span></label>
                                <select className="form-control" value={processForm.status} onChange={(e) => setProcessForm(prev => ({ ...prev, status: e.target.value }))} style={{ borderRadius: '8px' }}>
                                    <option value="accepted">Terima Semua</option>
                                    <option value="rejected">Tolak Semua</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Catatan (Opsional)</label>
                                <textarea className="form-control" rows="2" value={processForm.notes} onChange={(e) => setProcessForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Tambahkan catatan..." style={{ borderRadius: '8px' }}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowBulkProcessModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>Batal</button>
                            <button className="btn btn-warning" onClick={handleBulkProcess} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? <><i className="fas fa-spinner fa-spin mr-2"></i>Memproses...</> : <><i className="fas fa-check mr-2"></i>Proses Semua</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayouts>
    );
}

// Modal Styles Component
function ModalStyles() {
    return (
        <style>{`
            .modal-backdrop-custom { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
            .modal-custom { background: white; border-radius: 8px; width: 650px; max-width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
            .modal-sm-custom { width: 450px; }
            .modal-header-custom { padding: 16px 20px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
            .modal-body-custom { padding: 20px; }
            .modal-footer-custom { padding: 16px 20px; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 10px; }
            .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 0; }
            .close-btn:hover { opacity: 0.8; }
        `}</style>
    );
}