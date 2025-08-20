import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Event, Carpool } from '../types';

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
  carpools: Carpool[];
  onJoinCarpool: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  open,
  onClose,
  event,
  carpools,
  onJoinCarpool
}) => {
  if (!event) return null;

  const eventCarpools = carpools.filter(carpool => carpool.eventId === event.id);
  const eventDate = new Date(`${event.date}T${event.time}`);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1 }} />
            Event Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Event Information */}
          <Box>
            <Typography variant="h5" gutterBottom>
              {event.name}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">{event.location}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Organized by {event.createdBy}
                </Typography>
              </Box>
            </Box>
            
            {event.description && (
              <Typography variant="body1" color="text.secondary">
                {event.description}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Available Carpools */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Available Carpools ({eventCarpools.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onJoinCarpool(event.id)}
              >
                Create New Carpool
              </Button>
            </Box>
            
            {eventCarpools.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No carpools available yet. Be the first to create one!
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {eventCarpools.map((carpool) => {
                  const driverCount = carpool.participants.filter(p => p.role !== 'passenger').length;
                  const passengerCount = carpool.participants.filter(p => p.role === 'passenger').length;
                  const availableSpots = carpool.maxCapacity - carpool.participants.length;
                  
                  return (
                    <Box
                      key={carpool.id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {carpool.name}
                        </Typography>
                        <Chip
                          label={carpool.type.replace('-', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2">
                          🚗 {driverCount} driver{driverCount !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="body2">
                          👥 {passengerCount} passenger{passengerCount !== 1 ? 's' : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({carpool.participants.length}/{carpool.maxCapacity})
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {availableSpots > 0 ? `${availableSpots} spot${availableSpots !== 1 ? 's' : ''} available` : 'Full'}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={availableSpots === 0}
                        >
                          {availableSpots > 0 ? 'Join' : 'Full'}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};