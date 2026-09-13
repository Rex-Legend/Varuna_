CREATE SCHEMA IF NOT EXISTS WEATHER_ANALYTICS;
OPEN SCHEMA WEATHER_ANALYTICS;

CREATE TABLE DIM_DATA_SOURCES (
    source_id INTEGER IDENTITY PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    base_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    description VARCHAR(500)
);

CREATE TABLE DIM_CITIES (
    city_id INTEGER IDENTITY PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    elevation_m DECIMAL(7,2),
    population BIGINT,
    climate_zone VARCHAR(50)
);

CREATE TABLE FACT_WEATHER_HOURLY (
    record_id BIGINT IDENTITY,
    city_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    observation_time TIMESTAMP NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature_2m DECIMAL(5,2),
    relative_humidity_2m DECIMAL(5,2),
    apparent_temperature DECIMAL(5,2),
    precipitation DECIMAL(7,2),
    rain DECIMAL(7,2),
    wind_speed_10m DECIMAL(6,2),
    wind_direction_10m INTEGER,
    wind_gusts_10m DECIMAL(6,2),
    surface_pressure DECIMAL(7,2),
    cloud_cover DECIMAL(5,2),
    visibility DECIMAL(10,2),
    weather_code INTEGER,
    is_day BOOLEAN,
    uv_index DECIMAL(4,2)
) DISTRIBUTE BY city_id PARTITION BY observation_time;

CREATE TABLE FACT_WEATHER_DAILY (
    record_id BIGINT IDENTITY,
    city_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    observation_date DATE NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature_2m_max DECIMAL(5,2),
    temperature_2m_min DECIMAL(5,2),
    temperature_2m_mean DECIMAL(5,2),
    apparent_temperature_max DECIMAL(5,2),
    apparent_temperature_min DECIMAL(5,2),
    precipitation_sum DECIMAL(7,2),
    rain_sum DECIMAL(7,2),
    precipitation_hours DECIMAL(5,2),
    wind_speed_10m_max DECIMAL(6,2),
    wind_gusts_10m_max DECIMAL(6,2),
    wind_direction_10m_dominant INTEGER,
    sunrise TIMESTAMP,
    sunset TIMESTAMP,
    daylight_duration DECIMAL(10,2),
    uv_index_max DECIMAL(4,2),
    weather_code INTEGER
) DISTRIBUTE BY city_id PARTITION BY observation_date;

CREATE TABLE FACT_SOCIAL_MEDIA_POSTS (
    post_id BIGINT IDENTITY PRIMARY KEY,
    source_id INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    external_post_id VARCHAR(200),
    post_text VARCHAR(4000) NOT NULL,
    author_handle VARCHAR(200),
    author_display_name VARCHAR(200),
    author_verified BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    matched_hashtags VARCHAR(1000),
    all_hashtags VARCHAR(2000),
    detected_city_id INTEGER,
    detected_city VARCHAR(100),
    detected_state VARCHAR(100),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_source VARCHAR(20),
    photo_urls VARCHAR(4000),
    video_urls VARCHAR(4000),
    media_count INTEGER DEFAULT 0,
    has_photo BOOLEAN DEFAULT FALSE,
    has_video BOOLEAN DEFAULT FALSE,
    weather_keywords VARCHAR(500),
    event_category VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20),
    sentiment_score DECIMAL(4,3),
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    engagement_total INTEGER DEFAULT 0
);

