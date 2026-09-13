import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { startCollectors } from './collectors/collector-manager';
import analyticsRoutes from './routes/analytics';
import citiesRoutes from './routes/cities';
import alertsRoutes from './routes/alerts';
import citizenReportsRoutes from './collectors/citizen-reports';
import streamRoutes from './routes/stream';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/analytics', analyticsRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/citizen-report', citizenReportsRoutes);
app.use('/api/stream', streamRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`
      =======================================================
      🌊 VARUNA (वरुण) — National Weather Big Data Platform
      ⚡ Engine: Exasol In-Memory Columnar Database
      📡 Port: ${PORT}
      =======================================================
    `);
    
    startCollectors();
});
