import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
interface PaymentState {
  isLoading: boolean;
  error: string | null;
  paymentHistory: any[];
  subscription: any;
}

const initialState: PaymentState = {
  isLoading: false,
  error: null,
  paymentHistory: [],
  subscription: null,
};

export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async ({ amount, currency, modules }: { amount: number; currency: string; modules: string[] }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payment/create-order`, {
        amount: amount * 100, // Convert to paise
        currency,
        modules
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create payment order');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async (paymentData: any, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payment/verify`, paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payment/history`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createPaymentOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload.subscription;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch history
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory = action.payload.paymentHistory;
        state.subscription = action.payload.subscription;
      });
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;