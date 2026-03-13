'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import Image from 'next/image';
import CustomButton from './CustomButton';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const InnerAddCredits = () => {
    const { user, userData, refreshUserData } = useApp();
    const stripe = useStripe();
    const elements = useElements();
    const [credits, setCredits] = useState(10);
    const [isProcessing, setIsProcessing] = useState(false);
    // element options for stripe
    const elementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#1f2937',
                fontFamily: 'inherit',
                '::placeholder': { color: '#9ca3af' },
                ':-webkit-autofill': { color: '#1f2937' }
            },
            invalid: {
                color: '#ef4444'
            }
        }
    };
    // payment form state
    const [paymentForm, setPaymentForm] = useState({
        cardholderName: '',
        country: 'United States',
        zip: ''
    });
    // handle credits change
    const handleCreditsChange = (e) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setCredits(parseInt(value) || 0);
        }
    };
    // handle payment change
    const handlePaymentChange = (e) => {
        const { name, value } = e.target;

        // Validation for different fields
        let validatedValue = value;

        if (name === 'zip') {
            // Limit to 10 characters
            validatedValue = value.slice(0, 10);
        }

        setPaymentForm({
            ...paymentForm,
            [name]: validatedValue
        });
    };
    /**
         * handleSubmit()
         * Main payment function that:
         * - Validates input fields
         * - Creates a PaymentIntent via backend API
         * - Confirms the payment with Stripe
         * - Records transaction in Supabase
         * - Updates organisation credits
         */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Step 1: Validate user input
        const { cardholderName, zip } = paymentForm;

        if (!cardholderName.trim()) {
            console.log('Please enter cardholder name');
            return;
        }
        if (!zip.trim()) {
            console.log('Please enter ZIP code');
            return;
        }

        if (!stripe || !elements) {
            console.log('Stripe not initialized yet');
            return;
        }

        setIsProcessing(true);
        // Step 2: Create a PaymentIntent on backend
        try {
            const organisationId = typeof window !== 'undefined' ? localStorage.getItem('organisation_id') : null;
            const piRes = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits, organisationId })
            });

            if (!piRes.ok) {
                console.log('Payment initialization failed');
                setIsProcessing(false);
                return;
            }

            const { clientSecret } = await piRes.json();
            if (!clientSecret) {
                console.log('Missing clientSecret from server');
                setIsProcessing(false);
                return;
            }

            const card = elements.getElement(CardNumberElement);
            if (!card) {
                console.log('CardNumberElement not ready');
                setIsProcessing(false);
                return;
            }
            //  Step 3: Confirm payment with Stripe
            const confirmResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card,
                    billing_details: {
                        name: cardholderName,
                        address: { postal_code: zip }
                    }
                }
            });
            // if payment succeeded
            if (confirmResult.paymentIntent?.status === 'succeeded') {
                const paymentIntentId = confirmResult.paymentIntent?.id;
                console.log('Payment succeeded:', paymentIntentId);
                // try to insert transaction
                try {
                    const organisationId = typeof window !== 'undefined' ? localStorage.getItem('organisation_id') : null;
                    if (!organisationId) {
                        console.log('Missing organisation_id in localStorage; skipping transaction insert');
                    } else {
                        const { getSupabase } = await import('../supabaseClient');
                        const supabase = getSupabase();
                        const { data: insertData, error: insertError } = await supabase
                            .from('credit_transactions')
                            .insert([
                                {
                                    organisation_id: organisationId,
                                    // credits_added: credits,
                                    transaction_type: 'credit_purchase',
                                    amount: total,
                                    //  payment_provider: 'stripe',
                                    // payment_intent: paymentIntentId
                                    balance_after: 0, 
                                    created_at: new Date().toISOString()
                                }
                            ])
                            .select();
                        // if error inserting transaction
                        if (insertError) {
                            console.log('Failed to insert transaction:', insertError);
                        } else {
                            console.log('Transaction recorded:', insertData);
                            // After recording transaction, increment organisation credits
                            try {
                                // Fetch current credits
                                const { data: orgRow, error: orgFetchErr } = await supabase
                                    .from('organisations')
                                    .select('credit_balance')
                                    .eq('id', organisationId)
                                    .maybeSingle();
                                if (orgFetchErr) {
                                    console.log('Failed to fetch organisation credits:', orgFetchErr);
                                } else {
                                    const currentCredits = Number(orgRow?.credit_balance) || 0;
                                    const updatedCredits = currentCredits + Number(credits || 0);

                                    // Update transaction with actual balance_after
                                    if (insertData && insertData.length > 0) {
                                        await supabase
                                            .from('credit_transactions')
                                            .update({ balance_after: updatedCredits })
                                            .eq('id', insertData[0].id);
                                    }

                                    const { error: orgUpdateErr } = await supabase
                                        .from('organisations')
                                        .update({ credit_balance: updatedCredits })
                                        .eq('id', organisationId);
                                    if (orgUpdateErr) {
                                        console.log('Failed to update organisation credits:', orgUpdateErr);
                                    } else {
                                        console.log('Organisation credits updated to:', updatedCredits);
                                        // Refresh context so Sidebar and screens update immediately
                                        try { await refreshUserData?.(); } catch { }
                                    }
                                }
                            } catch (orgErr) {
                                console.log('Organisation credits update exception:', orgErr);
                            }
                        }
                    }
                } catch (dbErr) {
                    console.log('Transaction insert exception:', dbErr);
                }
                // Clear elements and inputs
                try {
                    elements.getElement(CardNumberElement)?.clear();
                    elements.getElement(CardExpiryElement)?.clear();
                    elements.getElement(CardCvcElement)?.clear();
                } catch { }
                setCredits(0);
                setPaymentForm({ cardholderName: '', country: 'United States', zip: '' });
                toast.success('Payment successful');
                setIsProcessing(false);
                return;
            }

            console.log('Payment status:', confirmResult.paymentIntent?.status);
            toast.error('Payment not completed');
            setIsProcessing(false);
        } catch (error) {
            console.log('Payment exception:', error);
            toast.error('Payment failed');
            setIsProcessing(false);
        }
    };

    const pricePerCreditGbp = 2; // £2 per credit
    const subtotal = credits * pricePerCreditGbp;
    const vat = subtotal * 0.2;
    const total = subtotal + vat;

    return (
        <div className="add-credits-section">
            <div className="credits-layout">
                {/* Left Column - Add Credits */}
                <div className="credits-column col-12">
                    <h2 className="section-title">Add Credits ({userData?.organisation?.credit_balance})</h2>

                    <div className="credits-subsection">
                        <h3 className="subsection-title">NUMBER OF CREDITS</h3>
                        <div className="credits-input-container">
                            <CustomInputField
                                type="text"
                                name="credits"
                                placeholder="10 credits"
                                value={credits}
                                onChange={handleCreditsChange}
                                className="credits-input-field"
                                required

                            />
                        </div>
                    </div>

                    <div className="payment-summary">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>£{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row" style={{ marginTop: '2%' }}>
                            <span>VAT</span>
                            <span>£{vat.toFixed(2)}</span>
                        </div>
                        <div className="borderBottom" style={{ marginTop: '2%' }} />
                        <div className="summary-row total-row" >
                            <span>TOTAL</span>
                            <span>£{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Details */}
                <div className="payment-column col-12">
                    <h2 className="section-title">Payment Details</h2>
                    {/* <form onSubmit={()=>{}} className="payment-form"> */}
                    <form onSubmit={handleSubmit} className="payment-form">
                        <div className="form-subsection">
                            <h3 className="subsection-title">CARD INFORMATION</h3>
                            <div className="card-input-group position-relative">
                                <div className="card-number-input" style={{
                                    width: '100%', padding: '10px 12px', backgroundColor: '#DEE3E9', color: "#0044EE !important", borderTopLeftRadius: '25px', borderTopRightRadius: '25px'
                                }}>
                                    <CardNumberElement options={elementOptions} style={{ color: "#0044EE !important" }} />
                                </div>
                                <div className="right-icon position-absolute top-0 end-0 ">
                                    <Image src="/cards.svg" alt="" width={100} height={40} style={{ marginRight: "10px" }} />
                                </div>
                            </div>
                            <div className="expiry-cvc-group row g-2">
                                <div className="col-6">
                                    <div className="expiry-input" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#DEE3E9', borderBottomLeftRadius: '25px' }}>
                                        <CardExpiryElement options={elementOptions} style={{ color: "#0044EE !important" }} />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="cvc-input" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#DEE3E9', borderBottomRightRadius: '25px' }}>
                                        <CardCvcElement options={elementOptions} style={{ color: "#0044EE !important" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-subsection">
                            <h3 className="subsection-title">CARDHOLDER NAME</h3>
                            <CustomInputField
                                type="text"
                                name="cardholderName"
                                placeholder="Full name on card"
                                value={paymentForm.cardholderName}
                                onChange={handlePaymentChange}
                                required
                                className='cardholder-name-input'
                            />
                        </div>

                        <div className="form-subsection">
                            <h3 className="subsection-title">COUNTRY OR REGION</h3>
                            <div className="country-zip-group row g-2">
                                <div className="col-12">
                                    <select
                                        name="country"
                                        value={paymentForm.country}
                                        onChange={handlePaymentChange}
                                        className="country-select"
                                        required
                                    >
                                        <option value="United States">United States</option>
                                        <option value="Canada">Canada</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                        <option value="Germany">Germany</option>
                                        <option value="France">France</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <CustomInputField
                                        type="text"
                                        name="zip"
                                        placeholder="ZIP"
                                        value={paymentForm.zip}
                                        onChange={handlePaymentChange}
                                        className="zip-input"
                                        maxLength="10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className='pay-button-container'>
                            <CustomButton
                                type="submit"
                                className="pay-button"
                                loading={isProcessing}
                                loadingText="Processing..."
                                disabled={isProcessing}
                            >
                                Pay
                            </CustomButton>
                        </div>
                        <div className="payment-footer">
                            <span className="powered-by">Powered by <span style={{ fontWeight: 'bold' }}>stripe</span></span>
                            <div className="footer-links">
                                <a href="#" className="footer-link">Terms</a>
                                <a href="#" className="footer-link">Privacy</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Wrapper to provide Stripe Elements without changing routes/pages
const AddCredits = () => {
    return (
        <Elements stripe={stripePromise}>
            <InnerAddCredits />
        </Elements>
    );
};
export default AddCredits;
