import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import { startCollectors } from './collectors/collector-manager';
import { app } from './app';

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
