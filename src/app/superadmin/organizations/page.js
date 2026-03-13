"use client";
import MobileHeader from "../../../components/MobileHeader";
import Sidebar from "../../../components/Sidebar";
import OrganizationsTable from "../../../components/OrganizationsTable";
import Protected from "../../../components/Protected";

export default function OrganizationsPage() {
    return (
        <Protected requireSuperadmin>
            <div className="app">
                <MobileHeader />
                <div className="app-content">
                    <div className="desktop-sidebar">
                        <Sidebar />
                    </div>
                    <div className="main-content-library">
                        <OrganizationsTable />
                    </div>
                </div>
            </div>
        </Protected>
    );
}
