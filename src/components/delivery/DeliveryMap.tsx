import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { Order, Address } from '@/types';
import { getCoordinates, getStoreLocation } from '@/lib/location';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface DeliveryMapProps {
    orders: any[]; // Using any to match the enhanced order type from RouteList
}

const RecenterBtn = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    return (
        <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 z-[999] shadow-md bg-white/90 hover:bg-white"
            onClick={() => map.flyTo(center, 14)}
        >
            Centralizar Loja
        </Button>
    );
};

export const DeliveryMap = ({ orders }: DeliveryMapProps) => {
    const navigate = useNavigate();
    const storeLoc = getStoreLocation();
    const [markers, setMarkers] = useState<{ lat: number, lng: number, order: any }[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            const newMarkers = [];
            for (const order of orders) {
                // Construct full address string
                const addressStr = `${order.address.street}, ${order.address.number}, ${order.address.neighborhood}`;
                const coords = await getCoordinates(addressStr);

                if (coords) {
                    newMarkers.push({
                        lat: coords.lat,
                        lng: coords.lng,
                        order
                    });
                }
            }
            setMarkers(newMarkers);
        };

        fetchLocations();
    }, [orders]);

    return (
        <div className="h-[60vh] w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
            {/* Note: MapContainer needs a fixed height/width to render correctly */}
            <MapContainer
                center={[storeLoc.lat, storeLoc.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Store Marker */}
                <Marker position={[storeLoc.lat, storeLoc.lng]} icon={storeIcon}>
                    <Popup>
                        <strong>Central Cesta Fácil</strong><br />
                        Ponto de partida
                    </Popup>
                </Marker>

                {/* Order Markers */}
                {markers.map((marker, idx) => (
                    <Marker
                        key={`${marker.order.id}-${idx}`}
                        position={[marker.lat, marker.lng]}
                        icon={deliveryIcon}
                    >
                        <Popup className="w-52">
                            <div className="space-y-2">
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    Ped #{marker.order.id.slice(-4)}
                                </Badge>
                                <p className="text-sm font-semibold text-gray-800 leading-tight">
                                    {marker.order.user.name || "Cliente"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {marker.order.address.street}, {marker.order.address.number} <br />
                                    {marker.order.address.neighborhood}
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full text-xs h-7"
                                    onClick={() => navigate(`/delivery/order/${marker.order.id}`)}
                                >
                                    Ver Pedido
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <RecenterBtn center={[storeLoc.lat, storeLoc.lng]} />
            </MapContainer>
        </div>
    );
};
