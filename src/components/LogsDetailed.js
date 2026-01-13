"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import CustomInputField from "./CustomInputField";
import { useApp } from "@/context/AppContext";
import { getSupabase } from "@/supabaseClient";

export default function LogsDetailed() {
  // const searchParams = useSearchParams();
  // const uuid = searchParams?.get("uuid");
  const { searchQuery, setSearchQuery, userData } = useApp();

  // State for real data
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch logs from Supabase
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const supabase = getSupabase();

        // Fetch event_logs
        const { data: eventLogsData, error: logsError } = await supabase
          .from("event_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (logsError) {
          throw logsError;
        }

        if (!eventLogsData || eventLogsData.length === 0) {
          setLogs([]);
          setIsLoading(false);
          return;
        }
        console.log(eventLogsData, "eventLogsData");
        // Get unique company_ids from event_logs
        const companyIds = [...new Set(eventLogsData.map(log => log.company_id).filter(Boolean))];
        console.log(companyIds, "companyIds");
        // Fetch company_people data for these company_ids
        const { data: companyPeopleData, error: peopleError } = await supabase
          .from("company_people")
          .select("company_id, full_name")
          .in("company_id", companyIds);

        if (peopleError) {
          // console.error("Error fetching company people:", peopleError);
          // Continue even if we can't fetch company names
        }
        console.log(companyPeopleData, "companyPeopleData");
        // Create a lookup map: company_id -> full_name
        const companyNameMap = {};
        if (companyPeopleData) {
          companyPeopleData.forEach(person => {
            if (person.company_id && !companyNameMap[person.company_id]) {
              companyNameMap[person.company_id] = person.full_name;
            }
          });
        }
        console.log(companyNameMap, "companyNameMap");
        // Combine event_logs with company names
        const enrichedLogs = eventLogsData.map(log => ({
          ...log,
          company_name: companyNameMap[log.company_id] || "N/A"
        }));
        console.log(enrichedLogs, "enrichedLogs");
        setLogs(enrichedLogs);
      } catch (err) {
        // console.error("Error fetching logs:", err);
        setError(err.message || "Failed to fetch logs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();

    // Set up real-time subscription
    const supabase = getSupabase();
    const channel = supabase
      .channel("event_logs_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "event_logs",
        },
        async (payload) => {
          console.log("Real-time update:", payload);

          // Refetch all logs to get updated data
          fetchLogs();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Format date for display (YYYY-MM-DD)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const companyName = log.company_name || "";
    const userId = log.user_id || "";
    const ipAddress = log.ip_address || "";

    return (
      companyName.toLowerCase().includes(searchLower) ||
      userId.toLowerCase().includes(searchLower) ||
      ipAddress.toLowerCase().includes(searchLower)
    );
  });

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
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            Loading logs...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
            Error: {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            {searchQuery ? "No logs match your search" : "No logs found"}
          </div>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>User ID</th>
                <th style={{ textAlign: "center" }}>Date</th>
                {/* <th style={{ textAlign: "center" }}>Report</th> */}
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.company_name || "N/A"}</td>
                  <td>{log.user_id || "N/A"}</td>
                  <td style={{ textAlign: "center" }}>
                    {formatDate(log.created_at)}
                  </td>
                  {/* <td style={{ textAlign: "center" }}>
                    <a href="#" className="link-button" title="View Report">
                      <Eye className="action-icon" />
                    </a>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
