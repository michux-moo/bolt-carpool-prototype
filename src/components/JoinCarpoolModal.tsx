import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Carpool, Participant } from '../types';

interface JoinCarpoolModalProps {
  open: boolean;
  onClose: () => void;
  carpool: Carpool | null;
  currentUserEmail: string;
  onJoinCarpool: (carpoolId: string, participant: Omit<Participant, 'id' | 'joinedAt'>) => void;
}

export const JoinCarpoolModal: React.FC<JoinCarpoolModalProps> = ({
  open,
  onClose,
  carpool,
  currentUserEmail,
  onJoinCarpool
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: currentUserEmail,
    phone: '',
    role: '' as 'drive-both' | 'drive-to' | 'drive-from' | 'passenger' | '',
    vehicleInfo: '',
    pickupLocation: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!carpool) return null;

  const availableSpots = carpool.maxCapacity - carpool.participants.length;
  const isAlreadyMember = carpool.participants.some(p => p.email === currentUserEmail);
  const hasDrivers = carpool.participants.some(p => p.role !== 'passenger');

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.role) {
      newErrors.role = 'Please select your role';
    }
    if (formData.role !== 'passenger' && !formData.vehicleInfo.trim()) {
      newErrors.vehicleInfo = 'Vehicle information is required for drivers';
    }
    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onJoinCarpool(carpool.id, formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: currentUserEmail,
      phone: '',
      role: '',
      vehicleInfo: '',
      pickupLocation: ''
    });
    setErrors({});
    onClose();
  };

  const getRoleOptions = () => {
    const options = [];
    
    if (carpool.type === 'round-trip' || carpool.type === 'to-event') {
      options.push({ value: 'drive-to', label: 'Drive To Event Only' });
    }
    if (carpool.type === 'round-trip' || carpool.type === 'from-event') {
      options.push({ value: 'drive-from', label: 'Drive From Event Only' });
    }
    if (carpool.type === 'round-trip') {
      options.push({ value: 'drive-both', label: 'Drive Both Ways' });
    }
    
    options.push({ value: 'passenger', label: 'Passenger Only' });
    
    return options;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Join Carpool</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Carpool Info */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              {carpool.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {carpool.type.replace('-', ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available spots: {availableSpots}/{carpool.maxCapacity}
            </Typography>
          </Box>

          {/* Validation Alerts */}
          {isAlreadyMember && (
            <Alert severity="info">
              You are already a member of this carpool.
            </Alert>
          )}

          {availableSpots === 0 && (
            <Alert severity="warning">
              This carpool is currently full.
            </Alert>
          )}

          {!isAlreadyMember && availableSpots > 0 && (
            <>
              {/* Personal Information */}
              <Typography variant="h6" sx={{ mt: 2 }}>
                Personal Information
              </Typography>
              
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                required
              />
              
              <TextField
                label="Email"
                value={formData.email}
                disabled
                fullWidth
                helperText="This is your registered email"
              />
              
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
                fullWidth
                placeholder="Optional - for coordination"
              />

              <Divider />

              {/* Role Selection */}
              <Typography variant="h6">
                Role Selection
              </Typography>
              
              <FormControl fullWidth error={!!errors.role} required>
                <InputLabel>Your Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={handleChange('role')}
                  label="Your Role"
                >
                  {getRoleOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.value === 'passenger' ? (
                          <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                        ) : (
                          <CarIcon sx={{ mr: 1, fontSize: 20 }} />
                        )}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>

              {/* Driver-specific fields */}
              {formData.role && formData.role !== 'passenger' && (
                <TextField
                  label="Vehicle Information"
                  value={formData.vehicleInfo}
                  onChange={handleChange('vehicleInfo')}
                  error={!!errors.vehicleInfo}
                  helperText={errors.vehicleInfo || 'e.g., 2020 Honda Civic - Blue, License: ABC123'}
                  fullWidth
                  required
                  placeholder="Year Make Model - Color, License plate (optional)"
                />
              )}

              {/* Pickup Location */}
              <TextField
                label="Pickup/Drop-off Location"
                value={formData.pickupLocation}
                onChange={handleChange('pickupLocation')}
                error={!!errors.pickupLocation}
                helperText={errors.pickupLocation || 'Where you need to be picked up or can pick up others'}
                fullWidth
                required
                placeholder="e.g., 123 Main St, Downtown Mall, etc."
              />

              {/* Driver recommendation */}
              {!hasDrivers && (
                <Alert severity="info">
                  <Typography variant="body2">
                    💡 This carpool doesn't have any drivers yet. Consider joining as a driver to help make this carpool happen!
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {!isAlreadyMember && availableSpots > 0 && (
          <Button onClick={handleSubmit} variant="contained">
            Join Carpool
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};