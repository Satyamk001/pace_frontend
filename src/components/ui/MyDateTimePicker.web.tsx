import { colors, typography, spacing, borderRadius } from '../../theme';
import React from 'react';
import { View, Text, Platform } from 'react-native';

interface MyDateTimePickerProps {
  testID?: string;
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  is24Hour?: boolean;
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange?: (event: any, date?: Date) => void;
  style?: any;
}

export const MyDateTimePicker = ({ value, mode, onChange }: MyDateTimePickerProps) => {
  // Simple web fallback using HTML input type="date" or "time" if possible, 
  // but since we are in React Native Web, we might need a different approach or just a simple text input for now.
  // A robust solution would use a web-specific date picker library, but for now let's use a simple simulated input.
  
  // Actually, for React Native Web, we can render a DOM element using createElement if needed, 
  // or just return null/placeholder if strictly native features are required.
  // However, simpler is often better: render a customized View that when clicked might open a web picker?
  
  // Let's use a standard HTML input for web if we can target web specifically.
  if (Platform.OS === 'web') {
      const type = mode === 'time' ? 'time' : 'date';
      
      const handleChange = (e: any) => {
          const dateStr = e.target.value;
          if (!dateStr) return;
          
          const newDate = new Date(value);
          if (mode === 'time') {
              const [hours, minutes] = dateStr.split(':');
              newDate.setHours(parseInt(hours), parseInt(minutes));
          } else {
              const [year, month, day] = dateStr.split('-');
              newDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
           
          if (onChange) {
              onChange({ type: 'set', nativeEvent: e }, newDate);
          }
      };

      // Format value for input
      let inputValue = '';
      if (mode === 'time') {
          inputValue = value.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      } else {
          inputValue = value.toISOString().split('T')[0];
      }

      return (
        <View style={{ padding: 10, backgroundColor: colors.surfaceSoft, borderRadius: 8 }}>
            <Text style={{ marginBottom: 5, fontSize: 12, color: colors.textSecondary }}>
                {mode === 'time' ? 'Select Time (Web)' : 'Select Date (Web)'}
            </Text>
            {/* @ts-ignore: React Native Web supports createElement */}
            <input 
                type={type} 
                value={inputValue} 
                onChange={handleChange}
                style={{
                    padding: spacing.sm,
                    borderRadius: borderRadius.s,
                    border: '1px solid #ccc',
                    ...typography.body,
                }}
            />
        </View>
      );
  }

  return <View><Text>DatePicker not supported on this platform</Text></View>;
};
