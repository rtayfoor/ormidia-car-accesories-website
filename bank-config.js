// src/config/bank-config.js
module.exports = {
    bankDetails: {
        bankName: 'Hellenic Bank',
        accountName: 'Ormidia Car Accessories Ltd',
        accountNumber: '1234-5678-9012-3456',
        iban: 'CY17 0020 0128 0000 0012 3456 7890',
        swift: 'HEBACY2N',
        currency: 'EUR',
        country: 'Cyprus'
    },
    orderPrefix: 'ORD-',
    paymentInstructions: {
        reference: 'Please use your Order ID as payment reference',
        notes: [
            'Payment must be made within 48 hours of placing the order.',
            'Send us the payment confirmation receipt via email.',
            'Orders are processed after payment confirmation.',
            'Contact us at support@ormidia.com for any questions.'
        ]
    },
    autoConfirm: {
        enabled: false, // Set to true if you want auto-confirmation
        delayHours: 24 // Hours to wait before auto-confirming
    }
};
