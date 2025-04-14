'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils";
import { Play, Pause, Repeat, Bell, Volume2, VolumeX } from 'lucide-react';
import { Howl } from 'howler';
import { useIsMobile } from '@/hooks/use-mobile';

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

const colorPalette = [
  '#A7D1AB', // Soothing blue
  '#BDE0FE',
  '#F2E1C2',
  '#D4A373',
  '#94D2BD',
  '#A9D6E5',
  '#FAD2E1',
  '#DDBEA9',
  '#9A8C98',
];

const sounds = {
  nature: '/sounds/nature.mp3',
  binaural: '/sounds/binaural.mp3',
  youtube: 'youtube',
  none: null,
};

// Function to embed a YouTube video
const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  const videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;

  return (
    <div className="aspect-w-16 aspect-h-9">
      <iframe
        src={videoSrc}
        title="YouTube meditation video"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  );
};

export default function Home() {
  const [duration, setDuration] = useState(300); // Default 5 minutes
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  const [chimeInterval, setChimeInterval] = useState<number | null>(null);
  const [selectedSound, setSelectedSound] = useState<keyof typeof sounds>('nature');
  const [sound, setSound] = useState<Howl | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBgColorIndex, setCurrentBgColorIndex] = useState(0);
  const [gongSound, setGongSound] = useState<Howl | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [streak, setStreak] = useState(0); // Track meditation streak
  const [lastMeditated, setLastMeditated] = useState<Date | null>(null);

  const youtubeVideoId = 'R8XL0yf3CUw'; // Replace with your YouTube video ID

  useEffect(() => {
    setGongSound(new Howl({
      src: ['/sounds/gong.mp3'],
      volume: volume,
    }));
  }, [volume]);

  useEffect(() => {
    if (selectedSound === 'youtube') {
      // Stop other sounds if YouTube is selected
      if (sound) {
        sound.pause();
      }
      setSound(null);
    } else if (sounds[selectedSound]) {
      setSound(new Howl({
        src: [sounds[selectedSound]!],
        loop: true,
        volume: volume,
      }));
    } else {
      setSound(null);
    }
  }, [selectedSound, volume]);

  useEffect(() => {
    if (sound) {
      sound.volume(volume);
      if (isRunning && !isMuted) {
        sound.play();
      }
    }
    if (isMuted && sound) {
      sound.pause();
    }
  }, [sound, isRunning, volume, isMuted]);

  useEffect(() => {
    const colorChangeInterval = setInterval(() => {
      setCurrentBgColorIndex((prevIndex) => (prevIndex + 1) % colorPalette.length);
    }, 10000); // Change color every 10 seconds

    return () => clearInterval(colorChangeInterval);
  }, []);

  // Load streak and lastMeditated from localStorage
  useEffect(() => {
    const storedStreak = localStorage.getItem('meditationStreak');
    const storedLastMeditated = localStorage.getItem('lastMeditated');

    if (storedStreak) {
      setStreak(parseInt(storedStreak, 10));
    }

    if (storedLastMeditated) {
      setLastMeditated(new Date(storedLastMeditated));
    }
  }, []);

  const startTimer = () => {
    if (gongSound) {
      gongSound.play();
    }
    setIsRunning(true);
    if (sound && !isMuted) {
      sound.play();
    }
    timerIdRef.current = window.setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          stopTimer();
          if (gongSound) {
            gongSound.play();
          }
          handleMeditationCompletion();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (chimeInterval && isRunning) {
      const chimeTimerId = setInterval(() => {
        if (gongSound) {
          gongSound.play();
        }
      }, chimeInterval * 60 * 1000); // Convert minutes to milliseconds

      return () => clearInterval(chimeTimerId);
    }
  }, [chimeInterval, isRunning, gongSound]);

  const stopTimer = () => {
    setIsRunning(false);
    if (sound) {
      sound.pause();
    }
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const resetTimer = () => {
    stopTimer();
    setTimeRemaining(duration);
    setJapaCount(0);
  };

  const handleDurationChange = (newValue: number[]) => {
    const newDuration = newValue[0];
    setDuration(newDuration);
    setTimeRemaining(newDuration);
  };

  const incrementJapaCount = () => {
    setJapaCount((count) => count + 1);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Sound on" : "Sound muted",
      description: isMuted ? "Sounds are now unmuted." : "Sounds are now muted.",
    })
  };

  const visualAidStyle = {
    backgroundColor: colorPalette[currentBgColorIndex],
    transition: 'background-color 10s ease-in-out',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Function to handle meditation completion
  const handleMeditationCompletion = () => {
    const today = new Date();
    const isSameDay = lastMeditated &&
      today.getFullYear() === lastMeditated.getFullYear() &&
      today.getMonth() === lastMeditated.getMonth() &&
      today.getDate() === lastMeditated.getDate();

    if (!isSameDay) {
      const isConsecutiveDay = lastMeditated &&
        today.getFullYear() === lastMeditated.getFullYear() &&
        today.getMonth() === lastMeditated.getMonth() &&
        today.getDate() === lastMeditated.getDate() + 1;

      const newStreak = isConsecutiveDay ? streak + 1 : 1;
      setStreak(newStreak);
      localStorage.setItem('meditationStreak', newStreak.toString());
      setLastMeditated(today);
      localStorage.setItem('lastMeditated', today.toISOString());

      toast({
        title: "Meditation Complete!",
        description: `You've meditated ${isConsecutiveDay ? 'another' : 'for the first'} day in a row! Your streak is now ${newStreak}.`,
      });
    } else {
      toast({
        title: "Meditation Already Done Today",
        description: "You've already meditated today. Come back tomorrow to continue your streak!",
      });
    }
  };

  // Dummy data for meditation activity
  const dummyMeditationData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(new Date().setDate(new Date().getDate() - i)).toISOString().slice(0, 10),
    meditated: Math.random() > 0.3, // Simulate some days missed
  }));

  return (
    <div style={visualAidStyle} onClick={incrementJapaCount} className="transition-all duration-1000">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-5xl font-bold text-primary mb-8">Zenith Timer</h1>

        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration: {formatTime(duration)}
              </label>
              <Slider
                id="duration"
                min={60}
                max={3600}
                step={60}
                defaultValue={[duration]}
                onValueChange={handleDurationChange}
                aria-label="Meditation Duration"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="sound" className="text-sm font-medium">
                Sound:
              </label>
              <select
                id="sound"
                className="bg-background text-foreground rounded-md px-2 py-1"
                value={selectedSound}
                onChange={(e) => setSelectedSound(e.target.value as keyof typeof sounds)}
              >
                <option value="nature">Nature</option>
                <option value="binaural">Binaural Beats</option>
                <option value="youtube">YouTube Loop</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="volume" className="text-sm font-medium">Volume:</label>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span className="sr-only">Toggle Mute</span>
                </Button>
                <Slider
                  id="volume"
                  min={0}
                  max={1}
                  step={0.1}
                  defaultValue={[volume]}
                  onValueChange={(newValue) => setVolume(newValue[0])}
                  aria-label="Volume"
                  className="w-32"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="chimeInterval" className="text-sm font-medium">
                Chime Interval (minutes):
              </label>
              <select
                id="chimeInterval"
                className="bg-background text-foreground rounded-md px-2 py-1"
                value={chimeInterval !== null ? chimeInterval : 'none'}
                onChange={(e) => {
                  const value = e.target.value;
                  setChimeInterval(value === 'none' ? null : parseInt(value));
                }}
              >
                <option value="none">None</option>
                <option value="2">2</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>

            <div className="flex justify-around mt-4">
              {isRunning ? (
                <Button onClick={stopTimer} variant="secondary">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button onClick={startTimer} variant="secondary">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline">
                <Repeat className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
        {selectedSound === 'youtube' && (
          <div className="mt-4">
            <YouTubeEmbed videoId={youtubeVideoId} />
          </div>
        )}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-primary">Time Remaining:</h2>
          <p className="text-4xl font-bold text-accent">{formatTime(timeRemaining)}</p>
          <p className="text-lg text-muted-foreground mt-2">Tap anywhere to increment Japa Count</p>
          <p className="text-xl text-primary mt-4">Japa Count: {japaCount}</p>
          <p className="text-xl text-primary mt-2">Meditation Streak: {streak} days</p>
        </div>

         {/* Statistics Section */}
         <div className="mt-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-primary mb-4">Statistics</h2>
            <Card>
              <CardContent className="flex flex-col gap-4">
                {/* Streak Display */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Streak:</span>
                  <span className="text-lg font-bold">{streak} days</span>
                </div>

                {/* Heat Map Visualization */}
                <div className="w-full overflow-x-auto">
                  <div className="flex gap-1">
                    {dummyMeditationData.map((item) => (
                      <div
                        key={item.date}
                        className={`w-6 h-6 rounded-sm ${item.meditated ? 'bg-accent' : 'bg-muted'}`}
                        title={`${item.date}: ${item.meditated ? 'Meditated' : 'Missed'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 Days</p>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}
