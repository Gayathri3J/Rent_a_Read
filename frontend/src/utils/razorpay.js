import api from '../api/axios';

export const createRazorpayOrder = async (rentalId) => {
  try {
    const response = await api.post('/payments/create-order', { rentalId });
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const verifyPayment = async (orderId, paymentId, signature, rentalId) => {
  try {
    const response = await api.post('/payments/verify', {
      orderId,
      paymentId,
      signature,
      rentalId
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const openRazorpayPayment = (orderData, onSuccess, onError) => {
  const options = {
    key: orderData.key,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Rent a Read',
    description: 'Book Rental Payment',
    order_id: orderData.orderId,
    handler: async function (response) {
      try {
        await onSuccess(response);
      } catch (error) {
        onError(error);
      }
    },
    prefill: {
      name: 'Book Borrower',
      email: 'borrower@example.com',
    },
    notes: {
      address: 'Book Rental Payment'
    },
    theme: {
      color: '#ef4444'
    },
    modal: {
      ondismiss: function() {
        onError(new Error('Payment cancelled by user'));
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

