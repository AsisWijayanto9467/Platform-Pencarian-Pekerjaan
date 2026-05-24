import React from "react";

export default function VacancyDetail() {
    return (
        <>
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-primary">
            <div className="container">
            <a className="navbar-brand" href="#">
                Job Seekers Platform
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
                    Marsito Kusmawati
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">
                    Logout
                    </a>
                </li>
                </ul>
            </div>
            </div>
        </nav>

        <main>
            <header className="jumbotron">
            <div className="container text-center">
                <div>
                <h1 className="display-4">PT. Maju Mundur Sejahtera</h1>
                <span className="text-muted">
                    Jln. HOS. Cjokroaminoto (Pasirkaliki) No. 900, DKI Jakarta
                </span>
                </div>
            </div>
            </header>

            <div className="container">
            <div className="row mb-3">
                <div className="col-md-12">
                <div className="form-group">
                    <h3>Description</h3>
                    some description of job vacancy
                </div>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-12">
                <div className="form-group">
                    <h3>Select position</h3>
                    <table className="table table-bordered table-hover table-striped">
                    <tr>
                        <th width="1">#</th>
                        <th>Position</th>
                        <th>Capacity</th>
                        <th>Application / Max</th>
                        <th
                        
                        width="1"
                        >
                        <a href="" className="btn btn-primary btn-lg">
                            Apply for this job
                        </a>
                        </th>
                    </tr>
                    <tr>
                        <td>
                        <input type="checkbox" />
                        </td>
                        <td>Desain Grafis</td>
                        <td>3</td>
                        <td>6/12</td>
                    </tr>
                    <tr>
                        <td>
                        <input type="checkbox" />
                        </td>
                        <td>Programmer</td>
                        <td>1</td>
                        <td>3/8</td>
                    </tr>
                    <tr className="table-warning">
                        <td>
                        <input type="checkbox" disabled />
                        </td>
                        <td>Manager</td>
                        <td>1</td>
                        <td>22/22</td>
                    </tr>
                    </table>
                </div>
                </div>

                <div className="col-md-12">
                <div className="form-group">
                    <div className="d-flex align-items-center mb-3">
                    <label className="mr-3 mb-0">Notes for Company</label>
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
