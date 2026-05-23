import React from "react";

export default function VacancyList() {
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
                    Marsito Kusmawati
                    </a>
                </li>
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
                <h1 className="display-4">Job Vacancies</h1>
            </div>
            </header>

            <div className="container mb-5">
            <div className="section-header mb-4">
                <h4 className="section-title text-muted font-weight-normal">
                List of Job Vacancies
                </h4>
            </div>

            <div className="section-body">
                <article className="spot">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <button className="btn btn-danger btn-lg btn-block">
                        Detail / Apply
                    </button>
                    </div>
                </div>
                </article>

                <article className="spot unavailable">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <div className="bg-success text-white p-2">
                        Vacancies have been submitted
                    </div>
                    </div>
                </div>
                </article>

                <article className="spot">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <button className="btn btn-danger btn-lg btn-block">
                        Detail / Apply
                    </button>
                    </div>
                </div>
                </article>
                <article className="spot">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <button className="btn btn-danger btn-lg btn-block">
                        Detail / Apply
                    </button>
                    </div>
                </div>
                </article>
                <article className="spot">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <button className="btn btn-danger btn-lg btn-block">
                        Detail / Apply
                    </button>
                    </div>
                </div>
                </article>
                <article className="spot">
                <div className="row">
                    <div className="col-5">
                    <h5 className="text-primary">PT. Maju Mundur Sejahtera</h5>
                    <span className="text-muted">
                        Ds. Abdullah No. 31, DKI Jakarta
                    </span>
                    </div>
                    <div className="col-4">
                    <h5>Available Position (Capacity)</h5>
                    <span className="text-muted">
                        Desain Grafis (3), Programmer (1), Manager (1)
                    </span>
                    </div>
                    <div className="col-3">
                    <button className="btn btn-danger btn-lg btn-block">
                        Detail / Apply
                    </button>
                    </div>
                </div>
                </article>
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
