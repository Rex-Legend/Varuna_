import { useState, useEffect } from 'react';
import axios from 'axios';

interface CityMonsoonData {
  city: string;
  total: number;
  months: { [key: string]: number }; // e.g. { "Jan": 10, "Feb": 5, ... }
}

const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONSOON_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep'];

export default function RainfallHeatmap() {
  const [data, setData] = useState<CityMonsoonData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/analytics/monsoon');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching monsoon data', error);
      }
    };
    fetchData();
  }, []);

  const getColor = (value: number) => {
    if (!value || value === 0) return '#f8fafc';
    if (value < 50) return '#e0f2fe';
    if (value < 150) return '#7dd3fc';
    if (value < 300) return '#0284c7';
    if (value < 500) return '#0369a1';
    return '#075985';
  };

  const getTextColor = (value: number) => {
    if (!value || value === 0) return '#94a3b8';
    if (value < 150) return '#0f172a';
    return '#ffffff';
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌧️ Pan-India Monthly Rainfall Heatmap (mm)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
            Exasol In-Memory Multi-Station Precipitation Telemetry & Southwest Monsoon Distribution
          </p>
        </div>

        {/* Color Legend Scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#f8fafc', padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ color: '#64748b' }}>Rainfall Scale:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f8fafc', border: '1px solid #cbd5e1' }}></span> Dry (0)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#e0f2fe' }}></span> &lt;50mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#7dd3fc' }}></span> 50-150mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7' }}></span> 150-300mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0369a1' }}></span> 300-500mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#075985' }}></span> 500mm+
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading Exasol monsoon data...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '14px', background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 800, color: '#0f172a', minWidth: '130px' }}>Station / City</th>
                {ALL_MONTHS.map(m => {
                  const isMonsoon = MONSOON_MONTHS.includes(m);
                  return (
                    <th 
                      key={m} 
                      style={{ 
                        padding: '12px 8px', 
                        fontWeight: 700, 
                        color: isMonsoon ? '#0284c7' : '#64748b',
                        background: isMonsoon ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                        borderLeft: isMonsoon && m === 'Jun' ? '2px solid #0284c7' : 'none',
                        borderRight: isMonsoon && m === 'Sep' ? '2px solid #0284c7' : 'none',
                      }}
                    >
                      <div>{m}</div>
                      {isMonsoon && <div style={{ fontSize: '0.62rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monsoon</div>}
                    </th>
                  );
                })}
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', minWidth: '100px' }}>
                  Annual Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.city} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                    {row.city}
                  </td>
                  {ALL_MONTHS.map(m => {
                    const val = row.months[m] || 0;
                    const isMonsoon = MONSOON_MONTHS.includes(m);
                    return (
                      <td 
                        key={m} 
                        style={{ 
                          padding: '10px 6px',
                          borderLeft: isMonsoon && m === 'Jun' ? '2px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(0,0,0,0.03)',
                          borderRight: isMonsoon && m === 'Sep' ? '2px solid rgba(2, 132, 199, 0.3)' : 'none',
                        }}
                      >
                        <div style={{
                          backgroundColor: getColor(val),
                          color: getTextColor(val),
                          borderRadius: '6px',
                          padding: '6px 4px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          transition: 'transform 0.15s'
                        }}>
                          {val > 0 ? `${val}` : '-'}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0284c7', background: '#f8fafc' }}>
                    {row.total} mm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
