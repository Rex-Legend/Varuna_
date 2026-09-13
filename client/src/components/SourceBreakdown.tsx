import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface SourceItem {
  name: string;
  value: number;
}

export default function SourceBreakdown() {
  const [data, setData] = useState<SourceItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/analytics/source-breakdown');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching source breakdown', error);
      }
    };
    fetchData();
  }, []);

  const COLORS: Record<string, { color: string; icon: string }> = {
    'API Records': { color: '#0284c7', icon: '🌐' },
    'Social Posts': { color: '#9333ea', icon: '📱' },
    'Citizen Reports': { color: '#10b981', icon: '👥' },
    'Disaster Alerts': { color: '#ef4444', icon: '🚨' },
    'Public Datasets': { color: '#f59e0b', icon: '📂' }
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 In-Memory Telemetry Breakdown
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
          Exasol multi-source distribution across Big Data ingest pipelines
        </p>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading source distribution...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center', flex: 1 }}>
          {/* Donut Chart with Center Total */}
          <div style={{ position: 'relative', width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]?.color || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09182d',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    fontSize: '0.85rem'
                  }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} records`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
                {total.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>
                Total Rows
              </div>
            </div>
          </div>

          {/* Source Breakdown Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.map(item => {
              const cfg = COLORS[item.name] || { color: '#64748b', icon: '📌' };
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: cfg.color
                    }}></span>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                      {cfg.icon} {item.name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>{item.value.toLocaleString()}</span>
                    <span style={{ marginLeft: '6px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
