import pyexasol

cities_data = [
    ('Mumbai', 'Maharashtra', 19.0760, 72.8777, 14.0, 20411000, 'Tropical Wet and Dry'),
    ('Delhi', 'Delhi', 28.7041, 77.1025, 225.0, 16787941, 'Humid Subtropical'),
    ('Bangalore', 'Karnataka', 12.9716, 77.5946, 920.0, 8443675, 'Tropical Savanna'),
    ('Hyderabad', 'Telangana', 17.3850, 78.4867, 542.0, 6809970, 'Tropical Wet and Dry'),
    ('Chennai', 'Tamil Nadu', 13.0827, 80.2707, 6.0, 7088000, 'Tropical Wet and Dry'),
    ('Kolkata', 'West Bengal', 22.5726, 88.3639, 9.0, 4496694, 'Tropical Wet and Dry'),
    ('Ahmedabad', 'Gujarat', 23.0225, 72.5714, 53.0, 5570585, 'Hot Semi-Arid'),
    ('Pune', 'Maharashtra', 18.5204, 73.8567, 560.0, 3124458, 'Tropical Wet and Dry'),
    ('Jaipur', 'Rajasthan', 26.9124, 75.7873, 431.0, 3046163, 'Hot Semi-Arid'),
    ('Lucknow', 'Uttar Pradesh', 26.8467, 80.9462, 123.0, 2817105, 'Humid Subtropical'),
    ('Surat', 'Gujarat', 21.1702, 72.8311, 13.0, 4467797, 'Tropical Savanna'),
    ('Kanpur', 'Uttar Pradesh', 26.4499, 80.3319, 126.0, 2765348, 'Humid Subtropical'),
    ('Nagpur', 'Maharashtra', 21.1458, 79.0882, 310.0, 2405665, 'Tropical Savanna'),
    ('Indore', 'Madhya Pradesh', 22.7196, 75.8577, 553.0, 1994397, 'Tropical Savanna'),
    ('Thane', 'Maharashtra', 19.2183, 72.9781, 7.0, 1841488, 'Tropical Wet and Dry'),
    ('Bhopal', 'Madhya Pradesh', 23.2599, 77.4126, 427.0, 1798218, 'Humid Subtropical'),
    ('Visakhapatnam', 'Andhra Pradesh', 17.6868, 83.2185, 45.0, 1728128, 'Tropical Savanna'),
    ('Patna', 'Bihar', 25.5941, 85.1376, 53.0, 1684222, 'Humid Subtropical'),
    ('Vadodara', 'Gujarat', 22.3072, 73.1812, 39.0, 1670806, 'Tropical Savanna'),
    ('Ghaziabad', 'Uttar Pradesh', 28.6692, 77.4538, 214.0, 1648643, 'Humid Subtropical'),
    ('Ludhiana', 'Punjab', 30.9010, 75.8573, 244.0, 1618879, 'Humid Subtropical'),
    ('Agra', 'Uttar Pradesh', 27.1767, 78.0081, 171.0, 1585704, 'Semi-Arid'),
    ('Nashik', 'Maharashtra', 19.9975, 73.7898, 600.0, 1486053, 'Tropical Wet and Dry'),
    ('Ranchi', 'Jharkhand', 23.3441, 85.3096, 651.0, 1073427, 'Humid Subtropical'),
    ('Coimbatore', 'Tamil Nadu', 11.0168, 76.9558, 411.0, 1050721, 'Tropical Wet and Dry'),
    ('Kochi', 'Kerala', 9.9312, 76.2673, 0.0, 602046, 'Tropical Monsoon'),
    ('Guwahati', 'Assam', 26.1445, 91.7362, 54.0, 957352, 'Humid Subtropical'),
    ('Chandigarh', 'Chandigarh', 30.7333, 76.7794, 321.0, 1055450, 'Humid Subtropical'),
    ('Thiruvananthapuram', 'Kerala', 8.5241, 76.9366, 10.0, 743691, 'Tropical Monsoon'),
    ('Dehradun', 'Uttarakhand', 30.3165, 78.0322, 435.0, 578420, 'Humid Subtropical'),
    ('Shimla', 'Himachal Pradesh', 31.1048, 77.1734, 2276.0, 169578, 'Subtropical Highland'),
    ('Shillong', 'Meghalaya', 25.5788, 91.8933, 1525.0, 143229, 'Subtropical Highland'),
    ('Srinagar', 'Jammu and Kashmir', 34.0837, 74.7973, 1585.0, 1180570, 'Humid Subtropical'),
    ('Jodhpur', 'Rajasthan', 26.2389, 73.0243, 231.0, 1033918, 'Hot Desert'),
    ('Varanasi', 'Uttar Pradesh', 25.3176, 82.9739, 81.0, 1198491, 'Humid Subtropical'),
    ('Amritsar', 'Punjab', 31.6340, 74.8723, 234.0, 1132383, 'Semi-Arid'),
    ('Raipur', 'Chhattisgarh', 21.2514, 81.6296, 298.0, 1010087, 'Tropical Savanna'),
    ('Bhubaneswar', 'Odisha', 20.2961, 85.8245, 45.0, 841198, 'Tropical Savanna'),
    ('Imphal', 'Manipur', 24.8170, 93.9368, 786.0, 268243, 'Humid Subtropical'),
    ('Gangtok', 'Sikkim', 27.3314, 88.6138, 1650.0, 100286, 'Subtropical Highland'),
    ('Port Blair', 'Andaman and Nicobar', 11.6234, 92.7265, 16.0, 108058, 'Tropical Monsoon'),
    ('Leh', 'Ladakh', 34.1526, 77.5771, 3500.0, 30870, 'Cold Desert'),
    ('Manali', 'Himachal Pradesh', 32.2396, 77.1887, 2050.0, 8096, 'Subtropical Highland'),
    ('Darjeeling', 'West Bengal', 27.0410, 88.2663, 2042.0, 118805, 'Subtropical Highland'),
    ('Ooty', 'Tamil Nadu', 11.4100, 76.6950, 2240.0, 88430, 'Subtropical Highland'),
    ('Mount Abu', 'Rajasthan', 24.5926, 72.7156, 1220.0, 22943, 'Hot Semi-Arid'),
    ('Jaisalmer', 'Rajasthan', 26.9157, 70.9083, 225.0, 65471, 'Hot Desert'),
    ('Cherrapunji', 'Meghalaya', 25.2866, 91.7315, 1430.0, 14816, 'Subtropical Highland'),
    ('Mawsynram', 'Meghalaya', 25.2975, 91.5826, 1400.0, 1130, 'Subtropical Highland'),
    ('Bikaner', 'Rajasthan', 28.0229, 73.3119, 242.0, 644125, 'Hot Desert')
]

def main():
    print("Connecting to Exasol...")
    C = pyexasol.connect(dsn='localhost:8563', user='sys', password='exasol', schema='WEATHER_ANALYTICS')
    
    print("Truncating DIM_CITIES...")
    C.execute('TRUNCATE TABLE DIM_CITIES')
    
    print(f"Inserting {len(cities_data)} cities into DIM_CITIES...")
    C.import_from_iterable(cities_data, 'DIM_CITIES')
    
    print("Insertion complete.")
    C.close()

if __name__ == '__main__':
    main()
