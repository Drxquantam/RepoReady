import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { issueDistribution } from '../data/appContent.js';

export default function DonutChart({ data = issueDistribution }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={4}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
