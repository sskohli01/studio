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
  const [gongSound, setGongSound] = useState<Howl | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const youtubeVideoId = 'R8XL0yf3CUw'; // Replace with your YouTube video ID
  const youtubeRef = useRef<HTMLIFrameElement>(null);

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

  const startTimer = () => {
    if (gongSound) {
      gongSound.play();
    }
    setIsRunning(true);
    if (selectedSound !== 'youtube' && sound && !isMuted) {
      sound.play();
    }

    if (selectedSound === 'youtube' && youtubeRef.current) {
      // Adjust the YouTube video to play through JavaScript control
      youtubeRef.current.contentWindow?.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
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

      if (selectedSound === 'youtube' && youtubeRef.current) {
          // Adjust the YouTube video to stop through JavaScript control
          youtubeRef.current.contentWindow?.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
      }
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
    backgroundColor: '#A7D1AB',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Function to handle meditation completion
  const handleMeditationCompletion = () => {
    toast({
      title: "Meditation Complete!",
      description: `Radha chanting completed!`,
    });
  };

  return (
    <div style={visualAidStyle} onClick={incrementJapaCount} className="transition-all duration-1000">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-8" style={{ color: 'black' }}>Radha Chanting</h1>

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
            </div>
          </CardContent>
        </Card>
        {selectedSound === 'youtube' && (
          <div className="mt-4">
            <YouTubeEmbed videoId={youtubeVideoId} />
          </div>
        )}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold" style={{ color: 'black' }}>Time Remaining:</h2>
          <p className="text-4xl font-bold text-accent">{formatTime(timeRemaining)}</p>
          <p className="text-lg text-muted-foreground mt-2">Tap anywhere to increment Japa Count</p>
          <p className="text-xl mt-4" style={{ color: 'black' }}>Japa Count: {japaCount}</p>
        </div>
      </div>
    </div>
  );
}
