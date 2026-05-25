import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import MainLayouts from '../../layouts/MainLayouts';

export default function RegionalManagement() {
    // Data states
    const [regionalList, setRegionalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertModalConfig, setAlertModalConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });
    const [selectedRegional, setSelectedRegional] = useState(null);
    const [regionalDetail, setRegionalDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        province: '',
        district: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        province: '',
        district: ''
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchRegionalList();
    }, []);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    };

    // Fungsi untuk format error message dari backend
    const formatBackendErrors = (errors) => {
        if (!errors) return '';
        if (typeof errors === 'string') return errors;
        if (typeof errors === 'object') {
            const messages = [];
            Object.keys(errors).forEach(key => {
                const fieldErrors = errors[key];
                if (Array.isArray(fieldErrors)) {
                    messages.push(...fieldErrors);
                } else if (typeof fieldErrors === 'string') {
                    messages.push(fieldErrors);
                }
            });
            return messages.join('\n');
        }
        return 'Terjadi kesalahan';
    };

    const fetchRegionalList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/regionals");
            setRegionalList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch regional list:", err);
            const errorMsg = err.response?.data?.message || "Gagal memuat data regional";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegionalDetail = async (id) => {
        try {
            const res = await api.get(`/admin/regionals/${id}`);
            setRegionalDetail(res.data.data);
        } catch (err) {
            console.error("Failed to fetch regional detail:", err);
            const errorMsg = err.response?.data?.message || 'Gagal memuat detail regional';
            showAlert('Error', errorMsg, 'error');
        }
    };

    // Filter & Search
    const filteredRegionals = regionalList.filter(regional => {
        const searchLower = searchTerm.toLowerCase();
        return (
            regional.province?.toLowerCase().includes(searchLower) ||
            regional.district?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredRegionals.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRegionals.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({ province: '', district: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ province: '', district: '' });
        setFormErrors({});
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Validasi form
    const validateForm = (data) => {
        const errors = {};
        if (!data.province?.trim()) errors.province = 'Provinsi wajib diisi';
        if (!data.district?.trim()) errors.district = 'Kabupaten/Kota wajib diisi';
        return errors;
    };

    // Create regional
    const handleCreateRegional = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validasi Gagal', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const res = await api.post("/admin/regionals", formData);
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Regional berhasil ditambahkan!');
            fetchRegionalList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Validasi Gagal', formatBackendErrors(responseData.errors), 'warning');
            } else {
                showAlert('Error', responseData?.message || 'Gagal menambah regional', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (regional) => {
        setSelectedRegional(regional);
        setEditFormData({
            province: regional.province || '',
            district: regional.district || ''
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update regional
    const handleUpdateRegional = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm(editFormData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showAlert('Validasi Gagal', Object.values(validationErrors).join('\n'), 'warning');
            return;
        }
        
        setSubmitting(true);
        setFormErrors({});

        try {
            const res = await api.put(`/admin/regionals/${selectedRegional.id}`, editFormData);
            setShowEditModal(false);
            setSelectedRegional(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Regional berhasil diperbarui!');
            fetchRegionalList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else {
                showAlert('Error', responseData?.message || 'Gagal memperbarui regional', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete regional
    const handleDeleteClick = (regional) => {
        setSelectedRegional(regional);
        setShowDeleteModal(true);
    };

    const handleDeleteRegional = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/regionals/${selectedRegional.id}`);
            setShowDeleteModal(false);
            setSelectedRegional(null);
            showSuccessBanner(res.data.message || 'Regional berhasil dihapus!');
            fetchRegionalList();
        } catch (err) {
            const responseData = err.response?.data;
            const errorMsg = responseData?.message || 'Gagal menghapus regional';
            showAlert('Error', errorMsg, 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (regional) => {
        setSelectedRegional(regional);
        await fetchRegionalDetail(regional.id);
        setShowDetailModal(true);
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
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (loading) {
        return (
            <MainLayouts>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </div>
                        <p className="text-muted">Memuat data regional...</p>
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
                        <i className="fas fa-check-circle mr-2"></i>
                        <strong>Berhasil!</strong> {success}
                        <button type="button" className="close" onClick={() => setSuccess("")}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}
                
                {/* Error Banner */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: '10px' }}>
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                        <button type="button" className="close" onClick={() => setError("")}>
                            <span>&times;</span>
                        </button>
                    </div>
                )}

                {/* Header dengan Gradient */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div 
                            className="card border-0 shadow-sm"
                            style={{ 
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                            Kelola Regional
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Manajemen data provinsi dan kabupaten/kota
                                        </p>
                                    </div>
                                    <button 
                                        className="btn btn-light" 
                                        onClick={() => {
                                            resetForm();
                                            setShowCreateModal(true);
                                        }}
                                        style={{ borderRadius: '10px', fontWeight: '600' }}
                                    >
                                        <i className="fas fa-plus mr-2"></i>
                                        Tambah Regional
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #e74c3c' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                            Total Regional
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {regionalList.length}
                                        </h3>
                                    </div>
                                    <div 
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            backgroundColor: '#fde8e8'
                                        }}
                                    >
                                        <i className="fas fa-map text-danger" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #3498db' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                            Total Provinsi
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {[...new Set(regionalList.map(r => r.province))].length}
                                        </h3>
                                    </div>
                                    <div 
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            backgroundColor: '#e8f0fe'
                                        }}
                                    >
                                        <i className="fas fa-flag text-primary" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #2ecc71' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                            Total Society
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {regionalList.reduce((sum, r) => sum + (r.total_societies || 0), 0)}
                                        </h3>
                                    </div>
                                    <div 
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            backgroundColor: '#e8f8f0'
                                        }}
                                    >
                                        <i className="fas fa-users text-success" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-4">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                            <i className="fas fa-search text-muted"></i>
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        className="form-control border-left-0" 
                                        placeholder="Cari berdasarkan provinsi atau kabupaten..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        style={{ borderRadius: '0 10px 10px 0', fontSize: '0.9rem' }}
                                    />
                                    {searchTerm && (
                                        <div className="input-group-append">
                                            <button 
                                                className="btn btn-outline-secondary" 
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setCurrentPage(1);
                                                }}
                                                style={{ borderRadius: '10px', marginLeft: '8px' }}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 text-md-right mt-2 mt-md-0">
                                <button 
                                    className="btn btn-outline-primary mr-2" 
                                    onClick={fetchRegionalList}
                                    title="Refresh data"
                                    style={{ borderRadius: '10px' }}
                                >
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Refresh
                                </button>
                                <small className="text-muted">
                                    Menampilkan {currentItems.length} dari {filteredRegionals.length} regional
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regional Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>PROVINSI</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>KABUPATEN/KOTA</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>SOCIETY</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>VALIDATOR</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>DIBUAT</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-map-marked-alt fa-3x text-muted mb-3 d-block"></i>
                                                <span style={{ color: '#888' }}>
                                                    {searchTerm ? 'Tidak ada regional yang cocok dengan pencarian' : 'Belum ada data regional'}
                                                </span>
                                                {!searchTerm && (
                                                    <button 
                                                        className="btn btn-sm btn-primary mt-3 d-block mx-auto"
                                                        onClick={() => {
                                                            resetForm();
                                                            setShowCreateModal(true);
                                                        }}
                                                        style={{ borderRadius: '8px' }}
                                                    >
                                                        <i className="fas fa-plus mr-1"></i> Tambah Regional Pertama
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((regional, index) => (
                                            <tr key={regional.id}>
                                                <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {indexOfFirstItem + index + 1}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                        <i className="fas fa-flag text-danger mr-2"></i>
                                                        {regional.province}
                                                    </span>
                                                </td>
                                                <td>
                                                    <i className="fas fa-city text-primary mr-2"></i>
                                                    <span style={{ fontSize: '0.9rem' }}>{regional.district}</span>
                                                </td>
                                                <td className="text-center">
                                                    <span 
                                                        className="badge"
                                                        style={{ 
                                                            backgroundColor: '#e8f8f0',
                                                            color: '#2ecc71',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {regional.total_societies || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span 
                                                        className="badge"
                                                        style={{ 
                                                            backgroundColor: '#e8f0fe',
                                                            color: '#3498db',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {regional.total_validators || 0}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small style={{ color: '#888', fontSize: '0.82rem' }}>
                                                        {new Date(regional.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </small>
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => handleViewDetail(regional)}
                                                        title="Lihat Detail"
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1"
                                                        onClick={() => handleEditClick(regional)}
                                                        title="Edit Regional"
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(regional)}
                                                        title="Hapus Regional"
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
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
                                    Halaman {currentPage} dari {totalPages} ({filteredRegionals.length} total regional)
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(1)}
                                                style={{ borderRadius: '8px 0 0 8px' }}
                                            >
                                                <i className="fas fa-angle-double-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(currentPage - 1)}
                                            >
                                                <i className="fas fa-angle-left"></i>
                                            </button>
                                        </li>
                                        
                                        {getPageNumbers().map((page, index) => (
                                            <li 
                                                key={index} 
                                                className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { 
                                                        backgroundColor: '#e74c3c', 
                                                        borderColor: '#e74c3c',
                                                        color: '#fff'
                                                    } : {}}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        ))}
                                        
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(currentPage + 1)}
                                            >
                                                <i className="fas fa-angle-right"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => paginate(totalPages)}
                                                style={{ borderRadius: '0 8px 8px 0' }}
                                            >
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
                                <i 
                                    className={`fas ${getAlertIcon(alertModalConfig.type)}`}
                                    style={{ fontSize: '64px', color: getAlertColor(alertModalConfig.type) }}
                                ></i>
                            </div>
                            <h5 style={{ color: getAlertColor(alertModalConfig.type) }}>
                                {alertModalConfig.title}
                            </h5>
                            <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>
                                {alertModalConfig.message}
                            </p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-primary px-4"
                                onClick={() => {
                                    setShowAlertModal(false);
                                    if (alertModalConfig.onConfirm) alertModalConfig.onConfirm();
                                }}
                                style={{ borderRadius: '8px' }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-primary text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title">
                                <i className="fas fa-plus-circle mr-2"></i>
                                Tambah Regional Baru
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRegional}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-flag text-danger mr-1"></i>
                                        Provinsi <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="province" 
                                        className={`form-control ${formErrors.province ? 'is-invalid' : ''}`}
                                        value={formData.province}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: Jawa Barat"
                                        required
                                        style={{ borderRadius: '8px' }}
                                    />
                                    {formErrors.province && (
                                        <div className="invalid-feedback">{formErrors.province}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-city text-primary mr-1"></i>
                                        Kabupaten/Kota <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: Bandung"
                                        required
                                        style={{ borderRadius: '8px' }}
                                    />
                                    {formErrors.district && (
                                        <div className="invalid-feedback">{formErrors.district}</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={submitting}
                                    style={{ borderRadius: '8px' }}
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={submitting}
                                    style={{ borderRadius: '8px' }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Simpan Regional
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && selectedRegional && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title">
                                <i className="fas fa-edit mr-2"></i>
                                Edit Regional
                            </h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRegional}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Mengedit: <strong>{selectedRegional.province} - {selectedRegional.district}</strong>
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-flag text-danger mr-1"></i>
                                        Provinsi <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="province" 
                                        className={`form-control ${formErrors.province ? 'is-invalid' : ''}`}
                                        value={editFormData.province}
                                        onChange={handleEditInputChange}
                                        placeholder="Masukkan nama provinsi"
                                        required
                                        style={{ borderRadius: '8px' }}
                                    />
                                    {formErrors.province && (
                                        <div className="invalid-feedback">{formErrors.province}</div>
                                    )}
                                </div>
                                
                                <div className="form-group">
                                    <label>
                                        <i className="fas fa-city text-primary mr-1"></i>
                                        Kabupaten/Kota <span className="text-danger">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        className={`form-control ${formErrors.district ? 'is-invalid' : ''}`}
                                        value={editFormData.district}
                                        onChange={handleEditInputChange}
                                        placeholder="Masukkan nama kabupaten/kota"
                                        required
                                        style={{ borderRadius: '8px' }}
                                    />
                                    {formErrors.district && (
                                        <div className="invalid-feedback">{formErrors.district}</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={() => setShowEditModal(false)}
                                    disabled={submitting}
                                    style={{ borderRadius: '8px' }}
                                >
                                    <i className="fas fa-times mr-2"></i>
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-warning" 
                                    disabled={submitting}
                                    style={{ borderRadius: '8px' }}
                                >
                                    {submitting ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Memperbarui...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Perbarui Regional
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE MODAL ==================== */}
            {showDeleteModal && selectedRegional && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title">
                                <i className="fas fa-trash mr-2"></i>
                                Hapus Regional
                            </h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Hapus Regional?</h5>
                            <p className="text-muted">
                                Anda akan menghapus <strong>{selectedRegional.province} - {selectedRegional.district}</strong>.
                            </p>
                            {(selectedRegional.total_societies > 0 || selectedRegional.total_validators > 0) && (
                                <div className="alert alert-warning" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    Regional ini masih digunakan oleh 
                                    <strong> {selectedRegional.total_societies} society</strong> dan 
                                    <strong> {selectedRegional.total_validators} validator</strong>.
                                    Tidak dapat dihapus.
                                </div>
                            )}
                            <p className="text-danger mb-0">Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button 
                                className="btn btn-light" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={submitting}
                                style={{ borderRadius: '8px' }}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Batal
                            </button>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleDeleteRegional}
                                disabled={submitting || (selectedRegional.total_societies > 0 || selectedRegional.total_validators > 0)}
                                style={{ borderRadius: '8px' }}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-trash mr-2"></i>
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && regionalDetail && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setRegionalDetail(null); }}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-info text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title">
                                <i className="fas fa-info-circle mr-2"></i>
                                Detail Regional
                            </h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setRegionalDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                        <div className="card-body text-center">
                                            <h4 className="fw-bold mb-1">
                                                <i className="fas fa-flag text-danger mr-2"></i>
                                                {regionalDetail.province}
                                            </h4>
                                            <h5 className="text-muted mb-0">
                                                <i className="fas fa-city text-primary mr-2"></i>
                                                {regionalDetail.district}
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row mb-4">
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', borderLeft: '4px solid #2ecc71' }}>
                                        <div className="card-body text-center">
                                            <small style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>TOTAL SOCIETY</small>
                                            <h4 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                                {regionalDetail.societies?.length || regionalDetail.total_societies || 0}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', borderLeft: '4px solid #3498db' }}>
                                        <div className="card-body text-center">
                                            <small style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>TOTAL VALIDATOR</small>
                                            <h4 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                                {regionalDetail.validators?.length || regionalDetail.total_validators || 0}
                                            </h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {regionalDetail.societies && regionalDetail.societies.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                        <i className="fas fa-users text-success mr-2"></i>
                                        Daftar Society ({regionalDetail.societies.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Nama</th>
                                                    <th>No. KTP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {regionalDetail.societies.map((society) => (
                                                    <tr key={society.id}>
                                                        <td>{society.id}</td>
                                                        <td>{society.name}</td>
                                                        <td>{society.id_card_number}</td>
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
                                        Dibuat: {new Date(regionalDetail.created_at).toLocaleString('id-ID')}
                                    </small>
                                </div>
                                <div className="col-6 text-right">
                                    <small className="text-muted">
                                        Diperbarui: {new Date(regionalDetail.updated_at).toLocaleString('id-ID')}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => { setShowDetailModal(false); setRegionalDetail(null); }}
                                style={{ borderRadius: '8px' }}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CUSTOM MODAL STYLES ==================== */}
            <style jsx="true">{`
                .modal-backdrop-custom {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }
                .modal-custom {
                    background: white;
                    border-radius: 8px;
                    width: 600px;
                    max-width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                .modal-sm-custom {
                    width: 450px;
                }
                .modal-header-custom {
                    padding: 16px 20px;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body-custom {
                    padding: 20px;
                }
                .modal-footer-custom {
                    padding: 16px 20px;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                }
                .close-btn:hover {
                    opacity: 0.8;
                }
            `}</style>
        </MainLayouts>
    );
}