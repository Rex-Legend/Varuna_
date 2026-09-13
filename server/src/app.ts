import express from 'express';
import cors from 'cors';

import analyticsRoutes from './routes/analytics';
import citiesRoutes from './routes/cities';
import alertsRoutes from './routes/alerts';
import citizenReportsRoutes from './collectors/citizen-reports';
import streamRoutes from './routes/stream';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/analytics', analyticsRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/citizen-report', citizenReportsRoutes);
app.use('/api/stream', streamRoutes);

export default app;
