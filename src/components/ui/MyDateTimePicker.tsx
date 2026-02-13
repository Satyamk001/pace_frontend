import React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

interface MyDateTimePickerProps {
  testID?: string;
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  is24Hour?: boolean;
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange?: (event: any, date?: Date) => void;
  style?: any;
}

export const MyDateTimePicker = (props: MyDateTimePickerProps) => {
  return <DateTimePicker {...props} />;
};
