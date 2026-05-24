import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import api from "../../services/api";

export default function Login() {
    const [loading, setloading] = useState(false);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e) => {
        e.preventDefault();
        setloading(true);

        try {
            const res = await api.post("/auth/login", {
                id_card_number : email,
                password
            });

            const token = res.data.token;
            localStorage.setItem("token", token);
            navigate("/dashboard");
        } catch (err) {
            console.log(err)
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
                                    <div className="form-group row align-items-center">
                                        <div className="col-4 text-right">ID Card Number</div>
                                        <div className="col-8"><input value={email} onChange={(e) => setEmail(e.target.value)} name="email" type="text" className="form-control" /></div>
                                    </div>
                                    <div className="form-group row align-items-center mt-3">
                                        <div className="col-4 text-right">Password</div>
                                        <div className="col-8"><input value={password} onChange={(e) => setPassword(e.target.value)} name="password" type="password" className="form-control" /></div>
                                    </div>
                                    <div className="form-group row align-items-center mt-4">
                                        <div className="col-4"></div>
                                        <div className="col-8"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button></div>
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
