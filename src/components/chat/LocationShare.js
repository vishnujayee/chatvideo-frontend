import { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationShare = ({ onShare, onClose }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shared, setShared] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    setShared(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        setError('Could not get your location');
        setLoading(false);
      }
    );
  };

  const handleShare = () => {
    if (location) {
      onShare(location);
      setShared(true);
      setTimeout(() => {
        setShared(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Location</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {shared && <Alert severity="success">Location shared!</Alert>}
        {loading && <CircularProgress />}
        {location && (
          <MapContainer
            center={[location.latitude, location.longitude]}
            zoom={13}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[location.latitude, location.longitude]}>
              <Popup>Your location</Popup>
            </Marker>
          </MapContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={getCurrentLocation} 
          disabled={loading}
        >
          Get Location
        </Button>
        <Button 
          onClick={handleShare} 
          disabled={!location || loading || shared} 
          color="primary"
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationShare; 