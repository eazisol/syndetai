import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import { useRouter } from 'next/navigation';

const OrganizationsTable = () => {
    const { searchQuery, setSearchQuery } = useApp();
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fetchOrganizations = async () => {
        try {
            setIsLoading(true);
            const { getSupabase } = await import('../supabaseClient');
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('organisations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Supabase error:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.log('Error fetching organizations:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadOrgs = async () => {
            const data = await fetchOrganizations();
            setOrganizations(data);
        };
        loadOrgs();
    }, []);

    const filteredOrganizations = organizations.filter(org =>
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.account_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleManageOrg = (orgId) => {
        router.push(`/superadmin?orgId=${orgId}`);
    };

    return (
        <div className="submissions-section">
            <div className="row g-3 mb-2 align-items-center justify-content-between">
                <div className="col-12 col-md-6">
                    <h2 className="section-title">Organizations</h2>
                </div>
                <div className="col-12 col-md-6 d-flex justify-content-end align-items-center gap-3">
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/superadmin?action=new')}
                        style={{
                            background: 'var(--primary-color, #0044EE)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '24px',
                            fontSize: '14px',
                            fontWeight: '400',
                            whiteSpace: 'nowrap',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        Add Organization
                    </button>
                    <CustomInputField
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        wrapperClassName="w-50 m-0"
                        className="w-100 m-0"
                    />
                </div>
            </div>

            <div className="table-container">
                {isLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Loading organizations...</p>
                    </div>
                ) : filteredOrganizations.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#5F6368', fontSize: '14px' }}>
                            {organizations.length === 0
                                ? 'No organizations found'
                                : 'No organizations match your search criteria'
                            }
                        </p>
                    </div>
                ) : (
                    <table className="submissions-table">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>ACCOUNT TYPE</th>
                                <th style={{ textAlign: 'center' }}>CREDITS</th>
                                <th style={{ textAlign: 'center' }}>CREATED AT</th>
                                <th style={{ textAlign: 'center' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrganizations.map((org) => (
                                <tr key={org.id}>
                                    <td>{org.name || '-'}</td>
                                    <td>{org.account_type || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{org.credit_balance ?? 0}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="link-button"
                                            onClick={() => handleManageOrg(org.id)}
                                            style={{
                                                border: 'none',
                                                background: 'var(--primary-color, #0044EE)',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default OrganizationsTable;
