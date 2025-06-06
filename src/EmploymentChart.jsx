import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import Papa from 'papaparse';

const EmploymentChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [peakEmployment, setPeakEmployment] = useState(null);
  const [finalEmployment, setFinalEmployment] = useState(null);
  const [peakEmploymentDate, setPeakEmploymentDate] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use fetch API to get the CSV file
        const response = await fetch('/combined_sj_professional_services.csv');
        const fileContent = await response.text();
        
        const parsedData = Papa.parse(fileContent, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', '|', ';']
        });

        // Sort data by date
        const sortedData = parsedData.data.sort((a, b) => {
          return new Date(a.Date) - new Date(b.Date);
        });

        // Format data for the chart
        const chartData = sortedData.map(row => ({
          date: row.Date_Readable,
          employment: row['Current Employment'],
          year: row.Year,
          month: row.Month,
          sortDate: new Date(row.Date)
        }));

        // Find peak employment and its date
        let maxEmployment = 0;
        let maxEmploymentIndex = 0;
        
        chartData.forEach((item, index) => {
          if (item.employment > maxEmployment) {
            maxEmployment = item.employment;
            maxEmploymentIndex = index;
          }
        });
        
        setPeakEmployment(maxEmployment);
        setPeakEmploymentDate(chartData[maxEmploymentIndex].date);
        setFinalEmployment(chartData[chartData.length - 1].employment);
        setData(chartData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTooltip = (value, name, props) => {
    if (name === 'employment') {
      return [value.toLocaleString(), 'Employment'];
    }
    return [value, name];
  };

  const formatYAxis = (value) => {
    return (value / 1000).toFixed(0) + 'K';
  };

  // Calculate Y-axis ticks at 10K intervals
  const calculateYAxisTicks = () => {
    if (data.length === 0) return [];
    
    const minValue = Math.floor(Math.min(...data.map(d => d.employment)) / 10000) * 10000;
    const maxValue = Math.ceil(Math.max(...data.map(d => d.employment)) / 10000) * 10000;
    
    const ticks = [];
    for (let i = minValue; i <= maxValue; i += 10000) {
      ticks.push(i);
    }
    
    return ticks;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  // Find index of peak employment for reference line
  const peakIndex = data.findIndex(d => d.employment === peakEmployment);
  const peakItem = peakIndex !== -1 ? data[peakIndex] : null;

  return (
    <div className="w-full p-6 bg-white">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Professional Services Employment Trends (2014-2025)
      </h2>
      
      <div className="mb-4 text-sm text-gray-600 text-center">
        Employment numbers in thousands
      </div>

      <ResponsiveContainer width="100%" height={600}>
        <LineChart
          data={data}
          margin={{
            top: 30,
            right: 80,
            left: 30,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={10}
            interval={Math.floor(data.length / 12)} // Show roughly every 12th label
          />
          <YAxis 
            tickFormatter={formatYAxis}
            fontSize={12}
            ticks={calculateYAxisTicks()} // Use custom ticks at 10K intervals
            domain={['dataMin - 10000', 'dataMax + 10000']} // Add padding to Y-axis
            padding={{ top: 20, bottom: 20 }}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#333' }}
            contentStyle={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}
          />
          <Legend />
          
          {/* Reference line for peak employment */}
          {peakItem && (
            <ReferenceLine 
              x={peakItem.date} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              strokeWidth={2}
            >
              <Label 
                value={`Peak: ${peakEmployment.toLocaleString()}`} 
                position="insideTopRight" 
                fill="#10b981"
                fontSize={12}
                fontWeight="bold"
                offset={10}
              />
            </ReferenceLine>
          )}
          
          {/* Reference line for final value */}
          {data.length > 0 && (
            <ReferenceLine 
              x={data[data.length - 1].date} 
              stroke="#6366f1" 
              strokeDasharray="3 3"
              strokeWidth={2}
            >
              <Label 
                value={`Final: ${finalEmployment.toLocaleString()}`} 
                position="insideTopRight" 
                fill="#6366f1"
                fontSize={12}
                fontWeight="bold"
                offset={-20}
              />
            </ReferenceLine>
          )}
          
          <Line 
            type="monotone" 
            dataKey="employment" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
            name="Employment"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Data Range</h3>
          <p className="text-blue-600">
            {data.length > 0 && `${data[0].date} to ${data[data.length - 1].date}`}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Peak Employment</h3>
          <p className="text-green-600">
            {peakEmployment && peakEmployment.toLocaleString()}
            {peakEmploymentDate && ` (${peakEmploymentDate})`}
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Total Data Points</h3>
          <p className="text-purple-600">{data.length} months</p>
        </div>
      </div>
    </div>
  );
};

export default EmploymentChart;