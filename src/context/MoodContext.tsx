import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors } from '../theme';

type MoodType = 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'PAIN' | string;

interface MoodContextType {
  currentMood: MoodType;
  setMood: (mood: MoodType) => void;
  moodColor: string; // The active theme color derived from mood
}

const MoodContext = createContext<MoodContextType>({
  currentMood: 'GOOD',
  setMood: () => {},
  moodColor: colors.primary,
});

export const useMoodTheme = () => useContext(MoodContext);

export const MoodProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentMood, setCurrentMood] = useState<MoodType>('GOOD');
  const [moodColor, setMoodColor] = useState(colors.primary);

  useEffect(() => {
     switch(currentMood) {
         case 'GREAT': setMoodColor(colors.mood.great); break;
         case 'GOOD':  setMoodColor(colors.mood.good); break;
         case 'OKAY':  setMoodColor(colors.mood.okay); break;
         case 'LOW':   setMoodColor(colors.mood.low); break;
         case 'PAIN':  setMoodColor(colors.mood.pain); break;
         default:      setMoodColor(colors.primary);
     }
  }, [currentMood]);

  return (
    <MoodContext.Provider value={{ currentMood, setMood: setCurrentMood, moodColor }}>
      {children}
    </MoodContext.Provider>
  );
};
