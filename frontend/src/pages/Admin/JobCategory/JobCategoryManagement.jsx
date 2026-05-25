import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function JobCategoryManagement() {
    // Data states
    const [categoryList, setCategoryList] = useState([]);
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
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryDetail, setCategoryDetail] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({
        job_category: '',
        description: ''
    });
    
    const [editFormData, setEditFormData] = useState({
        job_category: '',
        description: '',
        is_active: true
    });
    
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchCategoryList();
    }, []);

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertModalConfig({ title, message, type, onConfirm });
        setShowAlertModal(true);
    };

    const showSuccessBanner = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
    };

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

    const fetchCategoryList = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/admin/job-categories");
            setCategoryList(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch job categories:", err);
            const errorMsg = err.response?.data?.message || "Gagal memuat data kategori pekerjaan";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryDetail = async (id) => {
        try {
            const res = await api.get(`/admin/job-categories/${id}`);
            setCategoryDetail(res.data.data);
        } catch (err) {
            console.error("Failed to fetch category detail:", err);
            const errorMsg = err.response?.data?.message || 'Gagal memuat detail kategori';
            showAlert('Error', errorMsg, 'error');
        }
    };

    // Filter & Search
    const filteredCategories = categoryList.filter(category => {
        const searchLower = searchTerm.toLowerCase();
        return (
            category.job_category?.toLowerCase().includes(searchLower) ||
            category.description?.toLowerCase().includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const resetForm = () => {
        setFormData({ job_category: '', description: '' });
        setFormErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ job_category: '', description: '', is_active: true });
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (data) => {
        const errors = {};
        if (!data.job_category?.trim()) errors.job_category = 'Nama kategori wajib diisi';
        return errors;
    };

    // Create category
    const handleCreateCategory = async (e) => {
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
            const res = await api.post("/admin/job-categories", formData);
            setShowCreateModal(false);
            resetForm();
            showSuccessBanner(res.data.message || 'Kategori berhasil ditambahkan!');
            fetchCategoryList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Validasi Gagal', formatBackendErrors(responseData.errors), 'warning');
            } else {
                showAlert('Error', responseData?.message || 'Gagal menambah kategori', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (category) => {
        setSelectedCategory(category);
        setEditFormData({
            job_category: category.job_category || '',
            description: category.description || '',
            is_active: category.is_active === 1 || category.is_active === true
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    // Update category
    const handleUpdateCategory = async (e) => {
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
            const res = await api.put(`/admin/job-categories/${selectedCategory.id}`, editFormData);
            setShowEditModal(false);
            setSelectedCategory(null);
            resetEditForm();
            showSuccessBanner(res.data.message || 'Kategori berhasil diperbarui!');
            fetchCategoryList();
        } catch (err) {
            const responseData = err.response?.data;
            if (responseData?.errors) {
                setFormErrors(responseData.errors);
                showAlert('Error', formatBackendErrors(responseData.errors), 'error');
            } else {
                showAlert('Error', responseData?.message || 'Gagal memperbarui kategori', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Delete category
    const handleDeleteClick = (category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const handleDeleteCategory = async () => {
        setSubmitting(true);
        try {
            const res = await api.delete(`/admin/job-categories/${selectedCategory.id}`);
            setShowDeleteModal(false);
            setSelectedCategory(null);
            showSuccessBanner(res.data.message || 'Kategori berhasil dihapus!');
            fetchCategoryList();
        } catch (err) {
            const responseData = err.response?.data;
            const errorMsg = responseData?.message || 'Gagal menghapus kategori';
            showAlert('Error', errorMsg, 'error');
            setShowDeleteModal(false);
        } finally {
            setSubmitting(false);
        }
    };

    // View detail
    const handleViewDetail = async (category) => {
        setSelectedCategory(category);
        await fetchCategoryDetail(category.id);
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
                        <p className="text-muted">Memuat data kategori pekerjaan...</p>
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
                                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'
                            }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h4 className="text-white mb-2 fw-bold">
                                            <i className="fas fa-tags mr-2"></i>
                                            Kelola Kategori Pekerjaan
                                        </h4>
                                        <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                                            Manajemen data kategori lowongan pekerjaan
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
                                        Tambah Kategori
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #9b59b6' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                            Total Kategori
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {categoryList.length}
                                        </h3>
                                    </div>
                                    <div 
                                        className="d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            backgroundColor: '#f3e8f8'
                                        }}
                                    >
                                        <i className="fas fa-list text-purple" style={{ fontSize: '20px', color: '#9b59b6' }}></i>
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
                                            Kategori Aktif
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {categoryList.filter(c => c.is_active).length}
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
                                        <i className="fas fa-check-circle text-success" style={{ fontSize: '20px' }}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-4 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #e74c3c' }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <small style={{ color: '#888', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                                            Total Lowongan
                                        </small>
                                        <h3 className="mb-0 fw-bold" style={{ color: '#2c3e50' }}>
                                            {categoryList.reduce((sum, c) => sum + (c.total_vacancies || 0), 0)}
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
                                        <i className="fas fa-briefcase text-danger" style={{ fontSize: '20px' }}></i>
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
                                        placeholder="Cari berdasarkan nama kategori atau deskripsi..."
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
                                    onClick={fetchCategoryList}
                                    title="Refresh data"
                                    style={{ borderRadius: '10px' }}
                                >
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Refresh
                                </button>
                                <small className="text-muted">
                                    Menampilkan {currentItems.length} dari {filteredCategories.length} kategori
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th className="pl-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>#</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>KATEGORI</th>
                                        <th style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>DESKRIPSI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>STATUS</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>VALIDASI</th>
                                        <th className="text-center" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>LOWONGAN</th>
                                        <th className="text-center pr-4" style={{ borderTop: 'none', fontSize: '0.8rem', color: '#888', fontWeight: '600' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-tags fa-3x text-muted mb-3 d-block"></i>
                                                <span style={{ color: '#888' }}>
                                                    {searchTerm ? 'Tidak ada kategori yang cocok dengan pencarian' : 'Belum ada data kategori'}
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
                                                        <i className="fas fa-plus mr-1"></i> Tambah Kategori Pertama
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((category, index) => (
                                            <tr key={category.id}>
                                                <td className="pl-4" style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    {indexOfFirstItem + index + 1}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                                        <i className="fas fa-tag mr-2" style={{ color: '#9b59b6' }}></i>
                                                        {category.job_category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                        {category.description ? (
                                                            category.description.length > 50 
                                                                ? category.description.substring(0, 50) + '...' 
                                                                : category.description
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span 
                                                        className="badge"
                                                        style={{ 
                                                            backgroundColor: category.is_active ? '#e8f8f0' : '#fde8e8',
                                                            color: category.is_active ? '#2ecc71' : '#e74c3c',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        <i className={`fas fa-${category.is_active ? 'check-circle' : 'times-circle'} mr-1`}></i>
                                                        {category.is_active ? 'Aktif' : 'Nonaktif'}
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
                                                        {category.total_validations || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <span 
                                                        className="badge"
                                                        style={{ 
                                                            backgroundColor: '#fef3e8',
                                                            color: '#e67e22',
                                                            padding: '6px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {category.total_vacancies || 0}
                                                    </span>
                                                </td>
                                                <td className="text-center pr-4">
                                                    <button 
                                                        className="btn btn-sm btn-info mr-1"
                                                        onClick={() => handleViewDetail(category)}
                                                        title="Lihat Detail"
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-warning mr-1"
                                                        onClick={() => handleEditClick(category)}
                                                        title="Edit Kategori"
                                                        style={{ borderRadius: '8px', padding: '4px 10px' }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteClick(category)}
                                                        title="Hapus Kategori"
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
                                    Halaman {currentPage} dari {totalPages} ({filteredCategories.length} total kategori)
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
                                            <li 
                                                key={index} 
                                                className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => page !== '...' && paginate(page)}
                                                    style={page === currentPage ? { 
                                                        backgroundColor: '#9b59b6', 
                                                        borderColor: '#9b59b6',
                                                        color: '#fff'
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
                            <button className="btn btn-primary px-4" onClick={() => {
                                setShowAlertModal(false);
                                if (alertModalConfig.onConfirm) alertModalConfig.onConfirm();
                            }} style={{ borderRadius: '8px' }}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CREATE MODAL ==================== */}
            {showCreateModal && (
                <div className="modal-backdrop-custom" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-plus-circle mr-2"></i>Tambah Kategori Baru</h5>
                            <button className="close-btn text-white" onClick={() => setShowCreateModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleCreateCategory}>
                            <div className="modal-body-custom">
                                <div className="form-group">
                                    <label><i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>Nama Kategori <span className="text-danger">*</span></label>
                                    <input type="text" name="job_category" 
                                        className={`form-control ${formErrors.job_category ? 'is-invalid' : ''}`}
                                        value={formData.job_category} onChange={handleInputChange}
                                        placeholder="Contoh: Teknologi Informasi" required style={{ borderRadius: '8px' }} />
                                    {formErrors.job_category && <div className="invalid-feedback">{formErrors.job_category}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left mr-1" style={{ color: '#3498db' }}></i>Deskripsi</label>
                                    <textarea name="description" rows="3"
                                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={formData.description} onChange={handleInputChange}
                                        placeholder="Deskripsi kategori pekerjaan (opsional)" style={{ borderRadius: '8px' }}></textarea>
                                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowCreateModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal
                                </button>
                                <button type="submit" className="btn text-white" disabled={submitting} 
                                    style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', border: 'none' }}>
                                    {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</>) : (<><i className="fas fa-save mr-2"></i>Simpan Kategori</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && selectedCategory && (
                <div className="modal-backdrop-custom" onClick={() => setShowEditModal(false)}>
                    <div className="modal-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-warning" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-edit mr-2"></i>Edit Kategori</h5>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleUpdateCategory}>
                            <div className="modal-body-custom">
                                <div className="alert alert-info" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Mengedit: <strong>{selectedCategory.job_category}</strong>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-tag mr-1" style={{ color: '#9b59b6' }}></i>Nama Kategori <span className="text-danger">*</span></label>
                                    <input type="text" name="job_category" 
                                        className={`form-control ${formErrors.job_category ? 'is-invalid' : ''}`}
                                        value={editFormData.job_category} onChange={handleEditInputChange}
                                        placeholder="Masukkan nama kategori" required style={{ borderRadius: '8px' }} />
                                    {formErrors.job_category && <div className="invalid-feedback">{formErrors.job_category}</div>}
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-align-left mr-1" style={{ color: '#3498db' }}></i>Deskripsi</label>
                                    <textarea name="description" rows="3"
                                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                        value={editFormData.description} onChange={handleEditInputChange}
                                        placeholder="Deskripsi kategori pekerjaan (opsional)" style={{ borderRadius: '8px' }}></textarea>
                                </div>
                                <div className="form-group">
                                    <div className="custom-control custom-switch">
                                        <input type="checkbox" className="custom-control-input" id="editIsActive" 
                                            name="is_active" checked={editFormData.is_active} onChange={handleEditInputChange} />
                                        <label className="custom-control-label" htmlFor="editIsActive" style={{ fontWeight: '600' }}>
                                            <i className={`fas fa-${editFormData.is_active ? 'check-circle text-success' : 'times-circle text-danger'} mr-1`}></i>
                                            Status Aktif
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer-custom">
                                <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-times mr-2"></i>Batal
                                </button>
                                <button type="submit" className="btn btn-warning" disabled={submitting} style={{ borderRadius: '8px' }}>
                                    {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Memperbarui...</>) : (<><i className="fas fa-save mr-2"></i>Perbarui Kategori</>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== DELETE MODAL ==================== */}
            {showDeleteModal && selectedCategory && (
                <div className="modal-backdrop-custom" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-custom modal-sm-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom bg-danger text-white" style={{ borderRadius: '8px 8px 0 0' }}>
                            <h5 className="modal-title"><i className="fas fa-trash mr-2"></i>Hapus Kategori</h5>
                            <button className="close-btn text-white" onClick={() => setShowDeleteModal(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="modal-body-custom text-center py-4">
                            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '64px' }}></i>
                            <h5 className="mt-3">Hapus Kategori?</h5>
                            <p className="text-muted">
                                Anda akan menghapus <strong>{selectedCategory.job_category}</strong>.
                            </p>
                            {(selectedCategory.total_validations > 0 || selectedCategory.total_vacancies > 0) && (
                                <div className="alert alert-warning" style={{ borderRadius: '8px' }}>
                                    <i className="fas fa-exclamation-circle mr-2"></i>
                                    Kategori ini masih digunakan. Kategori akan dinonaktifkan, bukan dihapus.
                                </div>
                            )}
                            <p className="text-danger mb-0">Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="modal-footer-custom justify-content-center">
                            <button className="btn btn-light" onClick={() => setShowDeleteModal(false)} disabled={submitting} style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Batal
                            </button>
                            <button className="btn btn-danger" onClick={handleDeleteCategory} disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Menghapus...</>) : (<><i className="fas fa-trash mr-2"></i>Hapus</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== DETAIL MODAL ==================== */}
            {showDetailModal && categoryDetail && (
                <div className="modal-backdrop-custom" onClick={() => { setShowDetailModal(false); setCategoryDetail(null); }}>
                    <div className="modal-custom modal-lg-custom" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom text-white" style={{ borderRadius: '8px 8px 0 0', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' }}>
                            <h5 className="modal-title"><i className="fas fa-info-circle mr-2"></i>Detail Kategori</h5>
                            <button className="close-btn text-white" onClick={() => { setShowDetailModal(false); setCategoryDetail(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card bg-light" style={{ borderRadius: '10px' }}>
                                        <div className="card-body text-center">
                                            <h4 className="fw-bold mb-2">
                                                <i className="fas fa-tag mr-2" style={{ color: '#9b59b6' }}></i>
                                                {categoryDetail.job_category}
                                            </h4>
                                            <p className="text-muted mb-2">{categoryDetail.description || 'Tidak ada deskripsi'}</p>
                                            <span className={`badge ${categoryDetail.is_active ? 'badge-success' : 'badge-danger'}`} style={{ padding: '6px 14px', borderRadius: '20px' }}>
                                                {categoryDetail.is_active ? '✅ Aktif' : '❌ Nonaktif'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row mb-4">
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', borderLeft: '4px solid #3498db' }}>
                                        <div className="card-body text-center">
                                            <small style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>TOTAL VALIDASI</small>
                                            <h4 className="mb-0 fw-bold">{categoryDetail.total_validations || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '10px', borderLeft: '4px solid #e67e22' }}>
                                        <div className="card-body text-center">
                                            <small style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>TOTAL LOWONGAN</small>
                                            <h4 className="mb-0 fw-bold">{categoryDetail.total_vacancies || 0}</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {categoryDetail.recent_validations && categoryDetail.recent_validations.length > 0 && (
                                <div className="mb-3">
                                    <h6 className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                        <i className="fas fa-clipboard-check text-primary mr-2"></i>
                                        Validasi Terbaru ({categoryDetail.recent_validations.length})
                                    </h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered">
                                            <thead className="bg-light">
                                                <tr><th>Society</th><th>Validator</th><th>Status</th></tr>
                                            </thead>
                                            <tbody>
                                                {categoryDetail.recent_validations.map((val) => (
                                                    <tr key={val.id}>
                                                        <td>{val.society?.name || '-'}</td>
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
                                <div className="col-6"><small className="text-muted">Dibuat: {new Date(categoryDetail.created_at).toLocaleString('id-ID')}</small></div>
                                <div className="col-6 text-right"><small className="text-muted">Diperbarui: {new Date(categoryDetail.updated_at).toLocaleString('id-ID')}</small></div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <button className="btn btn-secondary" onClick={() => { setShowDetailModal(false); setCategoryDetail(null); }} style={{ borderRadius: '8px' }}>
                                <i className="fas fa-times mr-2"></i>Tutup
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
                .modal-lg-custom {
                    width: 750px;
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
                .custom-control-input:checked ~ .custom-control-label::before {
                    background-color: #2ecc71;
                    border-color: #2ecc71;
                }
            `}</style>
        </MainLayouts>
    );
}