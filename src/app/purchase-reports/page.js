// Replace from the top to ensure imports are added correctly
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import MobileHeader from '../../components/MobileHeader';
import Sidebar from '../../components/Sidebar';
import Protected from '../../components/Protected';
import { Loader2, Search, Filter, ShoppingCart, Eye, Download, Globe, Tag, Briefcase } from 'lucide-react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PRODUCT_PACKAGES } from '@/config/packagesConfig';
import { CartProvider, useCart } from '@/components/newdesign/CartContext';
import { logEvent } from "@/utils/eventLogger";


function StoreContent() {
  const router = useRouter();
  const { userData, user } = useApp();
  const { addToCart } = useCart();
  const [plans, setPlans] = useState(PRODUCT_PACKAGES.map(pkg => ({ ...pkg, billing: "oneoff" })));
  
  const setBilling = (id, billing) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, billing } : p)));
  };

  const [items, setItems] = useState([]);
  const [purchasedReports, setPurchasedReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const isCompany = (userData?.account_type || '').toLowerCase() === 'company';
  const isSuperadmin = Boolean(userData?.is_superadmin);
  const isFounderOrSuper = isCompany || isSuperadmin;

  const fetchStoreItems = async () => {
    try {
      setIsLoading(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      
      const { data: storeData, error: storeError } = await supabase
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

      if (storeError) console.log('Error fetching store items:', storeError);
      setItems(storeData || []);

      if (userData?.organisation_id) {
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('report_type_id, report_types(name)')
          .eq('organisation_id', userData.organisation_id);

        if (reportError) console.log('Error fetching organisation reports:', reportError);
        const purchasedTypes = reportData?.map(r => r.report_types?.name) || [];
        setPurchasedReports(purchasedTypes);
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
  }, [userData?.organisation_id]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.reports?.companies?.name?.toLowerCase().includes(q) ||
        item.summary_line?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    return result;
  }, [items, searchQuery, selectedCategory]);

  const reportMapping = {
    'Pre-Diligence Assessment': 'due_diligence',
    'Competitive Positioning Assessment': 'competitor_analysis',
    'Fundraising Readiness Diagnostic': 'full_research_report'
  };

  return (
    <Protected>
      <div className="app">
        <MobileHeader />
        <div className="app-content">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="main-content">
            <div className="container-page py-4">
              <header className="mb-5">
                <h2 className="section-title mb-1" style={{ fontSize: '2rem', fontWeight: '800' }}>
                  {isFounderOrSuper ? 'Purchase Reports' : 'Company Store'}
                </h2>
                <p className="text-muted">Access premium intelligence reports for the modern ecosystem</p>
              </header>

              {isFounderOrSuper && (
                <div className="row row-cols-1 row-cols-lg-3 g-4 align-items-stretch mb-5">
                  {plans.map((plan, idx) => {
                    const isAnnual = plan.billing === "annual";
                    const price = isAnnual ? plan.priceAnnual : plan.priceOneOff;
                    const isPurchased = purchasedReports.includes(reportMapping[plan.title]);

                    return (
                      <div className="col d-flex" key={plan.id}>
                        <div className="mi-card d-flex flex-column flex-fill">
                          <div className="mi-card-body flex-grow-1">
                            <div className="mi-heading">
                              <div className="mi-icon-box">
                                <Image
                                  className="mi-icon"
                                  src={plan.icon}
                                  alt=""
                                  width={48}
                                  height={48}
                                />
                              </div>
                              <h5 className="mi-card-title">{plan.title}</h5>
                              {plan.tooltip && (
                                <div className="mi-tooltip-container ms-auto">
                                  <span className="mi-tooltip-icon">?</span>
                                  <div className="mi-tooltip-text">{plan.tooltip}</div>
                                </div>
                              )}
                            </div>

                            <div className="mi-box">
                              <h5 className="mi-card-sub">{plan.sub}</h5>
                              {plan.badge && (
                                <div className="mi-badge-blue mb-2">{plan.badge}</div>
                              )}
                              <p className={`mi-card-desc ${!plan.badge ? "mi-desc-align" : ""}`}>
                                {plan.desc}
                              </p>
                            </div>

                            <div className="mi-toggle" role="group" aria-label="Billing">
                              <span className={`mi-toggle-pill ${isAnnual ? "right" : ""}`} />
                              <button
                                type="button"
                                className={`mi-toggle-btn ${!isAnnual ? "active" : ""}`}
                                onClick={() => setBilling(plan.id, "oneoff")}
                              >
                                One-off
                              </button>
                              <button
                                type="button"
                                className={`mi-toggle-btn ${isAnnual ? "active" : ""}`}
                                onClick={() => setBilling(plan.id, "annual")}
                              >
                                Annual
                              </button>
                            </div>

                            <div className="mi-price-row">
                              <div className="mi-price">
                                {price}
                                {isAnnual && plan.perAnnual ? (
                                  <span className="mi-per"> {plan.perAnnual}</span>
                                ) : null}
                              </div>
                              {isAnnual && plan.save ? (
                                <span className="mi-save-badge">{plan.save}</span>
                              ) : null}
                            </div>

                            <ul className="mi-features list-unstyled m-0">
                              {plan.features.map((f, i) => (
                                <li
                                  className={`mi-feature d-flex align-items-start ${f.icon === "/dot.svg" ? "ms-3" : ""}`}
                                  key={i}
                                >
                                  <Image
                                    className="mi-feature-icon"
                                    src={f.icon}
                                    alt="icon"
                                    width={16}
                                    height={16}
                                  />
                                  <span className="mi-feature-text">{f.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className={idx === 1 ? "mi-card-footerr mt-auto" : "mi-card-footer mt-auto"}>
                            <button
                              type="button"
                              className="mi-btn w-100 d-flex align-items-center justify-content-center gap-2"
                              style={isPurchased ? { backgroundColor: '#10b981', color: 'white' } : {}}
                              disabled={isPurchased}
                              onClick={() => {
                                const priceNum = Number(String(price).replace(/[^0-9.]/g, "")) || 0;
                                addToCart({
                                  title: plan.title,
                                  type: isAnnual ? "Annual" : "One-off",
                                  price: priceNum,
                                });
                                logEvent({
                                  companyId: userData?.organisation_id,
                                  userId: user?.id,
                                  eventType: `Add to cart: ${plan.title}`,
                                });
                              }}
                            >
                              {isPurchased ? (
                                <span>PURCHASED</span>
                              ) : (
                                <>
                                  <span style={{ fontSize: '14px' }}>🔒</span>
                                  <span>LOCKED</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isFounderOrSuper && (
                <div className="table-container shadow-sm p-0 overflow-hidden" style={{ borderRadius: '16px', border: 'none' }}>
                  <div className="table-responsive">
                    <table className="submissions-table w-100 mb-0">
                      <thead>
                        <tr>
                          <th className="p-3">COMPANY</th>
                          <th>REPORT TYPE</th>
                          <th>SUMMARY</th>
                          <th>SECTOR / GEOGRAPHY</th>
                          <th>DATE</th>
                          <th>STATUS</th>
                          <th className="text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan="8" className="text-center p-5"><Loader2 className="animate-spin text-primary d-inline-block" /></td></tr>
                        ) : filteredItems.length === 0 ? (
                          <tr><td colSpan="8" className="text-center p-4 text-muted">No reports found</td></tr>
                        ) : (
                          filteredItems.map((item) => (
                            <tr key={item.id}>
                              <td className="p-3">
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
                              <td>{item.reports?.report_type || 'Standard'}</td>
                              <td><div className="text-truncate" style={{ maxWidth: '200px' }}>{item.summary_line}</div></td>
                              <td>{item.reports?.companies?.sector} / {item.reports?.companies?.geography}</td>
                              <td>{item.reports?.generated_at ? new Date(item.reports.generated_at).toLocaleDateString() : 'N/A'}</td>
                              <td>{item.reports?.status}</td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-primary rounded-pill me-2"><Eye size={14} /></button>
                                <button className="btn btn-sm btn-primary rounded-pill"><ShoppingCart size={14} /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          .submissions-table th {
            background: #f8fafc;
            font-weight: 700;
            color: #64748b;
            padding: 12px 16px;
          }
          .submissions-table td {
            vertical-align: middle;
            border-bottom: 1px solid #f1f5f9;
          }
        `}</style>
      </div>
    </Protected>
  );
}

function StorePageInner() {
  const { userData, user } = useApp();
  const companyId = userData?.organisation?.company_id || userData?.company_id;
  
  return (
    <CartProvider companyId={companyId} userId={user?.id}>
      <StoreContent />
    </CartProvider>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StorePageInner />
    </Suspense>
  );
}