CREATE TABLE FACT_CITIZEN_REPORTS (
    report_id BIGINT IDENTITY PRIMARY KEY,
    city_id INTEGER,
    source_id INTEGER NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reporter_name VARCHAR(200),
    reporter_location VARCHAR(300),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    weather_condition VARCHAR(50) NOT NULL,
    temperature_feel VARCHAR(20),
    rain_intensity VARCHAR(20),
    wind_intensity VARCHAR(20),
    visibility_level VARCHAR(20),
    severity_rating INTEGER,
    description VARCHAR(2000),
    photo_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE FACT_DISASTER_ALERTS (
    alert_id BIGINT IDENTITY PRIMARY KEY,
    source_id INTEGER NOT NULL,
    alert_title VARCHAR(500) NOT NULL,
    alert_description VARCHAR(4000),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    affected_states VARCHAR(500),
    affected_cities VARCHAR(1000),
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE FACT_PUBLIC_DATASET_RECORDS (
    record_id BIGINT IDENTITY,
    source_id INTEGER NOT NULL,
    station_id VARCHAR(50),
    station_name VARCHAR(200),
    city_id INTEGER,
    observation_date DATE NOT NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature_max DECIMAL(5,2),
    temperature_min DECIMAL(5,2),
    precipitation DECIMAL(7,2),
    wind_speed DECIMAL(6,2),
    humidity DECIMAL(5,2),
    pressure DECIMAL(7,2),
    dataset_name VARCHAR(100)
) DISTRIBUTE BY city_id PARTITION BY observation_date;

CREATE OR REPLACE VIEW V_UNIFIED_WEATHER_FEED AS
SELECT 
    'api_weather' AS event_type,
    city_id,
    observation_time AS event_time,
    'Temp: ' || temperature_2m || 'C, Weather Code: ' || weather_code AS event_summary,
    source_id,
    NULL AS severity,
    FALSE AS media_flag
FROM FACT_WEATHER_HOURLY
WHERE observation_time >= ADD_DAYS(CURRENT_TIMESTAMP, -1)
UNION ALL
SELECT 
    'social_media' AS event_type,
    detected_city_id AS city_id,
    posted_at AS event_time,
    SUBSTR(post_text, 1, 100) AS event_summary,
    source_id,
    severity_level AS severity,
    (has_photo OR has_video) AS media_flag
FROM FACT_SOCIAL_MEDIA_POSTS
WHERE posted_at >= ADD_DAYS(CURRENT_TIMESTAMP, -1)
UNION ALL
SELECT 
    'citizen_report' AS event_type,
    city_id,
    submitted_at AS event_time,
    weather_condition || ' - ' || SUBSTR(description, 1, 50) AS event_summary,
    source_id,
    CAST(severity_rating AS VARCHAR(20)) AS severity,
    (photo_url IS NOT NULL) AS media_flag
FROM FACT_CITIZEN_REPORTS
WHERE submitted_at >= ADD_DAYS(CURRENT_TIMESTAMP, -1)
UNION ALL
SELECT 
    'disaster_alert' AS event_type,
    NULL AS city_id,
    issued_at AS event_time,
    alert_title AS event_summary,
    source_id,
    severity,
    FALSE AS media_flag
FROM FACT_DISASTER_ALERTS
WHERE issued_at >= ADD_DAYS(CURRENT_TIMESTAMP, -1);

CREATE OR REPLACE VIEW V_HASHTAG_ANALYTICS AS
SELECT 
    matched_hashtags,
    event_category,
    severity_level,
    COUNT(*) AS post_count,
    SUM(engagement_total) AS total_engagement,
    SUM(CASE WHEN has_photo THEN 1 ELSE 0 END) AS posts_with_photos,
    SUM(CASE WHEN has_video THEN 1 ELSE 0 END) AS posts_with_videos,
    MIN(posted_at) AS first_seen,
    MAX(posted_at) AS last_seen
FROM FACT_SOCIAL_MEDIA_POSTS
GROUP BY matched_hashtags, event_category, severity_level;

INSERT INTO DIM_DATA_SOURCES (source_name, source_type, base_url, description) VALUES
('open_meteo', 'api', 'https://api.open-meteo.com', 'Open-Meteo free weather API'),
('weather_api', 'api', 'https://api.weatherapi.com', 'WeatherAPI.com free tier'),
('twitter_x', 'social_media', 'https://api.twitter.com', 'Twitter/X #IMD and weather hashtag monitoring with metadata extraction'),
('imd_data', 'public_dataset', 'https://mausam.imd.gov.in', 'India Meteorological Department open data'),
('noaa_ghcn', 'public_dataset', 'https://www.ncei.noaa.gov', 'NOAA Global Historical Climatology Network'),
('ndma_alerts', 'web_scrape', 'https://ndma.gov.in', 'National Disaster Management Authority alerts'),
('skymet_scrape', 'web_scrape', 'https://www.skymetweather.com', 'Skymet weather news scraping'),
('citizen_portal', 'citizen_report', NULL, 'Citizen weather report submissions');
