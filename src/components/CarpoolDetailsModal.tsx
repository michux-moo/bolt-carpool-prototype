import React, { useState } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Carpool, Event, Participant } from '../types';

interface CarpoolDetailsModalProps {
  open: boolean;
  onClose: () => void;
  carpool: Carpool | null;
  event: Event | null;
  currentUserEmail: string;
  onLeaveCarpool: (carpoolId: string, participantId: string) => void;
  onJoinCarpool: (carpool: Carpool) => void;
}

export const CarpoolDetailsModal: React.FC<CarpoolDetailsModalProps> = ({
  open,
  onClose,
  carpool,
  event,
  currentUserEmail,
  onLeaveCarpool,
  onJoinCarpool
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  if (!carpool || !event) return null;

  const currentUser = carpool.participants.find(p => p.email === currentUserEmail);
  const isCurrentUserMember = !!currentUser;
  const availableSpots = carpool.maxCapacity - carpool.participants.length;
  const drivers = carpool.participants.filter(p => p.role !== 'passenger');
  const passengers = carpool.participants.filter(p => p.role === 'passenger');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, participant: Participant) => {
    setMenuAnchor(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedParticipant(null);
  };

  const handleLeave = () => {
    if (currentUser) {
      onLeaveCarpool(carpool.id, currentUser.id);
      handleMenuClose();
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'passenger' ? <PersonIcon /> : <CarIcon />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'drive-both': return 'primary';
      case 'drive-to': return 'secondary';
      case 'drive-from': return 'info';
      case 'passenger': return 'default';
      default: return 'default';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Carpool Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Carpool Information */}
          <Box>
            <Typography variant="h5" gutterBottom>
              {carpool.name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={formatRole(carpool.type)} 
                variant="outlined" 
                color="primary"
              />
              <Chip 
                label={`${carpool.participants.length}/${carpool.maxCapacity} spots`}
                variant="outlined"
                color={availableSpots > 0 ? 'success' : 'error'}
              />
            </Box>
            
            <Typography variant="body1" color="text.secondary" gutterBottom>
              For: {event.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(`${event.date}T${event.time}`).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>

          <Divider />

          {/* Drivers Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ mr: 1 }} />
              Drivers ({drivers.length})
            </Typography>
            
            {drivers.length === 0 ? (
              <Alert severity="warning">
                No drivers assigned yet. This carpool needs at least one driver.
              </Alert>
            ) : (
              <List dense>
                {drivers.map((participant) => (
                  <ListItem 
                    key={participant.id}
                    secondaryAction={
                      participant.email === currentUserEmail && (
                        <IconButton 
                          edge="end" 
                          onClick={(e) => handleMenuOpen(e, participant)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <CarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {participant.name}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={formatRole(participant.role)}
                            color={getRoleColor(participant.role) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {participant.email}
                          </Typography>
                          {participant.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {participant.phone}
                            </Typography>
                          )}
                          {participant.vehicleInfo && (
                            <Typography variant="body2" color="text.secondary">
                              🚗 {participant.vehicleInfo}
                            </Typography>
                          )}
                          {participant.pickupLocation && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {participant.pickupLocation}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Passengers Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Passengers ({passengers.length})
            </Typography>
            
            {passengers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No passengers yet.
              </Typography>
            ) : (
              <List dense>
                {passengers.map((participant) => (
                  <ListItem 
                    key={participant.id}
                    secondaryAction={
                      participant.email === currentUserEmail && (
                        <IconButton 
                          edge="end" 
                          onClick={(e) => handleMenuOpen(e, participant)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.400' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {participant.email}
                          </Typography>
                          {participant.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {participant.phone}
                            </Typography>
                          )}
                          {participant.pickupLocation && (
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {participant.pickupLocation}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!isCurrentUserMember && availableSpots > 0 && (
          <Button 
            onClick={() => onJoinCarpool(carpool)} 
            variant="contained"
          >
            Join Carpool
          </Button>
        )}
      </DialogActions>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLeave} sx={{ color: 'error.main' }}>
          Leave Carpool
        </MenuItem>
      </Menu>
    </Dialog>
  );
};