'use client';

import React from "react";
import { useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";

export default function LogsDetailed({ companyId, pdfUrl }) {
  const searchParams = useSearchParams();
  const uuid = searchParams?.get("uuid");

  // ✅ Dummy data array
  const dummyLogs = [
    {
      company_id: "Company A",
      user_id: "viewer_001",
      date: "2026-01-05",
    },
    {
      company_id: "Company B",
      user_id: "viewer_002",
      date: "2026-01-07",
    },
    {
      company_id: "Company c",
      user_id: "viewer_003",
      date: "2026-01-09",
    },
  ];

  return (
    <div className="submissions-section">
<div className="row g-3 mb-2 align-items-center justify-content-between">
        <div className="col-12 col-md-6">
          <h2 className="section-title">Logs Viewer</h2>
        </div>
        <div className="col-12 col-md-6 text-end">
          <CustomInputField
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-50"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>User ID</th>
              <th style={{ textAlign: "center" }}>Date</th>
              <th style={{ textAlign: "center" }}>Report</th>
            </tr>
          </thead>

          <tbody>
            {dummyLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.company_id}</td>
                <td>{log.ip_address}</td>
                <td>{log.user_id}</td>
                <td style={{ textAlign: "center" }}>{log.date}</td>
                <td style={{ textAlign: "center" }}>
                  <a href="#" className="link-button" title="View Report">
                    <Eye className="action-icon" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
