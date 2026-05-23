import React, { useEffect, useState } from 'react'
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [validation, setValidation] = useState(null);
    const [applications, setApplications] = useState(null);

    const handleLogout = async(e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            if(!token) throw new Error("Token not found");

            await api.post(`/auth/logout?token=${token}`);

            localStorage.clear();
            navigate("/");
        } catch (err) {
            console.log(err)
        }
    }


    useEffect(() => {
        const fetchData = async() => {
            try {
                const token = localStorage.getItem("token");
                if(!token) throw new Error("Token not found");

                const resValid = await api.get(`/validations?token=${token}`);
                setValidation(resValid.data.validation);

                const res = await api.get(`/applications?token=${token}`);
                setApplications(res.data.vacancies)
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <div className="container mt-5">Loading...</div>;
    }

    const renderStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <span className="badge badge-info">Pending</span>;
            case "accepted":
                return <span className="badge badge-success">Accepted</span>;
            case "rejected":
                return <span className="badge badge-danger">Rejected</span>;
            default:
                return <span className="badge badge-secondary">{status}</span>;
        }
    };
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
                                <a className="nav-link" href="#">Marsito Kusmawati</a>
                            </li>
                            <li className="nav-item">
                                <button onClick={handleLogout} className="btn btn-primary" >Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <main className="mt-5">
                <header className="jumbotron mt-2">
                    <div className="container">
                        <h1 className="display-4">Dashboard</h1>
                    </div>
                </header>

                <div className="container">

                    <section className="validation-section mb-5">
                        <div className="section-header mb-3">
                            <h4 className="section-title text-muted">My Data Validation</h4>
                        </div>
                        <div className="row">
                            {!validation && (
                                <div className="col-md-4">
                                    <div className="card card-default">
                                        <div className="card-header">
                                            <h5 className="mb-0">Data Validation</h5>
                                        </div>
                                        <div className="card-body">
                                            <a href="" className="btn btn-primary btn-block">+ Request validation</a>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {validation && (
                                <div className="col-md-6">
                                    <div className="card card-default">
                                        <div className="card-header border-0">
                                            <h5 className="mb-0">Data Validation</h5>
                                        </div>
                                        <div className="card-body p-0">
                                            <table className="table table-striped mb-0">
                                                <tbody>
                                                    <tr>
                                                        <th>Status</th>
                                                        <td>{renderStatusBadge(validation.status)}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Job Category</th>
                                                        <td className="text-muted">{validation.job_category_id || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Job Position</th>
                                                        <td className="text-muted">{validation.job_position || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Reason Accepted</th>
                                                        <td className="text-muted">{validation.reason_accepted || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Validator</th>
                                                        <td className="text-muted">{validation.validator || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Validator Notes</th>
                                                        <td className="text-muted">{validation.validator_notes || "-"}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </section>
                    <section className="validation-section mb-5">
                        <div className="section-header mb-3">
                            <div className="row">
                                <div className="col-md-8">
                                    <h4 className="section-title text-muted">My Job Applications</h4>
                                </div>
                                <div className="col-md-4">
                                    {validation?.status === "accepted" && (
                                        <a href="/job-vacancies" className="btn btn-primary btn-lg btn-block">
                                            + Add Job Applications
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="row mb-4">

                                {( !validation || validation.status !== "accepted") && (
                                    <div className="col-md-12">
                                        <div className="alert alert-warning">
                                            Your data validation must be approved by validator to get the applying job.
                                        </div>
                                    </div>
                                )}

                                {/* Render job applications jika ada */}
                                {applications.length === 0 && validation?.status === "accepted" && (
                                    <div className="col-md-12">
                                        <div className="alert alert-info">
                                            You haven't applied for any jobs yet.
                                        </div>
                                    </div>
                                )}

                                {applications.map((app) => (
                                    <div className="col-md-6" key={app.id}>
                                        <div className="card card-default">
                                            <div className="card-header border-0">
                                                <h5 className="mb-0">{app.company_name}</h5>
                                            </div>
                                            <div className="card-body p-0">
                                                <table className="table table-striped mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <th>Address</th>
                                                            <td className="text-muted">{app.company_address}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Position</th>
                                                            <td className="text-muted">
                                                                <ul>
                                                                    {app.positions.map((pos, idx) => (
                                                                        <li key={idx}>
                                                                            {pos.position}{" "}
                                                                            {renderStatusBadge(pos.status)}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <th>Apply Date</th>
                                                            <td className="text-muted">{app.apply_date}</td>
                                                        </tr>
                                                        <tr>
                                                            <th>Notes</th>
                                                            <td className="text-muted">{app.notes || "-"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
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
