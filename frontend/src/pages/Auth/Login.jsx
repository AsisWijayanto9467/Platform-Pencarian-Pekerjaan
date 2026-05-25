import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import api from "../../services/api";

export default function Login() {
    const [loading, setloading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e) => {
        e.preventDefault();
        setloading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", {
                email: email,
                password: password
            });

            const token = res.data.data.token;
            const userData = res.data.data.user;
            const profileData = res.data.data.profile;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("profile", JSON.stringify(profileData));

            switch (userData.role) {
                case 'admin':
                    navigate("/admin/dashboard");
                    break;
                case 'officer':
                    navigate("/officer/dashboard");
                    break;
                case 'validator':
                    navigate("/validator/dashboard");
                    break;
                case 'society':
                    navigate("/dashboard");
                    break;
                default:
                    navigate("/dashboard");
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Login failed. Please try again.");
            }
            console.log(err);
        } finally {
            setloading(false);
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
                                <a className="nav-link" href="#">Login</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main>
                <header className="jumbotron">
                    <div className="container text-center">
                        <h1 className="display-4">Job Seekers Platform</h1>
                    </div>
                </header>

                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-6">
                            <form className="card card-default" onSubmit={handleSubmit}>
                                <div className="card-header">
                                    <h4 className="mb-0">Login</h4>
                                </div>
                                <div className="card-body">
                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}
                                    <div className="form-group row align-items-center">
                                        <div className="col-4 text-right">Email</div>
                                        <div className="col-8">
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
                                    </div>
                                    <div className="form-group row align-items-center mt-3">
                                        <div className="col-4 text-right">Password</div>
                                        <div className="col-8">
                                            <input 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                name="password" 
                                                type="password" 
                                                className="form-control" 
                                                placeholder="Enter your password"
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group row align-items-center mt-4">
                                        <div className="col-4"></div>
                                        <div className="col-8">
                                            <button 
                                                className="btn btn-primary" 
                                                type="submit" 
                                                disabled={loading}
                                            >
                                                {loading ? "Logging in..." : "Login"}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <span>Don't have account? </span>
                                        <Link to="/register">
                                            Register here
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