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
    if (!value || value === 0) return 'rgba(255, 255, 255, 0.04)';
    if (value < 50) return 'rgba(56, 189, 248, 0.2)';
    if (value < 150) return 'rgba(56, 189, 248, 0.45)';
    if (value < 300) return 'rgba(2, 132, 199, 0.75)';
    if (value < 500) return 'rgba(3, 105, 161, 0.9)';
    return '#0284c7';
  };

  const getTextColor = (value: number) => {
    if (!value || value === 0) return '#64748b';
    if (value < 150) return '#e0f2fe';
    return '#ffffff';
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌧️ Pan-India Monthly Rainfall Heatmap (mm)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
            Exasol In-Memory Multi-Station Precipitation Telemetry & Southwest Monsoon Distribution
          </p>
        </div>

        {/* Color Legend Scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ color: '#94a3b8' }}>Rainfall Scale:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.15)' }}></span> Dry (0)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.2)' }}></span> &lt;50mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.45)' }}></span> 50-150mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(2, 132, 199, 0.75)' }}></span> 150-300mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(3, 105, 161, 0.9)' }}></span> 300-500mm
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7' }}></span> 500mm+
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Exasol monsoon data...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '14px', background: 'rgba(13, 27, 49, 0.85)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 22, 40, 0.8)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <th style={{ textAlign: 'left', padding: '14px 16px', fontWeight: 800, color: '#f8fafc', minWidth: '130px' }}>Station / City</th>
                {ALL_MONTHS.map(m => {
                  const isMonsoon = MONSOON_MONTHS.includes(m);
                  return (
                    <th 
                      key={m} 
                      style={{ 
                        padding: '12px 8px', 
                        fontWeight: 700, 
                        color: isMonsoon ? '#38bdf8' : '#94a3b8',
                        background: isMonsoon ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                        borderLeft: isMonsoon && m === 'Jun' ? '2px solid #38bdf8' : 'none',
                        borderRight: isMonsoon && m === 'Sep' ? '2px solid #38bdf8' : 'none',
                      }}
                    >
                      <div>{m}</div>
                      {isMonsoon && <div style={{ fontSize: '0.62rem', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monsoon</div>}
                    </th>
                  );
                })}
                <th style={{ padding: '14px 16px', fontWeight: 800, color: '#38bdf8', background: 'rgba(2, 132, 199, 0.15)', minWidth: '100px' }}>
                  Annual Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.city} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                  <td style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 700, color: '#f8fafc' }}>
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
                          borderLeft: isMonsoon && m === 'Jun' ? '2px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.03)',
                          borderRight: isMonsoon && m === 'Sep' ? '2px solid rgba(56, 189, 248, 0.4)' : 'none',
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
                  <td style={{ padding: '12px 16px', fontWeight: 800, color: '#38bdf8', background: 'rgba(2, 132, 199, 0.12)' }}>
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
