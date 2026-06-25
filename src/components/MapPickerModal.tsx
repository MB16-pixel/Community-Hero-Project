import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  useMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { X, Search, MapPin, Check, HelpCircle } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: string) => void;
  initialAddress?: string;
}

// Inner component that runs inside the APIProvider
const MapPickerContent: React.FC<{
  onSelectAddress: (address: string) => void;
  onClose: () => void;
  initialAddress?: string;
}> = ({ onSelectAddress, onClose, initialAddress }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral>({ 
    lat: 37.7749, // Default to San Francisco
    lng: -122.4194 
  });
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize Autocomplete
  useEffect(() => {
    if (!placesLib || !searchInputRef.current) return;

    const autocomplete = new placesLib.Autocomplete(searchInputRef.current, {
      fields: ['geometry', 'formatted_address', 'name']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCoords = { lat, lng };
        setSelectedLocation(newCoords);
        
        const addr = place.formatted_address || place.name || '';
        setResolvedAddress(addr);
        setSearchQuery(addr);

        if (map) {
          map.panTo(newCoords);
          map.setZoom(16);
        }
      }
    });

    autocompleteRef.current = autocomplete;
  }, [placesLib, map]);

  // Handle Geocoding of initial address if provided and coordinate is default
  useEffect(() => {
    if (!geocodingLib || !initialAddress || initialAddress.trim() === '') return;

    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ address: initialAddress }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        setSelectedLocation(coords);
        if (map) {
          map.panTo(coords);
          map.setZoom(15);
        }
      }
    });
  }, [geocodingLib, initialAddress, map]);

  // Reverse geocode when coordinates change
  const performReverseGeocode = (lat: number, lng: number) => {
    if (!geocodingLib) return;

    setIsGeocoding(true);
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsGeocoding(false);
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        setResolvedAddress(addr);
        setSearchQuery(addr);
      }
    });
  };

  // Handle Map Click to drop marker
  const handleMapClick = (e: any) => {
    if (e.detail?.latLng) {
      const newCoords = {
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng
      };
      setSelectedLocation(newCoords);
      performReverseGeocode(newCoords.lat, newCoords.lng);
    }
  };

  const handleConfirm = () => {
    if (resolvedAddress) {
      onSelectAddress(resolvedAddress);
    } else {
      onSelectAddress(`${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`);
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-t-3xl md:rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#EDE9E0] flex justify-between items-center bg-[#FBF9F6]">
        <div>
          <h3 className="font-serif font-bold text-base text-[#2C362E]">Choose Location</h3>
          <p className="text-[11px] text-[#7A7A7A]">Search or click on the map to pin-point the issue</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-full hover:bg-[#EAE4D8] text-[#5A6B5D] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Autocomplete Search input */}
      <div className="p-4 border-b border-[#EDE9E0] bg-[#FBF9F6]">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="w-4 h-4 text-[#5A6B5D]" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5A6B5D]/20 focus:border-[#5A6B5D] transition-all text-[#3D3D3D]"
          />
        </div>
      </div>

      {/* Map display */}
      <div className="flex-1 relative bg-slate-100 min-h-[300px]">
        <Map
          defaultZoom={13}
          center={selectedLocation}
          mapId="DEMO_MAP_ID"
          onViewportChanged={(e) => {
            // optional: trace map moves
          }}
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={selectedLocation}>
            <Pin background="#5A6B5D" glyphColor="#ffffff" borderColor="#2C362E" />
          </AdvancedMarker>
        </Map>

        {isGeocoding && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-[11px] font-bold text-[#5A6B5D] flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-[#5A6B5D] border-t-transparent rounded-full animate-spin" />
            Resolving address...
          </div>
        )}
      </div>

      {/* Footer / Selected Address details */}
      <div className="p-5 border-t border-[#EDE9E0] bg-[#FBF9F6] space-y-4">
        {resolvedAddress ? (
          <div className="flex gap-2.5 items-start bg-white p-3.5 rounded-xl border border-[#EDE9E0]">
            <MapPin className="w-4 h-4 text-[#5A6B5D] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#2C362E] truncate">Selected Address</p>
              <p className="text-xs text-[#5A6B5D] mt-0.5 break-words line-clamp-2 leading-relaxed">
                {resolvedAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-3.5 rounded-xl border border-[#EDE9E0] text-center">
            <p className="text-xs font-bold text-[#7A7A7A]">Click anywhere on the map to choose a coordinate</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-[#5A6B5D] hover:bg-[#4A594D] text-white rounded-xl text-sm font-bold shadow-md shadow-[#5A6B5D]/10 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 text-[#EDE9E0]" />
          <span>Confirm Location</span>
        </button>
      </div>
    </div>
  );
};

export const MapPickerModal: React.FC<MapPickerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectAddress,
  initialAddress 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full md:max-w-2xl h-[90vh] md:h-[650px] flex flex-col shadow-2xl relative animate-slide-up">
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <MapPickerContent 
              onSelectAddress={onSelectAddress} 
              onClose={onClose} 
              initialAddress={initialAddress}
            />
          </APIProvider>
        ) : (
          <div className="flex flex-col h-full bg-white rounded-t-3xl md:rounded-3xl overflow-hidden p-6 justify-center">
            <div className="text-center max-w-md mx-auto space-y-6">
              <div className="mx-auto w-12 h-12 bg-[#FFF2ED] text-[#D9835D] rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#2C362E]">Google Maps Key Required</h3>
                <p className="text-xs text-[#7A7A7A] mt-2 leading-relaxed">
                  The Map Picker relies on Google Maps Platform services. Please configure your key as an AI Studio environment variable to continue.
                </p>
              </div>

              <div className="bg-[#FBF9F6] border border-[#EDE9E0] rounded-2xl p-4 text-left space-y-3.5">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-[#5A6B5D] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-xs text-[#3D3D3D] leading-relaxed">
                    <a 
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#5A6B5D] underline font-bold"
                    >
                      Get a free Google Maps API key
                    </a> from Google Cloud.
                  </p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-[#5A6B5D] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-xs text-[#3D3D3D] leading-relaxed">
                    Open <strong className="font-bold">Settings</strong> (⚙️ gear icon, top-right) &rarr; <strong className="font-bold">Secrets</strong>. Add a secret named:
                    <code className="block mt-1.5 px-2.5 py-1.5 bg-[#EDE9E0] text-[#2C362E] font-mono text-[11px] rounded-md border border-[#DCD6C8]">
                      GOOGLE_MAPS_PLATFORM_KEY
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-[#E5E0D5] hover:bg-slate-50 text-[#7A7A7A] rounded-xl text-xs font-bold transition-all"
                >
                  Close & Type Address Manually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
