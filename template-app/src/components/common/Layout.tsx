import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout">
            <header>
                <h1>Template App</h1>
            </header>
            <main>{children}</main>
            <footer>
                <p>&copy; {new Date().getFullYear()} Template App. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout;