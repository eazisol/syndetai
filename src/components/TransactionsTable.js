'use client';

import React, { useEffect, useState } from 'react';

const TransactionsTable = ({ organisationId = null, title = 'Transactions', wrapperClassName = '' }) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async (orgId) => {
    const { getSupabase } = await import('../supabaseClient');
    const supabase = getSupabase();
    let query = supabase
      .from('transactions')
      .select(`
        id,
        credits_added,
        amount,
        organisation_id,
        payment_intent,
        created_at,
        organisations!inner(name)
      `)
      .order('created_at', { ascending: false });
    if (orgId) {
      query = query.eq('organisation_id', orgId);
    }
    const { data, error } = await query;
    if (error) {
      console.log('Supabase error:', error);
      return [];
    }
    return data || [];
  };

  useEffect(() => {
    let isCurrent = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchTransactions(organisationId);
        if (isCurrent) setTransactions(data);
      } catch (e) {
        if (isCurrent) setTransactions([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    })();
    return () => { isCurrent = false; };
  }, [organisationId]);

  return (
    <div className={`superadmin-reports mt-4 ${wrapperClassName}`.trim()}>
      <div className="row g-3 mb-2 align-items-center justify-content-between">
        <div className="col-12 col-md-6">
          <h3 className="subsection-title superadmin-report">{title}</h3>
        </div>
      </div>

      <div className="table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>ORGANIZATION</th>
              <th>PAYMENT INTENT</th>
              <th style={{ textAlign: 'center', width: '100px' }}>AMOUNT</th>
              <th style={{ textAlign: 'center', width: '120px' }}>CREDITS ADDED</th>
              <th style={{ textAlign: 'center' }}>CREATED AT</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>
                  Loading transactions...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.organisations?.name || ''}</td>
                  <td>{t.payment_intent || ''}</td>
                  <td style={{ textAlign: 'center', width: '100px' }}>{t.amount ? `£${parseFloat(t.amount).toFixed(2)}` : ''}</td>
                  <td style={{ textAlign: 'center', width: '120px' }}>{t.credits_added ?? ''}</td>
                  <td style={{ textAlign: 'center' }}>{t.created_at ? t.created_at.split('T')[0] : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsTable;


