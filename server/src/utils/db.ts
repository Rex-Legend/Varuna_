export const memoryDb = new Map<string, any[]>();

export async function queryExasol(sql: string): Promise<any[]> {
    console.log(`[DB] Executing Query: ${sql.substring(0, 50)}...`);
    // Basic mock implementation for known tables
    if (sql.includes('DIM_CITIES')) return memoryDb.get('DIM_CITIES') || [];
    if (sql.includes('DIM_DATA_SOURCES')) return memoryDb.get('DIM_DATA_SOURCES') || [];
    return [];
}

export async function bulkInsertExasol(table: string, rows: any[]): Promise<void> {
    if (!memoryDb.has(table)) {
        memoryDb.set(table, []);
    }
    const current = memoryDb.get(table)!;
    current.push(...rows);
}

export function getTableCount(table: string): number {
    return memoryDb.get(table)?.length || 0;
}

export function getAllData(table: string): any[] {
    return memoryDb.get(table) || [];
}

const indianCities = [
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, climate_zone: 'Tropical Wet' },
    { city: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025, climate_zone: 'Semi-Arid' },
    { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946, climate_zone: 'Tropical Savanna' },
    { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, climate_zone: 'Hot Semi-Arid' },
    { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, climate_zone: 'Tropical Savanna' },
    { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, climate_zone: 'Hot Semi-Arid' },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, climate_zone: 'Humid Subtropical' },
    { city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, climate_zone: 'Humid Subtropical' },
    { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, climate_zone: 'Tropical Savanna' },
    { city: 'Thane', state: 'Maharashtra', lat: 19.2183, lon: 72.9781, climate_zone: 'Tropical Wet' },
    { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, climate_zone: 'Humid Subtropical' },
    { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, climate_zone: 'Tropical Savanna' },
    { city: 'Pimpri-Chinchwad', state: 'Maharashtra', lat: 18.6298, lon: 73.7997, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, climate_zone: 'Humid Subtropical' },
    { city: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812, climate_zone: 'Tropical Savanna' },
    { city: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538, climate_zone: 'Semi-Arid' },
    { city: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, climate_zone: 'Semi-Arid' },
    { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, climate_zone: 'Semi-Arid' },
    { city: 'Nashik', state: 'Maharashtra', lat: 20.0059, lon: 73.7900, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178, climate_zone: 'Semi-Arid' },
    { city: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064, climate_zone: 'Humid Subtropical' },
    { city: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022, climate_zone: 'Hot Semi-Arid' },
    { city: 'Kalyan-Dombivli', state: 'Maharashtra', lat: 19.2372, lon: 73.1363, climate_zone: 'Tropical Wet' },
    { city: 'Vasai-Virar', state: 'Maharashtra', lat: 19.3919, lon: 72.8397, climate_zone: 'Tropical Wet' },
    { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, climate_zone: 'Humid Subtropical' },
    { city: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973, climate_zone: 'Humid Subtropical' },
    { city: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433, climate_zone: 'Semi-Arid' },
    { city: 'Dhanbad', state: 'Jharkhand', lat: 23.7915, lon: 86.4304, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723, climate_zone: 'Semi-Arid' },
    { city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0330, lon: 73.0297, climate_zone: 'Tropical Wet' },
    { city: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, climate_zone: 'Humid Subtropical' },
    { city: 'Howrah', state: 'West Bengal', lat: 22.5958, lon: 88.2636, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2124, lon: 78.1772, climate_zone: 'Humid Subtropical' },
    { city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864, climate_zone: 'Humid Subtropical' },
    { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480, climate_zone: 'Tropical Savanna' },
    { city: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243, climate_zone: 'Hot Desert' },
    { city: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, climate_zone: 'Tropical Savanna' },
    { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, climate_zone: 'Tropical Wet and Dry' },
    { city: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648, climate_zone: 'Hot Semi-Arid' },
    { city: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, climate_zone: 'Humid Subtropical' },
    { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, climate_zone: 'Humid Subtropical' },
    { city: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064, climate_zone: 'Semi-Arid' },
    { city: 'Hubli-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240, climate_zone: 'Tropical Wet and Dry' }
];

export function initDb() {
    memoryDb.set('DIM_CITIES', indianCities.map((c, i) => ({ id: i + 1, ...c })));
    memoryDb.set('DIM_DATA_SOURCES', [
        { id: 1, name: 'Open-Meteo', type: 'API' },
        { id: 2, name: 'Twitter/X', type: 'Social Media' },
        { id: 3, name: 'Instagram', type: 'Social Media' },
        { id: 4, name: 'IMD Public Dataset', type: 'CSV' },
        { id: 5, name: 'NOAA GHCN', type: 'CSV' },
        { id: 6, name: 'NDMA Alerts', type: 'Web Scraper' },
        { id: 7, name: 'News Portals', type: 'Web Scraper' },
        { id: 8, name: 'Citizen Reports', type: 'Crowdsourced' }
    ]);
}
initDb();
