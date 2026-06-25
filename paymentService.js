// src/services/paymentService.js
const { createClient } = require('@supabase/supabase-js');
const bankConfig = require('../config/bank-config');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class PaymentService {
    // Generate payment instructions for customer
    generatePaymentInstructions(orderId, orderTotal) {
        const reference = `${bankConfig.orderPrefix}${orderId}`;
        
        return {
            bankDetails: {
                ...bankConfig.bankDetails,
                reference: reference
            },
            amount: orderTotal.toFixed(2),
            instructions: {
                reference: `Please use reference: ${reference}`,
                steps: [
                    '1. Log in to your online banking or visit your bank branch',
                    '2. Transfer the exact amount to the bank account above',
                    `3. Use the reference: ${reference}`,
                    '4. Email the payment confirmation receipt to support@ormidia.com',
                    '5. Your order will be processed within 24 hours of payment confirmation'
                ],
                notes: bankConfig.paymentInstructions.notes
            },
            orderId: orderId
        };
    }

    // Create a new order with bank transfer payment
    async createBankTransferOrder(orderData) {
        try {
            const orderPayload = {
                ...orderData,
                payment_method: 'bank_transfer',
                payment_status: 'pending',
                status: 'pending'
            };

            const { data: order, error } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (error) throw error;

            // Create initial status history
            await this.addOrderHistory(order.id, 'pending', 'Order created with bank transfer payment');

            // Generate payment instructions
            const instructions = this.generatePaymentInstructions(order.id, order.total);

            return {
                order,
                paymentInstructions: instructions
            };
        } catch (error) {
            console.error('Error creating bank transfer order:', error);
            throw error;
        }
    }

    // Add order history entry
    async addOrderHistory(orderId, status, notes = null, updatedBy = 'customer') {
        try {
            const { error } = await supabase
                .from('order_status_history')
                .insert([{
                    order_id: orderId,
                    status: status,
                    notes: notes,
                    updated_by: updatedBy
                }]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error adding order history:', error);
            return false;
        }
    }

    // Confirm payment (admin action)
    async confirmPayment(orderId, adminNotes = null) {
        try {
            // Update order
            const { data: order, error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'confirmed',
                    status: 'processing',
                    payment_confirmed_at: new Date().toISOString(),
                    bank_reference: adminNotes || 'Payment confirmed by admin'
                })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            // Add history entry
            await this.addOrderHistory(
                orderId, 
                'processing', 
                `Payment confirmed. ${adminNotes || ''}`,
                'admin'
            );

            return order;
        } catch (error) {
            console.error('Error confirming payment:', error);
            throw error;
        }
    }

    // Reject payment (admin action)
    async rejectPayment(orderId, reason) {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'rejected',
                    status: 'cancelled'
                })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            // Add history entry
            await this.addOrderHistory(
                orderId, 
                'cancelled', 
                `Payment rejected. Reason: ${reason}`,
                'admin'
            );

            return order;
        } catch (error) {
            console.error('Error rejecting payment:', error);
            throw error;
        }
    }

    // Get order payment status
    async getOrderPaymentStatus(orderId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('payment_status, status, payment_confirmed_at')
                .eq('id', orderId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting order payment status:', error);
            throw error;
        }
    }

    // Get order history
    async getOrderHistory(orderId) {
        try {
            const { data, error } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting order history:', error);
            return [];
        }
    }

    // Mark payment as seen by admin (for notification)
    async markPaymentAsSeen(orderId) {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_seen: true })
                .eq('id', orderId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking payment as seen:', error);
            return false;
        }
    }

    // Get pending payments for admin
    async getPendingPayments() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users:user_id (name, email)
                `)
                .eq('payment_method', 'bank_transfer')
                .eq('payment_status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting pending payments:', error);
            return [];
        }
    }

    // Generate receipt for payment confirmation
    generatePaymentReceipt(order) {
        const bankDetails = bankConfig.bankDetails;
        
        return {
            orderId: order.id,
            orderDate: order.created_at,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            total: order.total,
            paymentMethod: 'Bank Transfer',
            bankDetails: {
                bankName: bankDetails.bankName,
                accountName: bankDetails.accountName,
                accountNumber: bankDetails.accountNumber,
                iban: bankDetails.iban,
                swift: bankDetails.swift,
                reference: `${bankConfig.orderPrefix}${order.id}`
            },
            items: order.items || [],
            status: order.status
        };
    }
}

module.exports = new PaymentService();
