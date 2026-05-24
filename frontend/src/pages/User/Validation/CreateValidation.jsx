import React from "react";

export default function CreateValidation() {
    return (
        <>
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
            <div className="container">
            <a className="navbar-brand" href="#">
                Job Seeker Platform
            </a>
            <button
                className="navbar-toggler"
                type="button"
                data-toggle="collapse"
                data-target="#navbarsExampleDefault"
                aria-controls="navbarsExampleDefault"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                    <a className="nav-link" href="#">
                    Login
                    </a>
                </li>
                </ul>
            </div>
            </div>
        </nav>

        <main>
            <header className="jumbotron">
            <div className="container">
                <h1 className="display-4">Request Data Validation</h1>
            </div>
            </header>

            <div className="container">
            <form action="">
                <div className="row mb-4">
                <div className="col-md-6">
                    <div className="form-group">
                    <div className="d-flex align-items-center mb-3">
                        <label className="mr-3 mb-0">Job Category</label>
                        <select className="form-control-sm">
                        <option value="1">Computing and ICT</option>
                        <option value="2">Construction and building</option>
                        <option value="3">Animals, land and environment</option>
                        <option value="4">Design, arts and crafts</option>
                        <option value="5">Education and training</option>
                        </select>
                    </div>
                    <textarea
                        className="form-control"
                        cols="30"
                        rows="5"
                        placeholder="Job position sparate with , (comma)"
                    ></textarea>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="form-group">
                    <div className="d-flex align-items-center mb-3">
                        <label className="mr-3 mb-0">Work Experiences ?</label>
                        <select className="form-control-sm">
                        <option value="yes">Yes, I have</option>
                        <option value="no">No</option>
                        </select>
                    </div>
                    <textarea
                        className="form-control"
                        cols="30"
                        rows="5"
                        placeholder="Describe your work experiences"
                    ></textarea>
                    </div>
                </div>

                <div className="col-md-12">
                    <div className="form-group">
                    <div className="d-flex align-items-center mb-3">
                        <label className="mr-3 mb-0">Reason Accepted</label>
                    </div>
                    <textarea
                        className="form-control"
                        cols="30"
                        rows="6"
                        placeholder="Explain why you should be accepted"
                    ></textarea>
                    </div>
                </div>
                </div>

                <button className="btn btn-primary">Send Request</button>
            </form>
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
    );
}
