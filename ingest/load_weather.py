import pyexasol
import requests
import time
from datetime import datetime, timedelta
import pandas as pd

def main():
    print("🌟 Connecting to Exasol...")
    C = pyexasol.connect(dsn='localhost:8563', user='sys', password='exasol', schema='WEATHER_ANALYTICS')
    
    print("🏙️ Fetching cities from DIM_CITIES...")
    cities_stmt = C.execute("SELECT city_id, city_name, latitude, longitude FROM DIM_CITIES")
    cities = cities_stmt.fetchall()
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=2*365)
    
    start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')
    
    print(f"📅 Date range: {start_date_str} to {end_date_str}")
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    for city in cities:
        city_id, city_name, lat, lon = city
        print(f"🌍 Fetching data for {city_name}...")
        
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date_str,
            "end_date": end_date_str,
            "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,cloud_cover,visibility,weather_code,is_day,uv_index",
            "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_max,apparent_temperature_min,precipitation_sum,rain_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunrise,sunset,daylight_duration,uv_index_max,weather_code",
            "timezone": "Asia/Kolkata"
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Hourly data
            hourly = data.get('hourly', {})
            if hourly:
                df_hourly = pd.DataFrame(hourly)
                df_hourly['city_id'] = city_id
                df_hourly['source_id'] = 1
                
                # Reorder and map columns to match FACT_WEATHER_HOURLY
                df_hourly = df_hourly[['city_id', 'source_id', 'time', 'temperature_2m', 'relative_humidity_2m', 
                                       'apparent_temperature', 'precipitation', 'rain', 'wind_speed_10m', 
                                       'wind_direction_10m', 'wind_gusts_10m', 'surface_pressure', 'cloud_cover', 
                                       'visibility', 'weather_code', 'is_day', 'uv_index']]
                
                df_hourly['time'] = pd.to_datetime(df_hourly['time'])
                
                # Replace NaNs with None for Exasol insertion
                df_hourly = df_hourly.where(pd.notnull(df_hourly), None)
                
                C.import_from_iterable(df_hourly.values.tolist(), 'FACT_WEATHER_HOURLY')
                print(f"✅ Inserted hourly data for {city_name}")
            
            # Daily data
            daily = data.get('daily', {})
            if daily:
                df_daily = pd.DataFrame(daily)
                df_daily['city_id'] = city_id
                df_daily['source_id'] = 1
                
                # Reorder and map columns to match FACT_WEATHER_DAILY
                df_daily = df_daily[['city_id', 'source_id', 'time', 'temperature_2m_max', 'temperature_2m_min', 
                                     'temperature_2m_mean', 'apparent_temperature_max', 'apparent_temperature_min', 
                                     'precipitation_sum', 'rain_sum', 'precipitation_hours', 'wind_speed_10m_max', 
                                     'wind_gusts_10m_max', 'wind_direction_10m_dominant', 'sunrise', 'sunset', 
                                     'daylight_duration', 'uv_index_max', 'weather_code']]
                
                df_daily['time'] = pd.to_datetime(df_daily['time']).dt.date
                df_daily['sunrise'] = pd.to_datetime(df_daily['sunrise'])
                df_daily['sunset'] = pd.to_datetime(df_daily['sunset'])
                
                df_daily = df_daily.where(pd.notnull(df_daily), None)
                
                C.import_from_iterable(df_daily.values.tolist(), 'FACT_WEATHER_DAILY')
                print(f"✅ Inserted daily data for {city_name}")
                
        except Exception as e:
            print(f"❌ Error fetching data for {city_name}: {e}")
            
        time.sleep(0.5)
        
    print("🎉 All done!")
    C.close()

if __name__ == '__main__':
    main()
