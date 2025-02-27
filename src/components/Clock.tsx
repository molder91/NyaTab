import React, { useState, useEffect } from 'react';
import { formatDate, formatTime, DateFormat } from '../utils/dateUtils';
import { getMessage } from '../utils/i18n';

/**
 * Clock component for displaying the current time and date
 */
const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Format the time as HH:MM:SS
  const formattedTime = formatTime(currentTime, true);
  
  // Format the date as Day, Month Date, Year
  const formattedDate = formatDate(currentTime, DateFormat.LONG);

  return (
    <div className="text-center text-white drop-shadow-lg">
      <div className="text-6xl font-light mb-2">{formattedTime}</div>
      <div className="text-xl">{formattedDate}</div>
    </div>
  );
};

export default Clock; 