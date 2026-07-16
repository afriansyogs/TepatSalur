"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapControls } from "@/components/ui/map";
import { mapService, MapMarkerData } from "@/services/map.service";
import { ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function InteractiveMap() {
  const [markers, setMarkers] = useState<MapMarkerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await mapService.getMapMarkers();
        setMarkers(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="w-full h-[65vh] md:h-[75vh] relative rounded-[28px] overflow-hidden border border-ink-100 shadow-xl">
      <Map
        theme="light"
        viewport={{
          center: [107.6191, -6.9175], // Pusat di Jawa Barat
          zoom: 8,
        }}
        loading={isLoading}
      >
        <MapControls position="bottom-right" showZoom showLocate showCompass />

        {markers.map((marker) => (
          <MapMarker
            key={marker.id}
            longitude={marker.location[0]}
            latitude={marker.location[1]}
          >
            <MarkerContent
              className={cn(
                "flex items-center justify-center rounded-xl p-2.5 shadow-md transition-transform hover:scale-110 border-2",
                marker.type === "relawan"
                  ? "bg-brand text-white border-white shadow-[0_4px_15px_rgba(2,132,199,0.3)] z-20"
                  : marker.urgency === "kritis"
                  ? "bg-critical text-white border-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] z-10"
                  : marker.urgency === "siaga"
                  ? "bg-warning text-white border-white shadow-md z-10"
                  : "bg-blue-500 text-white border-white shadow-md z-10"
              )}
            >
              {marker.type === "relawan" ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </MarkerContent>
            
            <MarkerTooltip className="bg-white/95 backdrop-blur-md border border-ink-100 text-ink-700 shadow-2xl p-4 min-w-[220px] rounded-2xl">
              <div className="font-bold text-ink-900 text-base mb-1">{marker.name}</div>
              
              {marker.type === "relawan" ? (
                <div>
                  <span className="inline-block px-2.5 py-1 bg-brand/10 text-brand text-[11px] font-bold uppercase tracking-wider rounded-md mb-2">Basecamp Relawan (Hub)</span>
                  <p className="text-sm text-ink-500 leading-relaxed">{marker.description}</p>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">Status</span>
                    <span className={cn(
                      "font-bold text-[10.5px] px-2 py-0.5 rounded-md uppercase tracking-wider",
                      marker.urgency === "kritis" ? "bg-critical/10 text-critical" :
                      marker.urgency === "siaga" ? "bg-warning/10 text-warning" :
                      "bg-blue-500/10 text-blue-600"
                    )}>
                      {marker.urgency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">Pengungsi</span>
                    <span className="font-bold text-ink-900">{marker.refugeesCount} Jiwa</span>
                  </div>
                  {marker.needs && marker.needs.length > 0 && (
                    <div className="text-sm border-t border-ink-100 pt-3 mt-3">
                      <span className="text-ink-400 block mb-2 font-medium">Kebutuhan Mendesak:</span>
                      <ul className="list-disc pl-4 text-ink-700 space-y-1 text-[13px]">
                        {marker.needs.map(need => (
                          <li key={need}>{need}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </MarkerTooltip>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
