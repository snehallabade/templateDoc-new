import React from 'react';
import { Link } from 'react-router-dom';

const Navigation: React.FC = () => {
    return (
        <nav className="vertical-nav">
            <ul>
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <Link to="/dashboard/templates">My Templates</Link>
                </li>
                <li>
                    <Link to="/dashboard/upload">Upload Template</Link>
                </li>
                <li>
                    <Link to="/logout">Logout</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navigation;