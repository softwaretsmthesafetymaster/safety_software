// dashboardSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Async thunk: fetch all dashboard stats in parallel
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async ({ companyId, plantId }: { companyId: string; plantId?: string | null }) => {
    const [
      permitStatsRes,
      incidentStatsRes,
      hazopStatsRes,
      hiraStatsRes,
      bbsStatsRes,
      auditStatsRes,
      notificationsRes
    ] = await Promise.all([
      axios.get(`${API_URL}/permits/${companyId}/stats/dashboard`),
      axios.get(`${API_URL}/incidents/${companyId}/stats/dashboard`),
      axios.get(`${API_URL}/hazop/${companyId}/stats/dashboard`),
      axios.get(`${API_URL}/hira/${companyId}/dashboard`),
      axios.get(`${API_URL}/bbs/${companyId}/stats/dashboard`, { params: { plantId } }),
      axios.get(`${API_URL}/audits/${companyId}/stats/dashboard`),
      axios.get(`${API_URL}/notifications/${companyId}`)
    ]);

    return {
      permitStats: permitStatsRes.data.stats,
      incidentStats: incidentStatsRes.data.stats,
      hazopStats: hazopStatsRes.data.stats,
      hiraStats: hiraStatsRes.data.stats,
      bbsStats: bbsStatsRes.data.stats,
      auditStats: auditStatsRes.data.stats,
      notifications: notificationsRes.data.notifications,
    };
  }
);

const initialState = {
  permitStats: null as any,
  incidentStats: null as any,
  hazopStats: null as any,
  hiraStats: null as any,
  bbsStats: null as any,
  auditStats: null as any,
  notifications: [] as any[],
  loading: false as boolean,
  error: null as string | null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        const { permitStats, incidentStats, hazopStats, hiraStats, bbsStats, auditStats, notifications } =
          action.payload;
        state.permitStats = permitStats;
        state.incidentStats = incidentStats;
        state.hazopStats = hazopStats;
        state.hiraStats = hiraStats;
        state.bbsStats = bbsStats;
        state.auditStats = auditStats;
        state.notifications = notifications;
        state.loading = false;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load dashboard stats';
      });
  }
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
