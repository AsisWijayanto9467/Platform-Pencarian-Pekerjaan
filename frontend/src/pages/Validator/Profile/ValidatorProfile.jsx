import React, { useState, useEffect } from 'react';
import MainLayouts from '../../layouts/MainLayouts';
import api from '../../../services/api';

export default function ValidatorProfile() {
  const [profileData, setProfileData] = useState(null);
  const [regionalList, setRegionalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    regional_id: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProfile();
    fetchRegionalList();
  }, []);

  const showSuccessBanner = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 5000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/validator/profile');
      setProfileData(response.data.data);
      setFormData({
        name: response.data.data.name || '',
        phone: response.data.data.phone || '',
        email: response.data.data.email || '',
        regional_id: response.data.data.regional?.id || ''
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionalList = async () => {
    try {
      // Gunakan endpoint auth/get-regional untuk mengambil data regional
      const res = await api.get("/auth/get-regional");
      setRegionalList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch regionals:", err);
      // Fallback ke admin/regionals jika auth/get-regional tidak tersedia
      try {
        const res = await api.get("/admin/regionals");
        setRegionalList(res.data.data || []);
      } catch (err2) {
        console.error("Failed to fetch regionals (fallback):", err2);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Nama wajib diisi';
    if (!formData.email?.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }
    if (!formData.regional_id) errors.regional_id = 'Regional wajib dipilih';
    return errors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    
    setSubmitting(true);
    setFormErrors({});
    
    try {
      const res = await api.put('/validator/profile', formData);
      setProfileData(res.data.data);
      setIsEditing(false);
      showSuccessBanner(res.data.message || 'Profil berhasil diperbarui!');
      
      // Update localStorage dengan data terbaru
      const updatedProfile = res.data.data;
      localStorage.setItem("profile", JSON.stringify({
        name: updatedProfile.name,
        email: updatedProfile.email || updatedProfile.user?.email,
        role: updatedProfile.role,
        regional: updatedProfile.regional,
        employee_id: updatedProfile.employee_id
      }));
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.errors) {
        // Handle validation errors
        const errors = {};
        Object.keys(responseData.errors).forEach(key => {
          errors[key] = Array.isArray(responseData.errors[key]) 
            ? responseData.errors[key][0] 
            : responseData.errors[key];
        });
        setFormErrors(errors);
      } else {
        setError(responseData?.message || 'Gagal memperbarui profil');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: profileData?.name || '',
      phone: profileData?.phone || '',
      email: profileData?.email || '',
      regional_id: profileData?.regional?.id || ''
    });
    setFormErrors({});
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'officer':
        return { icon: 'fa-user-tie', color: '#e67e22', bg: '#fdf2e9', label: 'Officer' };
      case 'validator':
      default:
        return { icon: 'fa-user-check', color: '#2ecc71', bg: '#e8f8f0', label: 'Validator' };
    }
  };

  if (loading) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="sr-only">Loading...</span>
            </div>
            <p className="text-muted">Memuat data profil...</p>
          </div>
        </div>
      </MainLayouts>
    );
  }

  if (error && !profileData) {
    return (
      <MainLayouts>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '48px' }}></i>
            <h5 className="mt-3 text-danger">{error}</h5>
            <button className="btn btn-primary mt-3" onClick={fetchProfile}>
              <i className="fas fa-sync-alt mr-2"></i>Coba Lagi
            </button>
          </div>
        </div>
      </MainLayouts>
    );
  }

  const role = getRoleBadge(profileData?.role);

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
                background: profileData?.role === 'officer'
                  ? 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' 
                  : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="text-white mb-2 fw-bold">
                      <i className="fas fa-user-circle mr-2"></i>
                      Profil Saya
                    </h4>
                    <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                      Kelola informasi profil Anda
                    </p>
                  </div>
                  <div className="d-none d-md-block">
                    <i className="fas fa-id-card text-white" style={{ fontSize: '48px', opacity: 0.3 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Profile Card */}
          <div className="col-lg-4 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                {/* Avatar */}
                <div 
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: role.bg,
                    border: `4px solid ${role.color}`
                  }}
                >
                  <i className={`fas ${role.icon}`} style={{ fontSize: '40px', color: role.color }}></i>
                </div>
                
                <h5 className="fw-bold mb-1" style={{ color: '#2c3e50' }}>
                  {profileData?.name}
                </h5>
                
                <span 
                  className="badge mb-3"
                  style={{ 
                    backgroundColor: role.bg, 
                    color: role.color,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}
                >
                  <i className={`fas ${role.icon} mr-1`}></i>
                  {role.label}
                </span>

                <div className="mb-3">
                  <span 
                    className="badge"
                    style={{ 
                      backgroundColor: profileData?.is_active ? '#d4edda' : '#f8d7da',
                      color: profileData?.is_active ? '#155724' : '#721c24',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      border: `1px solid ${profileData?.is_active ? '#28a745' : '#dc3545'}`
                    }}
                  >
                    <i className={`fas fa-${profileData?.is_active ? 'check-circle' : 'times-circle'} mr-1`}></i>
                    {profileData?.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <hr />

                {/* Quick Info */}
                <div className="text-left">
                  <div className="mb-2">
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-id-badge mr-2"></i>ID Karyawan
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      {profileData?.employee_id || '-'}
                    </p>
                  </div>
                  <div className="mb-2">
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-envelope mr-2"></i>Email
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                      {profileData?.email || '-'}
                    </p>
                  </div>
                  <div className="mb-2">
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-phone mr-2"></i>Telepon
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                      {profileData?.phone || '-'}
                    </p>
                  </div>
                  <div className="mb-2">
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-map-marker-alt mr-2"></i>Regional
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                      {profileData?.regional ? (
                        <>{profileData.regional.province} - {profileData.regional.district}</>
                      ) : '-'}
                    </p>
                  </div>
                  <div className="mb-2">
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-clock mr-2"></i>Login Terakhir
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.85rem' }}>
                      {formatDate(profileData?.last_login)}
                    </p>
                  </div>
                  <div>
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>
                      <i className="fas fa-calendar-alt mr-2"></i>Bergabung Sejak
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.85rem' }}>
                      {formatDate(profileData?.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="col-lg-8 mb-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                    <i className="fas fa-user-edit text-primary mr-2"></i>
                    {isEditing ? 'Edit Profil' : 'Informasi Profil'}
                  </h6>
                  {!isEditing ? (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsEditing(true)}
                      style={{ borderRadius: '8px' }}
                    >
                      <i className="fas fa-edit mr-2"></i>Edit Profil
                    </button>
                  ) : (
                    <button 
                      className="btn btn-light btn-sm"
                      onClick={handleCancelEdit}
                      style={{ borderRadius: '8px' }}
                    >
                      <i className="fas fa-times mr-2"></i>Batal
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                {isEditing ? (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            <i className="fas fa-user mr-1" style={{ color: '#2ecc71' }}></i>
                            Nama Lengkap <span className="text-danger">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="name" 
                            className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                            value={formData.name} 
                            onChange={handleInputChange}
                            placeholder="Masukkan nama lengkap"
                            style={{ borderRadius: '8px' }}
                          />
                          {formErrors.name && <small className="text-danger">{formErrors.name}</small>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            <i className="fas fa-envelope mr-1" style={{ color: '#3498db' }}></i>
                            Email <span className="text-danger">*</span>
                          </label>
                          <input 
                            type="email" 
                            name="email" 
                            className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                            value={formData.email} 
                            onChange={handleInputChange}
                            placeholder="Masukkan alamat email"
                            style={{ borderRadius: '8px' }}
                          />
                          {formErrors.email && <small className="text-danger">{formErrors.email}</small>}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            <i className="fas fa-phone mr-1" style={{ color: '#9b59b6' }}></i>
                            Nomor Telepon
                          </label>
                          <input 
                            type="text" 
                            name="phone" 
                            className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                            value={formData.phone} 
                            onChange={handleInputChange}
                            placeholder="Masukkan nomor telepon"
                            style={{ borderRadius: '8px' }}
                          />
                          {formErrors.phone && <small className="text-danger">{formErrors.phone}</small>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>
                            <i className="fas fa-map-marker-alt mr-1" style={{ color: '#e74c3c' }}></i>
                            Regional <span className="text-danger">*</span>
                          </label>
                          <select 
                            name="regional_id" 
                            className={`form-control ${formErrors.regional_id ? 'is-invalid' : ''}`}
                            value={formData.regional_id} 
                            onChange={handleInputChange}
                            style={{ borderRadius: '8px' }}
                          >
                            <option value="">-- Pilih Regional --</option>
                            {regionalList.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.province} - {r.district}
                                {r.total_societies !== undefined && ` (${r.total_societies} Society)`}
                              </option>
                            ))}
                          </select>
                          {formErrors.regional_id && <small className="text-danger">{formErrors.regional_id}</small>}
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* Read-only Info */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label style={{ color: '#888', fontSize: '0.8rem' }}>
                            <i className="fas fa-id-badge mr-1"></i>ID Karyawan
                          </label>
                          <input 
                            type="text" 
                            className="form-control bg-light" 
                            value={profileData?.employee_id || ''} 
                            disabled
                            style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                          />
                          <small className="text-muted">ID Karyawan tidak dapat diubah</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label style={{ color: '#888', fontSize: '0.8rem' }}>
                            <i className="fas fa-user-tag mr-1"></i>Role
                          </label>
                          <input 
                            type="text" 
                            className="form-control bg-light" 
                            value={role.label} 
                            disabled
                            style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                          />
                          <small className="text-muted">Role tidak dapat diubah</small>
                        </div>
                      </div>
                    </div>

                    <div className="text-right mt-3">
                      <button 
                        type="button" 
                        className="btn btn-light mr-2" 
                        onClick={handleCancelEdit}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      >
                        <i className="fas fa-times mr-2"></i>Batal
                      </button>
                      <button 
                        type="submit" 
                        className="btn text-white" 
                        disabled={submitting}
                        style={{ 
                          borderRadius: '8px',
                          background: profileData?.role === 'officer'
                            ? 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' 
                            : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                          border: 'none'
                        }}
                      >
                        {submitting ? (
                          <><i className="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</>
                        ) : (
                          <><i className="fas fa-save mr-2"></i>Simpan Perubahan</>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-user mr-1"></i>Nama Lengkap
                        </label>
                        <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                          {profileData?.name || '-'}
                        </p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-envelope mr-1"></i>Email
                        </label>
                        <p style={{ fontSize: '0.95rem' }}>
                          {profileData?.email || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-phone mr-1"></i>Nomor Telepon
                        </label>
                        <p style={{ fontSize: '0.95rem' }}>
                          {profileData?.phone || '-'}
                        </p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-id-badge mr-1"></i>ID Karyawan
                        </label>
                        <p style={{ fontSize: '0.95rem' }}>
                          {profileData?.employee_id || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-map-marker-alt mr-1"></i>Regional
                        </label>
                        <p style={{ fontSize: '0.95rem' }}>
                          {profileData?.regional ? (
                            <>{profileData.regional.province} - {profileData.regional.district}</>
                          ) : '-'}
                        </p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-user-tag mr-1"></i>Role
                        </label>
                        <p style={{ fontSize: '0.95rem' }}>
                          <span 
                            className="badge"
                            style={{ 
                              backgroundColor: role.bg, 
                              color: role.color,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <i className={`fas ${role.icon} mr-1`}></i>
                            {role.label}
                          </span>
                        </p>
                      </div>
                    </div>

                    <hr />

                    {/* Account Status */}
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-clock mr-1"></i>Login Terakhir
                        </label>
                        <p style={{ fontSize: '0.9rem' }}>
                          {formatDate(profileData?.last_login)}
                        </p>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label style={{ color: '#888', fontSize: '0.8rem' }}>
                          <i className="fas fa-calendar-alt mr-1"></i>Bergabung Sejak
                        </label>
                        <p style={{ fontSize: '0.9rem' }}>
                          {formatDate(profileData?.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-white border-0 pt-4 pb-3" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="mb-0 fw-bold" style={{ color: '#2c3e50', fontSize: '1rem' }}>
                  <i className="fas fa-shield-alt text-warning mr-2"></i>
                  Keamanan Akun
                </h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="d-flex align-items-center justify-content-center mr-3"
                        style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '10px',
                          backgroundColor: '#e8f0fe'
                        }}
                      >
                        <i className="fas fa-lock" style={{ color: '#3498db', fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Password</p>
                        <small style={{ color: '#888' }}>Ubah password secara berkala</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="d-flex align-items-center justify-content-center mr-3"
                        style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '10px',
                          backgroundColor: '#e8f8f0'
                        }}
                      >
                        <i className="fas fa-history" style={{ color: '#2ecc71', fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Aktivitas Login</p>
                        <small style={{ color: '#888' }}>Pantau aktivitas login Anda</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="d-flex align-items-center justify-content-center mr-3"
                        style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '10px',
                          backgroundColor: '#fdf2e9'
                        }}
                      >
                        <i className="fas fa-sign-out-alt" style={{ color: '#e67e22', fontSize: '18px' }}></i>
                      </div>
                      <div>
                        <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Logout</p>
                        <small style={{ color: '#888' }}>Keluar dari semua sesi</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayouts>
  );
}