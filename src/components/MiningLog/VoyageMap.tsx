import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { MiningLogDto } from '../../types/MiningLog';
import { listPortsAPI } from '../../features/API/miningLog/MiningLog';

// Fix leaflet icon issue in Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface Props {
    log: MiningLogDto;
}

export default function VoyageMap({ log }: Props) {
    const hauls = log.fishingHauls || [];
    const [ports, setPorts] = useState<any[]>([]);

    useEffect(() => {
        listPortsAPI().then(res => setPorts(res)).catch(() => {});
    }, []);
    // Sort hauls by time just in case
    const sortedHauls = useMemo(() => {
        return [...hauls].sort((a, b) => new Date(a.deployTime).getTime() - new Date(b.deployTime).getTime());
    }, [hauls]);

    // Gather all points for the path (Port -> Hauls -> Transshipments -> Port) sorted by time
    const routePoints: [number, number][] = useMemo(() => {
        const events: { time: number, lat: number, lng: number }[] = [];
        
        if (log.portStart?.lat && log.portStart?.lng) {
            events.push({ time: new Date(log.departureDate).getTime(), lat: log.portStart.lat, lng: log.portStart.lng });
        }
        
        if (log.portEnd?.lat && log.portEnd?.lng && log.arrivalDate) {
            events.push({ time: new Date(log.arrivalDate).getTime(), lat: log.portEnd.lat, lng: log.portEnd.lng });
        }
        
        sortedHauls.forEach(h => {
            events.push({ time: new Date(h.deployTime).getTime(), lat: h.deployLatitude, lng: h.deployLongitude });
            events.push({ time: new Date(h.haulTime).getTime(), lat: h.haulLatitude, lng: h.haulLongitude });
        });
        
        if (log.transshipmentEvents) {
            log.transshipmentEvents.forEach(t => {
                events.push({ time: new Date(t.transshipmentTime).getTime(), lat: t.latitude, lng: t.longitude });
            });
        }
        
        // Sort chronologically
        events.sort((a, b) => a.time - b.time);
        
        return events.map(e => [e.lat, e.lng] as [number, number]);
    }, [sortedHauls, log.portStart, log.portEnd, log.departureDate, log.arrivalDate, log.transshipmentEvents]);

    // Calculate center
    const center: [number, number] = useMemo(() => {
        const allPts = [...routePoints];
        if (log.portStart?.lat && log.portStart?.lng) allPts.push([log.portStart.lat, log.portStart.lng]);
        if (log.portEnd?.lat && log.portEnd?.lng) allPts.push([log.portEnd.lat, log.portEnd.lng]);
        
        if (allPts.length === 0) return [16.0, 108.0]; // Default center (Vietnam sea)
        
        let sumLat = 0;
        let sumLng = 0;
        allPts.forEach(p => {
            sumLat += p[0];
            sumLng += p[1];
        });
        return [sumLat / allPts.length, sumLng / allPts.length];
    }, [routePoints, log.portStart, log.portEnd]);

    if (hauls.length === 0 && !log.portStart?.lat && !log.portEnd?.lat) {
        return (
            <div className="flex justify-center items-center bg-slate-50" style={{ height: '400px', borderRadius: '0px', border: '1px dashed #cbd5e1' }}>
                <div className="text-center text-slate-500">
                    <p style={{ marginBottom: '8px' }}>📍 Không có tọa độ chuyến biển</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '0px', overflow: 'hidden', border: 'none' }}>
            <MapContainer center={center} zoom={8} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; Google Maps'
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                />
                
                {/* Draw the path connecting all points */}
                <Polyline positions={routePoints} color="#3b82f6" weight={3} dashArray="5, 10" />

                                {/* Draw All Available Ports */}
                {ports.map(port => {
                    if (!port.lat || !port.lng) return null;
                    return (
                        <Marker 
                            key={port.id} 
                            position={[port.lat, port.lng]}
                            icon={new L.DivIcon({
                                className: 'custom-port-marker',
                                html: `<div style="display: flex; align-items: center; width: 200px;">
                                         <div style="width: 8px; height: 8px; background-color: #cbd5e1; border: 1px solid #fff; border-radius: 50%; box-shadow: 0 0 2px rgba(0,0,0,0.5);"></div>
                                         <span style="margin-left: 6px; font-size: 11px; font-weight: 600; color: #f8fafc; text-shadow: 1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black;">${port.name}</span>
                                       </div>`,
                                iconSize: [200, 10], // width enough for long names
                                iconAnchor: [4, 4]
                            })}
                            zIndexOffset={-1000} // make them appear behind the route markers
                        >
                            <Popup>
                                <strong>Cảng: {port.name}</strong><br/>
                                Mã: {port.code}<br/>
                                Loại: {port.type}
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Draw Port Start & End Markers */}
                {log.portStart?.lat && log.portStart?.lng && (
                    <Marker position={[log.portStart.lat, log.portStart.lng]} icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })}>
                        <Popup>
                            <strong>Cảng xuất: {log.portStart.name}</strong><br/>
                            Tọa độ: {log.portStart.lat}, {log.portStart.lng}<br/>
                            Ngày xuất: {new Date(log.departureDate).toLocaleString('vi-VN')}
                        </Popup>
                    </Marker>
                )}
                {log.portEnd?.lat && log.portEnd?.lng && (
                    <Marker position={[log.portEnd.lat, log.portEnd.lng]} icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })}>
                        <Popup>
                            <strong>Cảng cập: {log.portEnd.name}</strong><br/>
                            Tọa độ: {log.portEnd.lat}, {log.portEnd.lng}<br/>
                            Ngày cập: {log.arrivalDate ? new Date(log.arrivalDate).toLocaleString('vi-VN') : 'Đang cập nhật'}
                        </Popup>
                    </Marker>
                )}

                {/* Draw Markers for each Haul */}
                {sortedHauls.map(haul => {
                    const totalWeight = haul.catchDetails?.reduce((sum, item) => sum + item.weight, 0) || 0;
                    return (
                        <React.Fragment key={haul.haulNumber}>
                            <Marker position={[haul.deployLatitude, haul.deployLongitude]}>
                                <Popup>
                                    <div style={{ padding: '4px' }}>
                                        <strong>Mẻ số {haul.haulNumber} - Bắt đầu thả</strong><br/>
                                        Thời gian: {new Date(haul.deployTime).toLocaleString('vi-VN')}<br/>
                                        Tọa độ: {haul.deployLatitude.toFixed(4)}, {haul.deployLongitude.toFixed(4)}
                                    </div>
                                </Popup>
                            </Marker>
                            <Marker position={[haul.haulLatitude, haul.haulLongitude]}>
                                <Popup>
                                    <div style={{ padding: '4px' }}>
                                        <strong>Mẻ số {haul.haulNumber} - Kết thúc thu</strong><br/>
                                        Thời gian: {new Date(haul.haulTime).toLocaleString('vi-VN')}<br/>
                                        Tọa độ: {haul.haulLatitude.toFixed(4)}, {haul.haulLongitude.toFixed(4)}<br/>
                                        <strong>Tổng sản lượng: {totalWeight} kg</strong>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
}
