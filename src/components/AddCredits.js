'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import Image from 'next/image';
import CustomButton from './CustomButton';

const AddCredits = () => {
    const { user } = useApp();
    const [credits, setCredits] = useState(10);
    const [paymentForm, setPaymentForm] = useState({
        cardNumber: '',
        expiryDate: '',
        cvc: '',
        cardholderName: '',
        country: 'United States',
        zip: ''
    });

    const handleCreditsChange = (e) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setCredits(parseInt(value) || 0);
        }
    };

    const handlePaymentChange = (e) => {
        const { name, value } = e.target;

        // Validation for different fields
        let validatedValue = value;

        if (name === 'cardNumber') {
            // Remove non-digits and limit to 16 characters
            validatedValue = value.replace(/\D/g, '').slice(0, 16);
            // Format as groups of 4 digits
            validatedValue = validatedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (name === 'expiryDate') {
            // Format as MM/YY
            validatedValue = value.replace(/\D/g, '').slice(0, 4);
            if (validatedValue.length >= 2) {
                validatedValue = validatedValue.slice(0, 2) + '/' + validatedValue.slice(2);
            }
            // Validate month (01-12)
            if (validatedValue.length >= 2) {
                const month = parseInt(validatedValue.slice(0, 2));
                if (month > 12) {
                    validatedValue = '12/' + validatedValue.slice(3);
                }
            }
        } else if (name === 'cvc') {
            // Limit to 4 digits (for Amex)
            validatedValue = value.replace(/\D/g, '').slice(0, 4);
        } else if (name === 'zip') {
            // Limit to 10 characters
            validatedValue = value.slice(0, 10);
        }

        setPaymentForm({
            ...paymentForm,
            [name]: validatedValue
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        const { cardNumber, expiryDate, cvc, cardholderName, zip } = paymentForm;

        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
            alert('Please enter a valid card number');
            return;
        }

        if (!expiryDate || expiryDate.length < 5) {
            alert('Please enter expiry date (MM/YY)');
            return;
        }

        if (!cvc || cvc.length < 3) {
            alert('Please enter a valid CVC');
            return;
        }

        if (!cardholderName.trim()) {
            alert('Please enter cardholder name');
            return;
        }

        if (!zip.trim()) {
            alert('Please enter ZIP code');
            return;
        }

        // Process payment
        const subtotal = credits * 2; // $2 per credit
        const vat = subtotal * 0.2; // 20% VAT
        const total = subtotal + vat;

        alert(`Payment processed! Total: $${total.toFixed(2)} for ${credits} credits`);
    };

    const subtotal = credits * 2;
    const vat = subtotal * 0.2;
    const total = subtotal + vat;

    return (
        <div className="add-credits-section">
            <div className="credits-layout">
                {/* Left Column - Add Credits */}
                <div className="credits-column col-12">
                    <h2 className="section-title">Add Credits ({user.credits})</h2>

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
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row" style={{ marginTop: '2%' }}>
                            <span>VAT</span>
                            <span>${vat.toFixed(2)}</span>
                        </div>
                        <div className="borderBottom" style={{ marginTop: '2%' }} />
                        <div className="summary-row total-row" >
                            <span>TOTAL</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Payment Details */}
                <div className="payment-column col-12">
                    <h2 className="section-title">Payment Details</h2>

                    <form onSubmit={handleSubmit} className="payment-form">
                        <div className="form-subsection">
                            <h3 className="subsection-title">CARD INFORMATION</h3>
                            <div className="card-input-group">
                                <CustomInputField
                                    type="text"
                                    name="cardNumber"
                                    placeholder="1234 1234 1234 1234"
                                    value={paymentForm.cardNumber}
                                    onChange={handlePaymentChange}
                                    className="card-number-input"
                                    rightIcon={<Image src="/cards.svg" alt="" width={100} height={40} />}
                                    required
                                />

                            </div>
                            <div className="expiry-cvc-group row g-2">
                                <div className="col-6">
                                    <CustomInputField
                                        type="text"
                                        name="expiryDate"
                                        placeholder="MM/YY"
                                        value={paymentForm.expiryDate}
                                        onChange={handlePaymentChange}
                                        className="expiry-input"
                                        maxLength="5"
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <CustomInputField
                                        type="text"
                                        name="cvc"
                                        placeholder="CVC"
                                        value={paymentForm.cvc}
                                        onChange={handlePaymentChange}
                                        className="cvc-input"
                                        maxLength="4"
                                        rightIcon={<Image src="/cvc.svg" alt="" width={24} height={16} />}
                                        required
                                    />
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
                            <CustomButton type="submit" className="pay-button">
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

export default AddCredits;
