import React, { useState } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Fab,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  DirectionsCar as CarIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { Event, Carpool, Participant } from './types';
import { CreateEventModal } from './components/CreateEventModal';
import { CreateCarpoolModal } from './components/CreateCarpoolModal';
import { EventDetailsModal } from './components/EventDetailsModal';

function App() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Tech Conference 2025',
      date: '2025-02-15',
      time: '09:00',
      location: 'Convention Center Downtown',
      description: 'Annual technology conference featuring the latest innovations',
      createdBy: 'organizer@example.com',
      createdAt: '2025-01-10T10:00:00Z'
    },
    {
      id: '2',
      name: 'Company Retreat',
      date: '2025-02-20',
      time: '08:30',
      location: 'Mountain Resort',
      description: 'Team building and strategic planning retreat',
      createdBy: 'hr@company.com',
      createdAt: '2025-01-12T14:30:00Z'
    }
  ]);

  const [carpools, setCarpools] = useState<Carpool[]>([
    {
      id: '1',
      eventId: '1',
      name: 'Downtown Carpool',
      type: 'round-trip',
      maxCapacity: 4,
      participants: [
        {
          id: '1',
          name: 'John Driver',
          email: 'john@example.com',
          role: 'drive-both',
          vehicleInfo: '2023 Honda Civic - Blue',
          joinedAt: '2025-01-11T09:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Passenger',
          email: 'jane@example.com',
          role: 'passenger',
          pickupLocation: '123 Main St',
          joinedAt: '2025-01-11T10:00:00Z'
        }
      ],
      createdBy: 'john@example.com',
      createdAt: '2025-01-11T09:00:00Z'
    }
  ]);

  // Modal states
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createCarpoolOpen, setCreateCarpoolOpen] = useState(false);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Event handlers
  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setEvents(prev => [...prev, newEvent]);
    showNotification('Event created successfully!', 'success');
  };

  const handleCreateCarpool = (carpoolData: Omit<Carpool, 'id' | 'createdAt' | 'participants'>) => {
    const newCarpool: Carpool = {
      ...carpoolData,
      id: `carpool-${Date.now()}`,
      participants: [],
      createdAt: new Date().toISOString()
    };
    setCarpools(prev => [...prev, newCarpool]);
    showNotification('Carpool created successfully!', 'success');
  };

  const handleViewEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleJoinCarpool = (eventId: string) => {
    // For now, just open the create carpool modal
    setCreateCarpoolOpen(true);
    showNotification('Join carpool functionality coming soon!', 'info');
  };

  const handleManageCarpool = (carpoolId: string) => {
    showNotification('Carpool management functionality coming soon!', 'info');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <CarIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Carpool Coordination
          </Typography>
          <Button color="inherit" startIcon={<EventIcon />}>
            Events
          </Button>
          <Button color="inherit" startIcon={<GroupIcon />}>
            My Carpools
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Stack spacing={4}>
          {/* Welcome Section */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to Carpool Coordination
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organize and join carpools for your events. Save money, reduce emissions, and travel together.
            </Typography>
          </Box>

          {/* Events Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Upcoming Events
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setCreateEventOpen(true)}
              >
                Create Event
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {events.map((event) => (
                <Grid item xs={12} md={6} key={event.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(`${event.date}T${event.time}`).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        📍 {event.location}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleViewEventDetails(event)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => handleJoinCarpool(event.id)}
                        >
                          Join Carpool
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Carpools Section */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Active Carpools
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => setCreateCarpoolOpen(true)}
              >
                Create Carpool
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {carpools.map((carpool) => {
                const event = events.find(e => e.id === carpool.eventId);
                const driverCount = carpool.participants.filter(p => p.role !== 'passenger').length;
                const passengerCount = carpool.participants.filter(p => p.role === 'passenger').length;
                
                return (
                  <Grid item xs={12} md={6} key={carpool.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {carpool.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          For: {event?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Type: {carpool.type.replace('-', ' ')}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
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
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleViewEventDetails(events.find(e => e.id === carpool.eventId)!)}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleManageCarpool(carpool.id)}
                          >
                            Manage
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Stack>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setCreateEventOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modals */}
      <CreateEventModal
        open={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onCreateEvent={handleCreateEvent}
      />

      <CreateCarpoolModal
        open={createCarpoolOpen}
        onClose={() => setCreateCarpoolOpen(false)}
        onCreateCarpool={handleCreateCarpool}
        events={events}
      />

      <EventDetailsModal
        open={eventDetailsOpen}
        onClose={() => setEventDetailsOpen(false)}
        event={selectedEvent}
        carpools={carpools}
        onJoinCarpool={handleJoinCarpool}
      />

      {/* Notifications */}
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;