import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import api from "../../services/api";

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [regionals, setRegionals] = useState([]);
    const [loadingRegionals, setLoadingRegionals] = useState(false);
    const navigate = useNavigate();
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [idCardNumber, setIdCardNumber] = useState("");
    const [name, setName] = useState("");
    const [bornDate, setBornDate] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [regionalId, setRegionalId] = useState("");

    useEffect(() => {
        fetchRegionals();
    }, []);

    const fetchRegionals = async () => {
        setLoadingRegionals(true);
        try {
            const res = await api.get("/auth/get-regional");
            setRegionals(res.data.data);
        } catch (err) {
            console.error("Failed to fetch regionals:", err);
            setError("Failed to load regional data. Please refresh the page.");
        } finally {
            setLoadingRegionals(false);
        }
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validasi password confirmation
        if (password !== passwordConfirmation) {
            setError("Password and password confirmation do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await api.post("/auth/register", {
                email: email,
                password: password,
                id_card_number: idCardNumber,
                name: name,
                born_date: bornDate,
                gender: gender,
                address: address,
                regional_id: regionalId
            });

            // Set success message
            setSuccess("Registration successful! Redirecting to dashboard...");

            // Simpan token dan data user
            const token = res.data.data.token;
            const userData = res.data.data.user;
            const profileData = res.data.data.profile;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("profile", JSON.stringify(profileData));

            // Redirect ke dashboard society setelah 1.5 detik
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);

        } catch (err) {
            if (err.response && err.response.data) {
                // Handle validation errors
                if (err.response.data.errors) {
                    const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
                    setError(errorMessages);
                } else if (err.response.data.message) {
                    setError(err.response.data.message);
                } else {
                    setError("Registration failed. Please try again.");
                }
            } else {
                setError("Network error. Please check your connection.");
            }
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
                <div className="container">
                    <a className="navbar-brand" href="#">Job Seekers Platform</a>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                        <ul className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/">Login</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register">Register</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>
                <header className="jumbotron py-4">
                    <div className="container text-center">
                        <h1 className="display-4">Job Seekers Platform</h1>
                        <p className="lead">Create your account and start your journey</p>
                    </div>
                </header>

                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <form className="card card-default" onSubmit={handleSubmit}>
                                <div className="card-header">
                                    <h4 className="mb-0">Register</h4>
                                </div>
                                <div className="card-body">
                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="alert alert-success" role="alert">
                                            {success}
                                        </div>
                                    )}
                                    
                                    <div className="row">
                                        {/* Left Column */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3 text-primary">Account Information</h5>
                                            
                                            <div className="form-group">
                                                <label>Email</label>
                                                <input 
                                                    value={email} 
                                                    onChange={(e) => setEmail(e.target.value)} 
                                                    name="email" 
                                                    type="email" 
                                                    className="form-control" 
                                                    placeholder="Enter your email"
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Password</label>
                                                <input 
                                                    value={password} 
                                                    onChange={(e) => setPassword(e.target.value)} 
                                                    name="password" 
                                                    type="password" 
                                                    className="form-control" 
                                                    placeholder="Min. 6 characters"
                                                    minLength="6"
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Confirm Password</label>
                                                <input 
                                                    value={passwordConfirmation} 
                                                    onChange={(e) => setPasswordConfirmation(e.target.value)} 
                                                    name="password_confirmation" 
                                                    type="password" 
                                                    className="form-control" 
                                                    placeholder="Confirm your password"
                                                    minLength="6"
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>ID Card Number</label>
                                                <input 
                                                    value={idCardNumber} 
                                                    onChange={(e) => setIdCardNumber(e.target.value)} 
                                                    name="id_card_number" 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="8-digit ID card number"
                                                    maxLength="8"
                                                    minLength="8"
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Gender</label>
                                                <select 
                                                    value={gender} 
                                                    onChange={(e) => setGender(e.target.value)} 
                                                    name="gender" 
                                                    className="form-control"
                                                    required
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {/* Right Column */}
                                        <div className="col-md-6">
                                            <h5 className="mb-3 text-primary">Personal Information</h5>
                                            
                                            <div className="form-group">
                                                <label>Full Name</label>
                                                <input 
                                                    value={name} 
                                                    onChange={(e) => setName(e.target.value)} 
                                                    name="name" 
                                                    type="text" 
                                                    className="form-control" 
                                                    placeholder="Enter your full name"
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Birth Date</label>
                                                <input 
                                                    value={bornDate} 
                                                    onChange={(e) => setBornDate(e.target.value)} 
                                                    name="born_date" 
                                                    type="date" 
                                                    className="form-control" 
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Regional</label>
                                                <select 
                                                    value={regionalId} 
                                                    onChange={(e) => setRegionalId(e.target.value)} 
                                                    name="regional_id" 
                                                    className="form-control"
                                                    required
                                                    disabled={loadingRegionals}
                                                >
                                                    <option value="">
                                                        {loadingRegionals ? "Loading regionals..." : "Select Regional"}
                                                    </option>
                                                    {regionals.map((regional) => (
                                                        <option key={regional.id} value={regional.id}>
                                                            {regional.province} - {regional.district}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="form-group mt-3">
                                                <label>Address</label>
                                                <textarea 
                                                    value={address} 
                                                    onChange={(e) => setAddress(e.target.value)} 
                                                    name="address" 
                                                    className="form-control" 
                                                    placeholder="Enter your complete address"
                                                    rows="3"
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row mt-4">
                                        <div className="col-12">
                                            <div className="text-center">
                                                <button 
                                                    className="btn btn-primary px-5" 
                                                    type="submit" 
                                                    disabled={loading || success !== "" || loadingRegionals}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                                                            Registering...
                                                        </>
                                                    ) : "Register"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-center mt-3">
                                        <span>Already have an account? </span>
                                        <Link to="/">
                                            Login here
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <div className="container">
                    <div className="text-center py-4 text-muted">
                        Copyright &copy; 2023 - Web Tech ID
                    </div>
                </div>
            </footer>
        </>
    )
}