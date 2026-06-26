import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './navigation/Navigation';
import { Wifi, Battery, ShieldAlert, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { audio } from './utils/audio';

export default function App() {
  // Simple state to simulate current time inside the device status bar
  const [time, setTime] = React.useState('09:41');
  const [muted, setMuted] = React.useState(audio.getMuted());

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12; // convert to 12 hour format
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextMuted = !muted;
    audio.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      audio.playClick();
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F9F7F2] flex flex-col items-center justify-center p-0 sm:p-6 md:p-10 font-sans text-[#3D3D3D] antialiased overflow-hidden relative">
        
        {/* Subtle grid and decorative circles in the background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3d3d3d0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#5A6B5D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#D9835D]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Info Badge for Desktop view */}
        <div className="hidden sm:flex items-center gap-2 mb-4 bg-white/60 border border-[#E5E0D5] px-4 py-1.5 rounded-full backdrop-blur-md z-10 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#5A6B5D]" />
          <span className="text-xs font-bold text-[#5A6B5D]">
            Community Hero Link Portal
          </span>
        </div>

        {/* Device Frame */}
        <div className="w-full h-screen sm:h-[840px] sm:w-[412px] bg-black sm:rounded-[3.2rem] sm:p-3 sm:shadow-[0_25px_60px_-15px_rgba(44,54,46,0.3)] sm:border-[5px] sm:border-[#EDE9E0] flex flex-col relative z-10 overflow-hidden">
          
          {/* Speaker / Camera Notch notch */}
          <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-40 sm:flex hidden pointer-events-none">
            <div className="w-36 h-4 bg-black rounded-b-2xl flex items-center justify-center">
              <div className="w-12 h-1 bg-slate-900 rounded-full mb-1" />
            </div>
          </div>

          {/* Screen Content Container */}
          <div className="flex-1 bg-[#F9F7F2] flex flex-col overflow-hidden sm:rounded-[2.4rem] relative">
            
            {/* Simulated Smartphone Status Bar */}
            <div className="h-8 bg-[#5A6B5D] px-5 flex justify-between items-center text-white text-[11px] font-black shrink-0 select-none z-30">
              <span>{time}</span>
              {/* Center capsule notch on mobile layout */}
              <div className="w-20 h-4 bg-black/20 rounded-full flex items-center justify-center sm:hidden">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-1" />
                <span className="text-[8px] text-slate-300 font-bold">HERO LINK</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={toggleSound} 
                  className="p-1 hover:bg-white/15 rounded-md transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                  aria-label="Toggle Sound Effects"
                >
                  {muted ? (
                    <VolumeX className="w-3.5 h-3.5 text-white/60" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="text-[9px]">5G</span>
                  <Battery className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Simulated Navigation Component */}
            <div className="flex-1 overflow-hidden relative">
              <Navigation />
            </div>

            {/* Simulated iOS Home Bar on Desktop */}
            <div className="h-4 bg-white flex justify-center items-center shrink-0 sm:flex hidden">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer info about directories */}
        <div className="hidden sm:block mt-6 text-[11px] text-slate-500 font-medium tracking-wide text-center z-10 max-w-sm leading-normal">
          Empowering neighborhoods through collective action.<br/>
          Real-time reports are verified and synchronized live.
        </div>
      </div>
    </AuthProvider>
  );
}
