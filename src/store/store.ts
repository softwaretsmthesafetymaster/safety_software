import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import companySlice from './slices/companySlice';
import permitSlice from './slices/permitSlice';
import incidentSlice from './slices/incidentSlice';
import hazopSlice from './slices/hazopSlice';
import hiraSlice from './slices/hiraSlice';
import bbsSlice from './slices/bbsSlice';
import auditSlice from './slices/auditSlice';
import plantSlice from './slices/plantSlice';
import userSlice from './slices/userSlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';
import paymentSlice from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    company: companySlice,
    permit: permitSlice,
    incident: incidentSlice,
    hazop: hazopSlice,
    hira: hiraSlice,
    bbs: bbsSlice,
    audit: auditSlice,
    plant: plantSlice,
    user: userSlice,
    notification: notificationSlice,
    ui: uiSlice,
    payment: paymentSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;