'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import MobileHeader from '../../components/MobileHeader';
import Sidebar from '../../components/Sidebar';
import Protected from '../../components/Protected';
import { Loader2, Search, Filter, ShoppingCart, Eye, Download, Globe, Tag, Briefcase } from 'lucide-react';

function StoreContent() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchStoreItems = async () => {
    try {
      setIsLoading(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      
      // We need to fetch from store_items, join reports (investor variant), and then join companies
      // Since it's syndet schema and standard Supabase client, we'll try dot notation if FKs exist
      // If not, we might need to fetch and manual join, but we'll try a clean select first
      const { data, error } = await supabase
        .from('store_items')
        .select(`
          *,
          reports!inner (
            id,
            company_id,
            report_type,
            status,
            persona_variant,
            generated_at,
            companies!inner (
              name,
              sector,
              geography
            )
          )
        `)
        .eq('is_active', true)
        .eq('reports.persona_variant', 'investor')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching store items:', error);
        // Fallback or empty state
        setItems([]);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.log('Unexpected error in fetchStoreItems:', error);
      toast.error('Failed to load store items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreItems();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.reports?.companies?.name?.toLowerCase().includes(q) ||
        item.summary_line?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    
    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    return result;
  }, [items, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(['All']);
    items.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [items]);

  return (
    <Protected>
      <div className="app">
        <MobileHeader />
        <div className="app-content">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="main-content">
            <div className="container-page">
              <header className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="section-title mb-1">Company Store</h2>
                  <p className="text-muted small">Access premium intelligence reports for the modern ecosystem</p>
                </div>
                
                <div className="d-flex gap-3">
                  <select 
                    className="form-input"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ width: '180px' }}
                  >
                    <option value="All">All Categories</option>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <div className="search-box-wrapper" style={{ position: 'relative', width: '300px' }}>
                    <Search 
                      size={16} 
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} 
                    />
                    <input 
                      type="text"
                      placeholder="Search reports, sectors..."
                      className="form-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              </header>

              <div className="table-container" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="submissions-table w-100 mb-0">
                    <thead>
                      <tr>
                        <th style={{ padding: '16px' }}>COMPANY</th>
                        <th>REPORT TYPE</th>
                        <th>SUMMARY</th>
                        <th>SECTOR / GEOGRAPHY</th>
                        <th>TAGS</th>
                        <th>DATE</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '80px', textAlign: 'center' }}>
                            <Loader2 className="animate-spin d-inline-block text-primary mb-2" size={32} />
                            <p className="text-muted">Loading available reports...</p>
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>
                            <p className="text-muted mb-0">no data found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '16px' }}>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="me-3 d-flex align-items-center justify-content-center bg-primary rounded-circle" 
                                  style={{ width: '32px', height: '32px', color: 'white', fontSize: '12px', fontWeight: 'bold' }}
                                >
                                  {item.reports?.companies?.name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                  <div className="fw-bold text-primary">{item.reports?.companies?.name || 'Unknown Company'}</div>
                                  <div className="small text-muted">{item.category}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge rounded-pill" style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>
                                {item.reports?.report_type || 'Standard'}
                              </span>
                            </td>
                            <td style={{ maxWidth: '250px' }}>
                              <div className="text-truncate-2 small" title={item.summary_line}>
                                {item.summary_line || 'No summary available.'}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <div className="small d-flex align-items-center">
                                  <Briefcase size={12} className="me-1 text-muted" />
                                  {item.reports?.companies?.sector || 'N/A'}
                                </div>
                                <div className="small d-flex align-items-center text-muted">
                                  <Globe size={12} className="me-1" />
                                  {item.reports?.companies?.geography || 'Global'}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {item.tags?.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="small bg-light px-2 py-0 rounded text-muted" style={{ fontSize: '10px' }}>
                                    #{tag}
                                  </span>
                                ))}
                                {item.tags?.length > 2 && <span className="small text-muted" style={{ fontSize: '10px' }}>+{item.tags.length - 2}</span>}
                              </div>
                            </td>
                            <td className="small text-muted">
                              {item.reports?.generated_at ? new Date(item.reports.generated_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <span className="badge rounded-pill bg-light text-dark border px-2 py-1" style={{ fontSize: '10px' }}>
                                {item.reports?.status || 'Available'}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <button className="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center px-3" style={{ fontSize: '12px' }}>
                                  <Eye size={14} className="me-1" /> View
                                </button>
                                <button className="btn btn-sm btn-primary rounded-pill d-flex align-items-center px-3" style={{ fontSize: '12px' }}>
                                  <ShoppingCart size={14} className="me-1" /> Buy
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .text-truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .submissions-table tr:last-child td {
          border-bottom: none;
        }
        .submissions-table th {
          border-right: none;
          background: var(--nav-active-color);
          font-weight: 700;
          color: var(--placeholder-color);
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .submissions-table td {
          border-right: none;
          vertical-align: middle;
        }
      `}</style>
    </Protected>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StoreContent />
    </Suspense>
  );
}