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
  FormHelperText
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Carpool, Event } from '../types';

interface CreateCarpoolModalProps {
  open: boolean;
  onClose: () => void;
  onCreateCarpool: (carpool: Omit<Carpool, 'id' | 'createdAt' | 'participants'>) => void;
  events: Event[];
}

export const CreateCarpoolModal: React.FC<CreateCarpoolModalProps> = ({
  open,
  onClose,
  onCreateCarpool,
  events
}) => {
  const [formData, setFormData] = useState({
    eventId: '',
    name: '',
    type: '' as 'round-trip' | 'to-event' | 'from-event' | '',
    maxCapacity: 4,
    createdBy: 'user@example.com' // In a real app, this would come from auth
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.eventId) {
      newErrors.eventId = 'Please select an event';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Carpool name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Please select a carpool type';
    }
    if (formData.maxCapacity < 2) {
      newErrors.maxCapacity = 'Capacity must be at least 2';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateCarpool(formData as Omit<Carpool, 'id' | 'createdAt' | 'participants'>);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      eventId: '',
      name: '',
      type: '',
      maxCapacity: 4,
      createdBy: 'user@example.com'
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create New Carpool</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth error={!!errors.eventId} required>
            <InputLabel>Select Event</InputLabel>
            <Select
              value={formData.eventId}
              onChange={handleChange('eventId')}
              label="Select Event"
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name} - {new Date(`${event.date}T${event.time}`).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
            {errors.eventId && <FormHelperText>{errors.eventId}</FormHelperText>}
          </FormControl>
          
          <TextField
            label="Carpool Name"
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            placeholder="e.g., Downtown Pickup Group"
          />
          
          <FormControl fullWidth error={!!errors.type} required>
            <InputLabel>Carpool Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Carpool Type"
            >
              <MenuItem value="round-trip">Round Trip</MenuItem>
              <MenuItem value="to-event">To Event Only</MenuItem>
              <MenuItem value="from-event">From Event Only</MenuItem>
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>
          
          <TextField
            label="Maximum Capacity"
            type="number"
            value={formData.maxCapacity}
            onChange={handleChange('maxCapacity')}
            error={!!errors.maxCapacity}
            helperText={errors.maxCapacity || 'Including driver(s)'}
            fullWidth
            required
            inputProps={{ min: 2, max: 8 }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Carpool
        </Button>
      </DialogActions>
    </Dialog>
  );
};