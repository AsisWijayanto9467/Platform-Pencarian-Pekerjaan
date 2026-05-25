import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function SocietyLayouts({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [ setShowNotificationDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const userDropdownRef = useRef(null);
    const notifDropdownRef = useRef(null);
    
    const [user] = useState(() => {
        try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}");
            const profileData = JSON.parse(localStorage.getItem("profile") || "{}");
            
            return {
                name: userData.name || profileData.name || "User",
                role: userData.role || "society",
                email: userData.email || "",
                profile: profileData
            };
        } catch (error) {
            console.error("Error parsing user data:", error);
            return {
                name: "User",
                role: "society"
            };
        }
    });

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setShowNotificationDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch unread notifications count
    useEffect(() => {
        fetchUnreadCount();
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get("/society/notifications?is_read=0&per_page=1");
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const handleLogout = async () => {
        try {
            // Panggil API logout
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout API failed:", err);
            // Tetap lanjutkan logout meskipun API gagal
        } finally {
            // Hapus semua data localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("profile");
            // Atau gunakan clear() untuk menghapus semua
            // localStorage.clear();
            
            setShowLogoutPopup(false);
            setShowUserDropdown(false);
            
            // Redirect ke halaman login
            navigate("/");
            
            // Force reload untuk membersihkan state
            window.location.href = "/";
        }
    };

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    // Society Menu Items (untuk navbar)
    const menuItems = useMemo(() => [
        {
            title: 'Dashboard',
            icon: 'fas fa-tachometer-alt',
            path: '/dashboard',
        },
        {
            title: 'Profil Saya',
            icon: 'fas fa-user-circle',
            path: '/profile',
        },
        {
            title: 'Validasi',
            icon: 'fas fa-clipboard-check',
            path: '/validation',
        },
        {
            title: 'Lowongan',
            icon: 'fas fa-briefcase',
            path: '/job-vacancies',
        },
        {
            title: 'Lamaran',
            icon: 'fas fa-file-alt',
            path: '/application',
        },
        {
            title: 'Riwayat',
            icon: 'fas fa-history',
            path: '/history',
        },
    ], []);


    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Navbar - Fixed Top */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
                <div className="container">
                    <Link className="navbar-brand d-flex align-items-center" to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <div className="bg-white rounded d-flex align-items-center justify-content-center mr-2" 
                             style={{ width: '32px', height: '32px' }}>
                            <i className="fas fa-briefcase text-primary" style={{ fontSize: '16px' }}></i>
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>JobPortal</span>
                    </Link>
                    
                    {/* Mobile Toggle Button */}
                    <button 
                        className="navbar-toggler border-0" 
                        type="button" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ padding: '4px 8px' }}
                    >
                        <i className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'} text-white`} style={{ fontSize: '20px' }}></i>
                    </button>
                    
                    {/* Navbar Content */}
                    <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            {menuItems.map((item, index) => (
                                <li className="nav-item" key={index}>
                                    <Link
                                        to={item.path}
                                        className={`nav-link d-flex align-items-center px-3 py-2 mx-1 rounded ${
                                            isActive(item.path) ? 'active' : ''
                                        }`}
                                        style={{
                                            fontSize: '0.9rem',
                                            fontWeight: isActive(item.path) ? '600' : '400',
                                            transition: 'all 0.2s ease',
                                            color: '#fff',
                                            backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.25)' : 'transparent'
                                        }}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <i className={`${item.icon} mr-2`} style={{ fontSize: '14px' }}></i>
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        
                        <div className="d-flex align-items-center ml-lg-3 mt-2 mt-lg-0">
                            {/* Notifications Button */}
                            <div className="position-relative" ref={notifDropdownRef}>
                                <Link 
                                    to="/notifications" 
                                    className="btn btn-link text-white position-relative mr-2"
                                    style={{ textDecoration: 'none', padding: '8px 10px' }}
                                    title="Notifikasi"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <i className="fas fa-bell" style={{ fontSize: '18px' }}></i>
                                    {unreadCount > 0 && (
                                        <span className="badge badge-danger position-absolute" 
                                              style={{ 
                                                  top: '2px', 
                                                  right: '2px', 
                                                  fontSize: '10px',
                                                  padding: '3px 5px',
                                                  lineHeight: '1'
                                              }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </div>

                            {/* User Dropdown - Manual Toggle */}
                            <div className="position-relative" ref={userDropdownRef}>
                                <button 
                                    className="btn btn-link text-white d-flex align-items-center"
                                    type="button"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    style={{ textDecoration: 'none', padding: '8px 10px' }}
                                >
                                    <div 
                                        className="rounded-circle bg-white d-flex align-items-center justify-content-center mr-2"
                                        style={{ width: '30px', height: '30px' }}
                                    >
                                        <span className="text-primary fw-bold" style={{ fontSize: '14px' }}>
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="d-none d-md-inline text-white" style={{ fontSize: '0.9rem' }}>
                                        {user?.name || 'User'}
                                    </span>
                                    <i className={`fas fa-chevron-${showUserDropdown ? 'up' : 'down'} ml-2`} style={{ fontSize: '10px' }}></i>
                                </button>
                                
                                {/* Dropdown Menu - Manual Show/Hide */}
                                {showUserDropdown && (
                                    <div 
                                        className="dropdown-menu dropdown-menu-right shadow border-0 show"
                                        style={{ 
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px', 
                                            borderRadius: '8px', 
                                            minWidth: '220px',
                                            zIndex: 1000
                                        }}
                                    >
                                        <div className="px-3 py-2 border-bottom">
                                            <p className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{user?.name || 'User'}</p>
                                            <small className="text-muted" style={{ fontSize: '0.8rem' }}>{user?.email || ''}</small>
                                        </div>
                                        <Link 
                                            className="dropdown-item py-2" 
                                            to="/profile"
                                            onClick={() => setShowUserDropdown(false)}
                                        >
                                            <i className="fas fa-user-circle mr-2 text-primary"></i>Profil Saya
                                        </Link>
                                        <Link 
                                            className="dropdown-item py-2" 
                                            to="/validation"
                                            onClick={() => setShowUserDropdown(false)}
                                        >
                                            <i className="fas fa-clipboard-check mr-2 text-success"></i>Status Validasi
                                        </Link>
                                        <Link 
                                            className="dropdown-item py-2" 
                                            to="/bookmarks"
                                            onClick={() => setShowUserDropdown(false)}
                                        >
                                            <i className="fas fa-bookmark mr-2 text-warning"></i>Bookmark
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button 
                                            className="dropdown-item py-2 text-danger"
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                setShowLogoutPopup(true);
                                            }}
                                        >
                                            <i className="fas fa-sign-out-alt mr-2"></i>Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow-1" style={{ 
                backgroundColor: '#f5f5f5', 
                paddingTop: '76px',
                paddingBottom: '24px'
            }}>

                {/* Page Content */}
                <div className="container">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-top mt-auto">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                            &copy; 2026 JobPortal - Sistem Pencari Kerja
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                            <i className="fas fa-shield-alt mr-1"></i>
                            Sistem Terproteksi
                        </small>
                    </div>
                </div>
            </footer>

            {/* Logout Confirmation Popup */}
            {showLogoutPopup && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px'
                    }}
                    onClick={() => setShowLogoutPopup(false)}
                >
                    <div 
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '32px',
                            width: '420px',
                            maxWidth: '100%',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                            textAlign: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <i className="fas fa-sign-out-alt"
                               style={{ 
                                   fontSize: '48px', 
                                   color: '#dc3545',
                                   backgroundColor: '#f8d7da',
                                   padding: '16px',
                                   borderRadius: '50%'
                               }} 
                            />
                        </div>
                        
                        <h5 style={{ marginBottom: '12px', fontWeight: 'bold', color: '#333', fontSize: '1.25rem' }}>
                            Konfirmasi Logout
                        </h5>
                        
                        <p style={{ color: '#666', marginBottom: '6px', fontSize: '1rem' }}>
                            Apakah Anda yakin ingin keluar?
                        </p>
                        <small style={{ color: '#999', display: 'block', marginBottom: '24px', fontSize: '0.9rem' }}>
                            Anda akan diarahkan ke halaman login
                        </small>
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowLogoutPopup(false)}
                                className="btn btn-light"
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    minWidth: '110px',
                                    borderRadius: '8px'
                                }}
                            >
                                <i className="fas fa-times mr-2"></i>
                                Batal
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-danger"
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '0.95rem',
                                    minWidth: '110px',
                                    borderRadius: '8px'
                                }}
                            >
                                <i className="fas fa-check mr-2"></i>
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .navbar-dark .navbar-nav .nav-link {
                    color: rgba(255,255,255,0.85);
                }
                
                .navbar-dark .navbar-nav .nav-link:hover {
                    color: #fff;
                    background-color: rgba(255,255,255,0.1);
                }
                
                .navbar-dark .navbar-nav .nav-link.active {
                    background-color: rgba(255,255,255,0.25) !important;
                    color: #fff !important;
                }
                
                .dropdown-item {
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                
                .dropdown-item:hover {
                    background-color: #f8f9fa;
                }
                
                .dropdown-menu.show {
                    display: block;
                }
                
                @media (max-width: 991px) {
                    .navbar-collapse {
                        background-color: #2c3e50;
                        border-radius: 0 0 12px 12px;
                        padding: 12px;
                        margin-top: 8px;
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    }
                    
                    .navbar-nav {
                        gap: 4px;
                    }
                    
                    .navbar-nav .nav-link {
                        border-radius: 8px !important;
                        padding: 10px 16px !important;
                    }
                    
                    .dropdown-menu.show {
                        position: static !important;
                        background-color: #34495e;
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    
                    .dropdown-menu .dropdown-item {
                        color: #fff;
                    }
                    
                    .dropdown-menu .dropdown-item:hover {
                        background-color: rgba(255,255,255,0.1);
                        color: #fff;
                    }
                    
                    .dropdown-menu .text-muted {
                        color: rgba(255,255,255,0.6) !important;
                    }
                    
                    .dropdown-menu .border-bottom {
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                }
            `}</style>
        </div>
    );
}