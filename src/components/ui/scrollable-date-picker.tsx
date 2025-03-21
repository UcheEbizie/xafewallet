import React from 'react';
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ScrollableDatePicker = ({
  value,
  onChange,
  minDate = new Date(new Date().getFullYear() - 50, 0, 1), // Default to 50 years ago
  maxDate = new Date(2100, 11, 31),
  className
}: DatePickerProps) => {
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const years = Array.from(
    { length: maxDate.getFullYear() - minDate.getFullYear() + 1 },
    (_, i) => minDate.getFullYear() + i
  );

  const dates = Array.from(
    { length: getDaysInMonth(value.getFullYear(), value.getMonth()) },
    (_, i) => i + 1
  );

  const handleDateChange = (type: 'date' | 'month' | 'year', newValue: number) => {
    const newDate = new Date(value);
    
    switch (type) {
      case 'date':
        newDate.setDate(newValue);
        break;
      case 'month':
        // Adjust the date if it would overflow in the new month
        const maxDays = getDaysInMonth(newDate.getFullYear(), newValue);
        newDate.setMonth(newValue);
        if (newDate.getDate() > maxDays) {
          newDate.setDate(maxDays);
        }
        break;
      case 'year':
        newDate.setFullYear(newValue);
        break;
    }

    if (newDate >= minDate && newDate <= maxDate) {
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value.getDate()}
        onChange={(e) => handleDateChange('date', parseInt(e.target.value))}
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
      
      <select
        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value.getMonth()}
        onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
      >
        {months.map((month, index) => (
          <option key={month} value={index}>
            {month.slice(0, 3)}
          </option>
        ))}
      </select>
      
      <select
        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value.getFullYear()}
        onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ScrollableDatePicker;