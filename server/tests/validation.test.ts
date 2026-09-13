import { validateMeteorologicalFactCheck } from '../src/collectors/social-media-collector';

describe('Meteorological & Geographic Fact-Checking Gatekeeper Tests', () => {
  describe('Snowfall geographical boundary enforcement', () => {
    it('should REJECT snowfall claims in tropical/subtropical plains (e.g., Raipur, Chennai)', () => {
      const resultRaipur = validateMeteorologicalFactCheck(
        'Fresh snowfall blankets higher altitudes near Raipur. Temperatures dip significantly across valley. #Snowfall',
        'Raipur',
        'Chhattisgarh'
      );
      expect(resultRaipur.isValid).toBe(false);
      expect(resultRaipur.reason).toContain('Snowfall is geographically and climatologically impossible in Raipur');

      const resultChennai = validateMeteorologicalFactCheck(
        'Heavy snowfall disrupts traffic in central Chennai. #Snowfall',
        'Chennai',
        'Tamil Nadu'
      );
      expect(resultChennai.isValid).toBe(false);
    });

    it('should ALLOW legitimate snowfall reports in Himalayan Montane zones (e.g., Srinagar, Shimla, Gulmarg)', () => {
      const resultSrinagar = validateMeteorologicalFactCheck(
        'Heavy snowfall warning issued for upper reaches of Gulmarg and Srinagar. #Snowfall #IMD',
        'Srinagar',
        'Jammu and Kashmir'
      );
      expect(resultSrinagar.isValid).toBe(true);

      const resultShimla = validateMeteorologicalFactCheck(
        'Fresh snow accumulation of 15cm recorded at Ridge, Shimla. #Snowfall',
        'Shimla',
        'Himachal Pradesh'
      );
      expect(resultShimla.isValid).toBe(true);
    });
  });

  describe('Coastal Cyclone landfall enforcement', () => {
    it('should REJECT coastal cyclone landfall claims in landlocked inland states (e.g., Raipur, Delhi)', () => {
      const result = validateMeteorologicalFactCheck(
        'Severe coastal cyclone making landfall along the coastline of Raipur. #CycloneWarning',
        'Raipur',
        'Chhattisgarh'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('impossible');
    });

    it('should ALLOW coastal cyclone alerts in maritime states (e.g., Odisha, Andhra Pradesh, Tamil Nadu)', () => {
      const result = validateMeteorologicalFactCheck(
        'Deep depression intensifies into cyclonic storm tracking towards Odisha coastline. Landfall expected near Puri.',
        'Puri',
        'Odisha'
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('Extreme 45°C+ heatwaves in alpine mountain zones', () => {
    it('should REJECT 45°C scorching heatwave claims in alpine stations (e.g., Srinagar)', () => {
      const result = validateMeteorologicalFactCheck(
        'Scorching heatwave 46.5 C recorded with severe loo blowing across Srinagar valley. #Heatwave',
        'Srinagar',
        'Jammu and Kashmir'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('alpine climate');
    });
  });
});
