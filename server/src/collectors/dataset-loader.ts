import fs from 'fs';
import { getAllData, bulkInsertExasol } from '../utils/db';

export async function loadPublicDatasets() {
    console.log('📊 Loading public dataset records...');
    const cities = getAllData('DIM_CITIES');
    
    if (fs.existsSync('./data/imd_sample_daily.csv')) {
        // Mock parsing logic
        console.log('Loaded from CSV (Mock)');
        return;
    }
    
    const records = [];
    const nowMs = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < 500; i++) {
        const city = cities[Math.floor(Math.random() * Math.min(10, cities.length))];
        // Ensure record is within the maximum 7-day freshness window
        const recordDate = new Date(nowMs - Math.random() * (SEVEN_DAYS_MS * 0.95));
        
        records.push({
            source_id: 4,
            city_id: city.id,
            timestamp: recordDate.toISOString(),
            temperature_max: 30 + Math.random() * 15,
            temperature_min: 15 + Math.random() * 10,
            precipitation: Math.random() > 0.7 ? Math.random() * 50 : 0
        });
    }

    const noaaRecords = [];
    for (let i = 0; i < 200; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        noaaRecords.push({
            source_id: 5,
            city_id: city.id,
            timestamp: new Date().toISOString(),
            temperature_mean: 25 + Math.random() * 10,
            humidity: 40 + Math.random() * 50
        });
    }

    await bulkInsertExasol('FACT_PUBLIC_DATASET_RECORDS', [...records, ...noaaRecords]);
    console.log(`✅ Completed Public Datasets: Inserted ${records.length + noaaRecords.length} mock records.`);
}
