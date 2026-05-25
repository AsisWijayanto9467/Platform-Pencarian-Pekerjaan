import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function SocietyManagement() {
    // Data states
    const [societyList, setSocietyList] = useState([]);
    const [regionalList, setRegionalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalActive, setTotalActive] = useState(0);
    const [totalInactive, setTotalInactive] = useState(0);
    const [itemsPerPage] = useState(15);
    
    // Filter states
    const [filterRegional, setFilterRegional] = useState("");
    const [filterGender, setFilterGender] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    
    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '', message: '', type: 'info', onConfirm: null
    });
    const [selectedSociety, setSelectedSociety] = useState(null);
    const [societyDetail, setSocietyDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    
    // Form states
    const [editFormData, setEditFormData] = useState({
        name: '', born_date: '', gender: '', address: '', regional_id: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchSocietyList();
        fetchRegionalList();
    }, [currentPage, filterRegional, filterGender, filterStatus]);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 5000);
    };

    const formatBackendErrors = (errors) => {
        if (!errors) return '';
        if (typeof errors === 'string') return errors;
        if (typeof errors === 'object') {
            const messages = [];
            Object.keys(errors).forEach(key => {
                const fieldErrors = errors[key];
                if (Array.isArray(fieldErrors)) messages.push(...fieldErrors);
                else if (typeof fieldErrors === 'string') messages.push(fieldErrors);
            });
            return messages.join('\n');
        }
        return 'Terjadi kesalahan';
    };

    const fetchSocietyList = async () => {
        try {
            setLoading(true);
            setError("");
            const params = { page: currentPage, per_page: itemsPerPage };
            if (searchTerm) params.search = searchTerm;
            if (filterRegional) params.regional_id = filterRegional;
            if (filterGender) params.gender = filterGender;
            if (filterStatus) params.is_active = filterStatus;
            
            const res = await api.get("/admin/societies", { params });
            setSocietyList(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
            setTotalActive(res.data.data.total_active || 0);
            setTotalInactive(res.data.data.total_inactive || 0);
        } catch (err) {
            console.error("Failed to fetch societies:", err);
            const errorMsg = err.response?.data?.message || "Gagal memuat data society";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegionalList = async () => {
        try {
            const res = await api.get("/admin/regionals");
            setRegionalList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch regionals:", err);
        }
    };

    const fetchSocietyDetail = async (id) => {
        try {
            const res = await api.get(`/admin/societies/${id}`);
            setSocietyDetail(res.data.data);
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal memuat detail society', 'error');
        }
    };

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const resetEditForm = () => {
        setEditFormData({ name: '', born_date: '', gender: '', address: '', regional_id: '' });
        setFormErrors({});
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateEditForm = (data) => {
        const errors = {};
        if (!data.name?.trim()) errors.name = 'Nama wajib diisi';
        if (!data.regional_id) errors.regional_id = 'Regional wajib dipilih';
        return errors;
    };

    // Edit
    const handleEditClick = (society) => {
        setSelectedSociety(society);
        setEditFormData({
            name: society.name || '',
            born_date: society.born_date || '',
            gender: society.gender || 'male',
            address: society.address || '',
            regional_id: society.regional?.id || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const handleUpdateSociety = async (e) => {
        e.preventDefault();
        const validationErrors = validateEditForm(editFormData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validasi Gagal', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        setSubmitting(true);
        setFormErrors({});
        try {
            const res = await api.put(`/admin/societies/${selectedSociety.id}`, editFormData);
            setShowEditModal(false);
            setSelectedSociety(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Society berhasil diperbarui!');
            fetchSocietyList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else {
                showAlert('Error', responseData?.message || 'Gagal memperbarui society', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Activate / Deactivate
    const handleToggleStatus = (society) => {
        const action = society.is_active ? 'deactivate' : 'activate';
        const actionText = society.is_active ? 'menonaktifkan' : 'mengaktifkan';
        
        showAlert(
            'Konfirmasi',
            `Apakah Anda yakin ingin ${actionText} akun ${society.name}?`,
            'warning',
            () => confirmToggleStatus(society, action)
        );
    };

    const confirmToggleStatus = async (society, action) => {
        setTogglingId(society.id);
        try {
            const endpoint = action === 'activate' ? 'activate' : 'deactivate';
            const res = await api.patch(`/admin/societies/${society.id}/${endpoint}`);
            showSuccessBanner(res.data.message || `Society berhasil ${action === 'activate' ? 'diaktifkan' : 'dinonaktifkan'}!`);
            fetchSocietyList();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal mengubah status society', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    // Delete
    const handleDeleteClick = (society) => {
        setSelectedSociety(society);
        setShowDeleteModal(true);
    };

    const handleDeleteSociety = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/societies/${selectedSociety.id}`);
            setShowDeleteModal(false);
            setSelectedSociety(null);
            showSuccessBanner(res.data.message || 'Society berhasil dihapus!');
            
            // Jika halaman kosong setelah delete, kembali ke halaman sebelumnya
            if (societyList.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchSocietyList();
            }
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Gagal menghapus society', 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // Detail
    const handleViewDetail = async (society) => {
        setSelectedSociety(society);
        await fetchSocietyDetail(society.id);
        setShowDetailModal(true);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchSocietyList();
    };

    const handleResetFilter = () => {
        setSearchTerm("");
        setFilterRegional("");
        setFilterGender("");
        setFilterStatus("");
        setCurrentPage(1);
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

    // Gender badge
    const getGenderBadge = (gender) => {
        return gender === 'male' 
            ? { icon: 'fa-mars', color: '#3498db', bg: '#e8f0fe', label: 'Laki-laki' }
            : { icon: 'fa-venus', color: '#e91e63', bg: '#fde8f0', label: 'Perempuan' };
    };

    if (loading && societyList.length === 0) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data society...</p>
                    </div>
                </div>
            </MainLayouts>
        );
    }

    return (
        <MainLayouts>
            <div className="container-fluid px-0">
                {/* Success Banner */}
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

                {/* Header Gradient Cyan */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-users mr-2"></i>Kelola Society
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Manajemen data masyarakat / pencari kerja
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        {/* Total Semua */}
                                        <div className="text-center mr-3" style={{ 
                                            backgroundColor: 'rgba(255,255,255,0.2)', 
                                            borderRadius: '12px', 
                                            padding: '10px 16px',
                                            minWidth: '80px'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                                                {totalItems}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                                                Total
                                            </div>
                                        </div>
                                        
                                        {/* Total Aktif */}
                                        <div className="text-center mr-3" style={{ 
                                            backgroundColor: 'rgba(46, 204, 113, 0.3)', 
                                            borderRadius: '12px', 
                                            padding: '10px 16px',
                                            minWidth: '80px',
                                            border: '1px solid rgba(46, 204, 113, 0.5)'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' }}>
                                                {totalActive}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#fff' }}>
                                                <i className="fas fa-check-circle mr-1"></i>Aktif
                                            </div>
                                        </div>
                                        
                                        {/* Total Nonaktif */}
                                        <div className="text-center" style={{ 
                                            backgroundColor: 'rgba(231, 76, 60, 0.3)', 
                                            borderRadius: '12px', 
                                            padding: '10px 16px',
                                            minWidth: '80px',
                                            border: '1px solid rgba(231, 76, 60, 0.5)'
                                        }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                                                {totalInactive}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#fff' }}>
                                                <i className="fas fa-times-circle mr-1"></i>Nonaktif
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
                            <div className="col-md-3 mb-2 mb-md-0">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input type="text" className="form-control border-left-0" 
                                        placeholder="Cari nama atau No. KTP..."
                                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }} />
                                </div>
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <select className="form-control" value={filterRegional} 
                                    onChange={(e) => { setFilterRegional(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}>
                                    <option value="">Semua Regional</option>
                                    {regionalList.map(r => (
                                        <option key={r.id} value={r.id}>{r.province}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <select className="form-control" value={filterGender}
                                    onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}>
                                    <option value="">Semua Gender</option>
                                    <option value="male">Laki-laki</option>
                                    <option value="female">Perempuan</option>
                                </select>
                            </div>
                            <div className="col-md-2 mb-2 mb-md-0">
                                <select className="form-control" value={filterStatus}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}>
                                    <option value="">Semua Status</option>
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>
                            <div className="col-md-3 text-md-right">
                                <button className="btn btn-primary mr-2" onClick={handleSearch} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-search mr-2"></i>Cari
                                </button>
                                <button className="btn btn-outline-secondary mr-2" onClick={handleResetFilter} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-redo"></i>
                                </button>
                                <button className="btn btn-outline-primary" onClick={fetchSocietyList} style={{ borderRadius: '10px' }}>
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Society Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>NAMA / NO. KTP</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>EMAIL</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>REGIONAL</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>GENDER</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>STATUS AKUN</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>LAMARAN</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {societyList.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-5">
                                                <i className="fas fa-users fa-3x text-muted mb-3 d-block"></i>
                                                <span style={{ color: '#888' }}>Belum ada data society</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        societyList.map((society, index) => {
                                            const gender = getGenderBadge(society.gender);
                                            return (
                                                <tr key={society.id}>
                                                    <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                                <i className="fas fa-user mr-2" style={{ color: '#1abc9c' }}></i>{society.name}
                                                            </span>
                                                        </div>
                                                        <small style={{ color: '#888', fontSize: '0.78rem' }}>
                                                            <i className="fas fa-id-card mr-1"></i>{society.id_card_number || '-'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <small style={{ fontSize: '0.82rem' }}>{society.email || '-'}</small>
                                                    </td>
                                                    <td>
                                                        {society.regional ? (
                                                            <span style={{ fontSize: '0.8rem' }}>
                                                                <i className="fas fa-map-marker-alt text-danger mr-1"></i>
                                                                {society.regional.province}
                                                            </span>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge" style={{ 
                                                            backgroundColor: gender.bg, color: gender.color,
                                                            padding: '5px 10px', borderRadius: '20px', fontSize: '0.78rem'
                                                        }}>
                                                            <i className={`fas ${gender.icon} mr-1`}></i>{gender.label}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button 
                                                            className="badge border-0"
                                                            onClick={() => handleToggleStatus(society)}
                                                            disabled={togglingId === society.id}
                                                            style={{ 
                                                                backgroundColor: society.is_active ? '#d4edda' : '#f8d7da',
                                                                color: society.is_active ? '#155724' : '#721c24',
                                                                padding: '8px 16px', 
                                                                borderRadius: '20px', 
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                cursor: 'pointer', 
                                                                transition: 'all 0.3s',
                                                                border: `2px solid ${society.is_active ? '#28a745' : '#dc3545'}`,
                                                                minWidth: '100px'
                                                            }}
                                                            title={`Klik untuk ${society.is_active ? 'nonaktifkan' : 'aktifkan'} akun`}>
                                                            {togglingId === society.id ? (
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <>
                                                                    <i className={`fas fa-${society.is_active ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                                                    {society.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge" style={{ 
                                                            backgroundColor: '#e8f0fe', color: '#3498db',
                                                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem'
                                                        }}>
                                                            {society.total_applications || 0}
                                                        </span>
                                                    </td>
                                                    <td className="text-center pr-4">
                                                        <button className="btn btn-sm btn-info mr-1" onClick={() => handleViewDetail(society)}
                                                            title="Lihat Detail" style={{ borderRadius: '8px', padding: '4px 10px' }}>
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-warning mr-1" onClick={() => handleEditClick(society)}
                                                            title="Edit Society" style={{ borderRadius: '8px', padding: '4px 10px' }}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(society)}
                                                            title="Hapus Society" style={{ borderRadius: '8px', padding: '4px 10px' }}>
                                                            <i className="fas fa-trash"></i>
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
                                                <button className="page-link" onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { 
                                                        backgroundColor: '#1abc9c', 
                                                        borderColor: '#1abc9c', 
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    } : {}}>
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
                            {alertModalConfig.onConfirm ? (
                                <>
                                    <button className="btn btn-light px-4" 
                                        onClick={() => setShowAlertModal(false)} 
                                        style={{ borderRadius: '8px' }}>
                                        Batal
                                    </button>
                                    <button className="btn btn-primary px-4" 
                                        onClick={() => { 
                                            setShowAlertModal(false); 
                                            if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); 
                                        }} 
                                        style={{ borderRadius: '8px' }}>
                                        Ya, Lanjutkan
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-primary px-4" 
                                    onClick={() => { 
                                        setShowAlertModal(false); 
                                        if (alertModalConfig.onConfirm) alertModalConfig.onConfirm(); 
                                    }} 
                                    style={{ borderRadius: '8px' }}>
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && selectedSociety && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)' 
                        }}>
                            <h5 className="modal-title"><i className="fas fa-edit mr-2"></i>Edit Society</h5>
                            <button className="close-btn text-white" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSociety}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-info-circle mr-2"></i>Mengedit: <strong>{selectedSociety.name}</strong>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-user mr-1" style={{ color: '#1abc9c' }}></i>Nama <span className="text-danger">*</span></label>
                                            <input type="text" name="name" className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                                                value={editFormData.name} onChange={handleEditInputChange} required style={{ borderRadius: '8px' }} />
                                            {formErrors.name && <small className="text-danger">{formErrors.name}</small>}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-calendar mr-1" style={{ color: '#e67e22' }}></i>Tanggal Lahir</label>
                                            <input type="date" name="born_date" className="form-control"
                                                value={editFormData.born_date} onChange={handleEditInputChange} style={{ borderRadius: '8px' }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-venus-mars mr-1" style={{ color: '#9b59b6' }}></i>Gender</label>
                                            <select name="gender" className="form-control"
                                                value={editFormData.gender} onChange={handleEditInputChange} style={{ borderRadius: '8px' }}>
                                                <option value="male">Laki-laki</option>
                                                <option value="female">Perempuan</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label><i className="fas fa-map-marker-alt mr-1" style={{ color: '#e74c3c' }}></i>Regional <span className="text-danger">*</span></label>
                                            <select name="regional_id" className={`form-control ${formErrors.regional_id ? 'is-invalid' : ''}`}
                                                value={editFormData.regional_id} onChange={handleEditInputChange} required style={{ borderRadius: '8px' }}>
                                                <option value="">-- Pilih Regional --</option>
                                                {regionalList.map(r => (
                                                    <option key={r.id} value={r.id}>{r.province} - {r.district}</option>
                                                ))}
                                            </select>
                                            {formErrors.regional_id && <small className="text-danger">{formErrors.regional_id}</small>}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-map mr-1" style={{ color: '#3498db' }}></i>Alamat</label>
                                    <textarea name="address" rows="2" className="form-control"
                                        value={editFormData.address} onChange={handleEditInputChange} style={{ borderRadius: '8px' }}></textarea>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" 
                                    onClick={() => setShowEditModal(false)} disabled={submitting} 
                                    style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal
                                </button>
                                <button type="submit" className="btn text-white" disabled={submitting} 
                                    style={{ 
                                        borderRadius: '8px', 
                                        background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', 
                                        border: 'none' 
                                    }}>
                                    {submitting ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Memperbarui...</>
                                    ) : (
                                        <><i className="fas fa-save mr-2"></i>Perbarui Society</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE MODAL ==================== */}
            {showDeleteModal && selectedSociety && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Hapus Society</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Hapus Society?</h5>
                            <p className="text-muted">Anda akan menghapus <strong>{selectedSociety.name}</strong>.</p>
                            {(selectedSociety.total_applications > 0 || selectedSociety.total_validations > 0) && (
                                <div className="alert alert-warning" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    Society ini memiliki <strong>{selectedSociety.total_applications}</strong> lamaran dan <strong>{selectedSociety.total_validations}</strong> validasi.
                                </div>
                            )}
                            <p className="text-danger mb-0">Semua data terkait akan dihapus permanen.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" 
                                onClick={() => setShowDeleteModal(false)} disabled={submitting} 
                                style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteSociety} disabled={submitting} 
                                style={{ borderRadius: '8px' }}>
                                {submitting ? (
                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...</>
                                ) : (
                                    <><i className="fas fa-trash mr-2"></i>Hapus</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && societyDetail && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setSocietyDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ 
                            borderRadius: '8px 8px 0 0', 
                            background: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)' 
                        }}>
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Detail Society</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setSocietyDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-8">
                                                    <h5 className="fw-bold mb-1">{societyDetail.name}</h5>
                                                    <p className="text-muted mb-1">
                                                        <i className="fas fa-id-card mr-1"></i>{societyDetail.id_card_number}
                                                        <span className="mx-2">|</span>
                                                        <i className="fas fa-envelope mr-1"></i>{societyDetail.email || '-'}
                                                    </p>
                                                    <p className="text-muted mb-1">
                                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                                        {societyDetail.regional?.province} - {societyDetail.regional?.district}
                                                    </p>
                                                    <p className="text-muted mb-0">
                                                        <i className="fas fa-map mr-1"></i>{societyDetail.address || '-'}
                                                    </p>
                                                </div>
                                                <div className="col-md-4 text-right">
                                                    <span className={`badge ${societyDetail.is_active ? 'badge-success' : 'badge-danger'}`} 
                                                        style={{ 
                                                            padding: '8px 16px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '0.85rem',
                                                            border: `2px solid ${societyDetail.is_active ? '#28a745' : '#dc3545'}`
                                                        }}>
                                                        <i className={`fas fa-${societyDetail.is_active ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                                        {societyDetail.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                    </span>
                                                    <p className="mt-2 mb-0">
                                                        <span className="badge" style={{ 
                                                            backgroundColor: societyDetail.gender === 'male' ? '#e8f0fe' : '#fde8f0',
                                                            color: societyDetail.gender === 'male' ? '#3498db' : '#e91e63',
                                                            padding: '5px 10px', borderRadius: '20px'
                                                        }}>
                                                            <i className={`fas fa-${societyDetail.gender === 'male' ? 'mars' : 'venus'} mr-1`}></i>
                                                            {societyDetail.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Applications */}
                            {societyDetail.applications && societyDetail.applications.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                        <i className="fas fa-file-alt text-primary mr-2"></i>Lamaran ({societyDetail.applications.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr><th>Perusahaan</th><th>Alamat</th><th>Posisi</th></tr>
                                            </thead>
                                            <tbody>
                                                {societyDetail.applications.map((app) => (
                                                    <tr key={app.id}>
                                                        <td>{app.job_vacancy?.company || '-'}</td>
                                                        <td>{app.job_vacancy?.address || '-'}</td>
                                                        <td>{app.job_apply_positions?.map(p => p.position).join(', ') || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Validations */}
                            {societyDetail.validations && societyDetail.validations.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                        <i className="fas fa-clipboard-check text-success mr-2"></i>Validasi ({societyDetail.validations.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr><th>Kategori</th><th>Validator</th><th>Status</th></tr>
                                            </thead>
                                            <tbody>
                                                {societyDetail.validations.map((val) => (
                                                    <tr key={val.id}>
                                                        <td>{val.job_category?.job_category || '-'}</td>
                                                        <td>{val.validator?.name || '-'}</td>
                                                        <td>
                                                            <span className={`badge badge-${val.status === 'approved' ? 'success' : val.status === 'pending' ? 'warning' : 'danger'}`}>
                                                                {val.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="row mt-3">
                                <div className="col-6">
                                    <small className="text-muted">
                                        Dibuat: {new Date(societyDetail.created_at).toLocaleString('id-ID')}
                                    </small>
                                </div>
                                <div className="col-6 text-right">
                                    <small className="text-muted">
                                        Login terakhir: {societyDetail.last_login ? new Date(societyDetail.last_login).toLocaleString('id-ID') : '-'}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" 
                                onClick={() => { setShowDetailModal(false); setSocietyDetail(null); }} 
                                style={{ borderRadius: '8px' }}>
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
                .gap-2 { gap: 0.5rem; }
            `}</style>
        </MainLayouts>
    );
}