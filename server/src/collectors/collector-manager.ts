import cron from 'node-cron';
import { collectWeatherAPI } from './api-collector';
import { collectSocialMedia } from './social-media-collector';
import { loadPublicDatasets } from './dataset-loader';
import { scrapeDisasterAlerts } from './web-scraper';

export function startCollectors() {
    console.log('⏰ Starting Collector Manager...');
    
    // Run dataset loader once on startup
    loadPublicDatasets();
    
    // Initial run
    collectWeatherAPI();
    collectSocialMedia();
    scrapeDisasterAlerts();

    cron.schedule('*/15 * * * *', () => {
        console.log(`[${new Date().toISOString()}] 🔄 Running API Collector`);
        collectWeatherAPI();
    });

    cron.schedule('*/5 * * * *', () => {
        console.log(`[${new Date().toISOString()}] 🔄 Running Social Media Collector`);
        collectSocialMedia();
    });

    cron.schedule('*/10 * * * *', () => {
        console.log(`[${new Date().toISOString()}] 🔄 Running Web Scraper`);
        scrapeDisasterAlerts();
    });
    
    console.log('✅ Cron jobs scheduled successfully.');
}
