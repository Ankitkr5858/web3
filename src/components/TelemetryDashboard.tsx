/**
 * @file TelemetryDashboard.tsx
 * @description A React component that displays real-time page view analytics using
 * a line chart. The component fetches telemetry data from an API endpoint and
 * updates the visualization every minute.
 */

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

/** API endpoint for telemetry data, configurable via environment variables */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** 
 * Interface representing a single page view data point
 * @interface
 * @property {number} timestamp - Unix timestamp of the page view
 * @property {number} count - Number of page views at this timestamp
 */
interface PageView {
  timestamp: number;
  count: number;
}

/**
 * TelemetryDashboard Component
 * @component
 * @description Displays a real-time line chart of page views over time.
 * Features include:
 * - Automatic data refresh every minute
 * - Loading and error states
 * - Responsive chart layout
 * - Time-formatted axis labels
 * @returns {JSX.Element} The rendered dashboard component
 */
export default function TelemetryDashboard() {
  // State management for page view data, loading state, and error handling
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect hook to fetch and update page view data
   * Sets up an interval to refresh data every minute
   */
  useEffect(() => {
    const fetchPageViews = async () => {
      try {
        const response = await fetch(`${API_URL}/telemetry/pageviews`);
        if (!response.ok) throw new Error('Failed to fetch page views');
        const data = await response.json();
        setPageViews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPageViews();
    const interval = setInterval(fetchPageViews, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading telemetry data: {error}
      </div>
    );
  }

  /**
   * Formats a Unix timestamp into a localized time string
   * @param {number} timestamp - Unix timestamp to format
   * @returns {string} Formatted time string
   */
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Page Views per Minute</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pageViews}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip
              labelFormatter={formatTime}
              formatter={(value: number) => [`${value} views`]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}