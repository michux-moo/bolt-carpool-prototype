import React, { useState, useEffect } from 'react';
import { Calendar, Car, Users, MapPin, Clock, Share2, UserPlus, ArrowRight, Plus, ArrowLeft, Home, UserMinus } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  time: string;
  description: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'driver-both' | 'driver-to' | 'driver-from' | 'passenger';
  phoneNumber?: string;
  vehicleInfo?: string;
  pickupLocation?: string;
}

interface Carpool {
  id: string;
  eventId: string;
  type: 'round-trip' | 'one-way';
  participants: Participant[];
  maxCapacity: number;
  meetupLocation: string;
  departureTime: string;
  returnTime?: string;
  createdBy: string;
  createdByParticipant?: Participant;
}

interface RemovalNotification {
  id: string;
  type: 'driver-removed' | 'carpool-disbanded';
  message: string;
  timestamp: string;
  read: boolean;
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'event-detail' | 'create-event' | 'create-carpool' | 'carpool-detail' | 'join-carpool'>('home');
  const [events, setEvents] = useState<Event[]>([]);
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedCarpool, setSelectedCarpool] = useState<Carpool | null>(null);
  const [joinCarpoolId, setJoinCarpoolId] = useState<string>('');
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [targetParticipant, setTargetParticipant] = useState<Participant | null>(null);
  const [notifications, setNotifications] = useState<RemovalNotification[]>([]);
  const [currentUserEmail] = useState('user@example.com'); // In real app, get from auth

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('carpool-events');
    const savedCarpools = localStorage.getItem('carpool-carpools');
    const savedNotifications = localStorage.getItem('carpool-notifications');
    
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedCarpools) setCarpools(JSON.parse(savedCarpools));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('carpool-events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('carpool-carpools', JSON.stringify(carpools));
  }, [carpools]);

  useEffect(() => {
    localStorage.setItem('carpool-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const createEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
    setSelectedEvent(newEvent);
    setCurrentView('event-detail');
  };

  const createCarpool = (carpoolData: Omit<Carpool, 'id' | 'participants'>) => {
    const newCarpool: Carpool = {
      ...carpoolData,
      id: Date.now().toString(),
      participants: carpoolData.createdByParticipant ? [carpoolData.createdByParticipant] : []
    };
    setCarpools(prev => [...prev, newCarpool]);
    setSelectedCarpool(newCarpool);
    setCurrentView('carpool-detail');
  };

  const joinCarpool = (carpoolId: string, participant: Omit<Participant, 'id'>) => {
    setCarpools(prev => prev.map(carpool => {
      if (carpool.id === carpoolId) {
        const updatedCarpool = {
          ...carpool,
          participants: [...carpool.participants, { ...participant, id: Date.now().toString() }]
        };
        setSelectedCarpool(updatedCarpool);
        return updatedCarpool;
      }
      return carpool;
    }));
  };

  const handleRemoveDriver = (participant: Participant) => {
    setTargetParticipant(participant);
    setShowRemovalModal(true);
  };

  const confirmDriverRemoval = (reason: string) => {
    if (!selectedCarpool || !targetParticipant || !selectedEvent) return;

    try {
      // Remove the participant
      const updatedParticipants = selectedCarpool.participants.filter(p => p.id !== targetParticipant.id);
      
      // Check if carpool should be disbanded
      const remainingDrivers = updatedParticipants.filter(p => p.role !== 'passenger');
      
      if (remainingDrivers.length === 0 && updatedParticipants.length > 0) {
        // Disband carpool - no drivers left
        setCarpools(prev => prev.filter(c => c.id !== selectedCarpool.id));
        
        // Create notifications for all participants
        const disbandNotifications: RemovalNotification[] = updatedParticipants.map(p => ({
          id: `${Date.now()}-${p.id}`,
          type: 'carpool-disbanded',
          message: `Carpool for ${selectedEvent.name} has been disbanded due to driver removal.`,
          timestamp: new Date().toISOString(),
          read: false
        }));
        
        setNotifications(prev => [...prev, ...disbandNotifications]);
        setCurrentView('event-detail');
      } else {
        // Update carpool
        const updatedCarpool = {
          ...selectedCarpool,
          participants: updatedParticipants
        };
        
        setCarpools(prev => prev.map(c => 
          c.id === selectedCarpool.id ? updatedCarpool : c
        ));
        setSelectedCarpool(updatedCarpool);
        
        // Create notification for removed driver
        const removalNotification: RemovalNotification = {
          id: `${Date.now()}-removal`,
          type: 'driver-removed',
          message: `You have been removed from the carpool for ${selectedEvent.name}. Reason: ${reason}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        setNotifications(prev => [...prev, removalNotification]);
      }

      setShowRemovalModal(false);
      setTargetParticipant(null);
    } catch (error) {
      console.error('Error removing driver:', error);
      alert('Failed to remove driver. Please try again.');
    }
  };

  const getShareableLink = (carpoolId: string) => {
    const carpool = carpools.find(c => c.id === carpoolId);
    const event = carpool ? events.find(e => e.id === carpool.eventId) : null;
    
    if (!carpool || !event) return '';
    
    const params = new URLSearchParams({
      join: carpoolId,
      eventName: event.name,
      eventLocation: event.location,
      eventDate: event.date,
      eventTime: event.time,
      eventDescription: event.description,
      carpoolType: carpool.type,
      maxCapacity: carpool.maxCapacity.toString(),
      meetupLocation: carpool.meetupLocation,
      departureTime: carpool.departureTime,
      returnTime: carpool.returnTime || '',
      participantCount: carpool.participants.length.toString()
    });
    
    return `${window.location.origin}?${params.toString()}`;
  };

  // Check for join parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinId = urlParams.get('join');
    if (joinId) {
      setJoinCarpoolId(joinId);
      setCurrentView('join-carpool');
    }
  }, []);

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Car className="w-12 h-12 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-800">CarPool Connect</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Coordinate rides, share journeys, build community. Create events and organize carpools with ease.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Get Started</h2>
          <button
            onClick={() => setCurrentView('create-event')}
            className="w-full bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-center justify-center mb-3">
              <Plus className="w-8 h-8 mr-3" />
              <span className="text-2xl font-semibold">Create Your First Event</span>
            </div>
            <p className="text-blue-100">Start by creating an event that needs transportation</p>
          </button>
        </div>

        {/* Recent Events */}
        {events.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Events</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {events.slice(-4).map(event => {
                const eventCarpools = carpools.filter(c => c.eventId === event.id);
                return (
                  <div 
                    key={event.id} 
                    onClick={() => {
                      setSelectedEvent(event);
                      setCurrentView('event-detail');
                    }}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{event.name}</h3>
                    <div className="space-y-2 text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm">{event.date} at {event.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {eventCarpools.length} carpool{eventCarpools.length !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEventDetail = () => {
    if (!selectedEvent) return null;
    
    const eventCarpools = carpools.filter(c => c.eventId === selectedEvent.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Compact Event Header - 75% space reduction */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <button
                    onClick={() => setCurrentView('home')}
                    className="flex items-center text-gray-600 hover:text-gray-900 flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{selectedEvent.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-blue-500" />
                        <span className="hidden sm:inline">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-blue-500" />
                        <span>{selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center truncate">
                        <MapPin className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{selectedEvent.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => setCurrentView('create-carpool')}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Create</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?event=${selectedEvent.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('Event link copied to clipboard!');
                    }}
                    className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Header */} 
          {/* <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="text-center mb-6">
              <Calendar className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{selectedEvent.name}</h1>
              <p className="text-gray-600">{selectedEvent.description}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-gray-800">Location</span>
                </div>
                <p className="text-gray-700">{selectedEvent.location}</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <Clock className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold text-gray-800">Date & Time</span>
                </div>
                <p className="text-gray-700">{selectedEvent.date} at {selectedEvent.time}</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('create-carpool')}
              className="w-full bg-purple-600 text-white py-4 rounded-2xl hover:bg-purple-700 transition-colors font-semibold text-lg flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Carpool
            </button>
          </div> */}

          {/* Carpools */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8 mt-16px">Carpools for this Event</h2>
            {eventCarpools.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No carpools yet</h3>
                <p className="text-gray-500 mb-6">Create the first carpool for this event</p>
                <button
                  onClick={() => setCurrentView('create-carpool')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Carpool
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {eventCarpools.map(carpool => {
                  const drivers = carpool.participants.filter(p => p.role.includes('driver'));
                  const passengers = carpool.participants.filter(p => p.role === 'passenger');
                  
                  return (
                    <div 
                      key={carpool.id}
                      onClick={() => {
                        setSelectedCarpool(carpool);
                        setCurrentView('carpool-detail');
                      }}
                      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {carpool.type === 'round-trip' ? 'Round Trip' : 'One Way Split'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          carpool.type === 'round-trip' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {carpool.participants.length}/{carpool.maxCapacity} spots
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Meetup: {carpool.meetupLocation}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Departure: {carpool.departureTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {drivers.length > 0 && (
                            <div className="flex items-center text-green-600">
                              <Car className="w-4 h-4 mr-1" />
                              <span className="text-sm">{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {passengers.length > 0 && (
                            <div className="flex items-center text-blue-600">
                              <Users className="w-4 h-4 mr-1" />
                              <span className="text-sm">{passengers.length} passenger{passengers.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCarpoolDetail = () => {
    if (!selectedCarpool) return null;
    
    const event = events.find(e => e.id === selectedCarpool.eventId);
    const drivers = selectedCarpool.participants.filter(p => p.role.includes('driver'));
    const passengers = selectedCarpool.participants.filter(p => p.role === 'passenger');
    const availableSpots = selectedCarpool.maxCapacity - selectedCarpool.participants.length;
    
    const canManageCarpool = currentUserEmail === 'user@example.com' || 
                           selectedCarpool.createdBy === currentUserEmail ||
                           selectedCarpool.participants.some(p => 
                             p.email === currentUserEmail && p.role !== 'passenger'
                           );
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Compact Carpool Header - 75% space reduction */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <button
                    onClick={() => setCurrentView('event-detail')}
                    className="flex items-center text-gray-600 hover:text-gray-900 flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <Car className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                      <h1 className="text-xl font-bold text-gray-900 truncate">{selectedCarpool.name}</h1>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-green-500" />
                        <span>{selectedCarpool.participants.length}/{selectedCarpool.maxCapacity}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                        <span className="capitalize">{selectedCarpool.type.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-purple-500" />
                        <span className="hidden sm:inline">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => setCurrentView('join-carpool')}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Join</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?carpool=${selectedCarpool.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('Carpool link copied to clipboard!');
                    }}
                    className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={() => setCurrentView('event-detail')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </button>

          {/* Carpool Header */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <div className="text-center mb-6">
              <Car className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {selectedCarpool.type === 'round-trip' ? 'Round Trip Carpool' : 'One Way Split Carpool'}
              </h1>
              <p className="text-gray-600">for {event?.name}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-800 mb-1">Meetup Location</div>
                <p className="text-gray-700 text-sm">{selectedCarpool.meetupLocation}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-800 mb-1">Departure Time</div>
                <p className="text-gray-700 text-sm">{selectedCarpool.departureTime}</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-800 mb-1">Available Spots</div>
                <p className="text-gray-700 text-sm">{availableSpots} of {selectedCarpool.maxCapacity}</p>
              </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getShareableLink(selectedCarpool.id));
                alert('Carpool link copied to clipboard!');
              }}
              className="w-full bg-green-600 text-white py-4 rounded-2xl hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Carpool Link
            </button>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Participants</h2>
            
            {selectedCarpool.participants.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No participants yet</h3>
                <p className="text-gray-500">Share the carpool link to get people to join</p>
              </div>
            ) : (
              <div className="space-y-6">
                {drivers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                      <Car className="w-5 h-5 mr-2" />
                      Drivers
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {drivers.map(driver => (
                        <div key={driver.id} className="bg-green-50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{driver.name}</div>
                              <div className="text-sm text-gray-600">{driver.email}</div>
                              <div className="text-sm text-green-700 capitalize">
                                {driver.role.replace('-', ' ')}
                              </div>
                              {driver.phoneNumber && (
                                <div className="text-sm text-gray-600">{driver.phoneNumber}</div>
                              )}
                              {driver.vehicleInfo && (
                                <div className="text-sm text-gray-600">Vehicle: {driver.vehicleInfo}</div>
                              )}
                              {driver.pickupLocation && (
                                <div className="text-sm text-gray-600">Pickup: {driver.pickupLocation}</div>
                              )}
                            </div>
                            
                            {/* Driver removal button */}
                            {canManageCarpool && driver.role !== 'passenger' && (
                              <button
                                onClick={() => handleRemoveDriver(driver)}
                                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove driver"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {passengers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Passengers
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {passengers.map(passenger => (
                        <div key={passenger.id} className="bg-blue-50 rounded-xl p-4">
                          <div className="font-semibold text-gray-800">{passenger.name}</div>
                          <div className="text-sm text-gray-600">{passenger.email}</div>
                          {passenger.phoneNumber && (
                            <div className="text-sm text-gray-600">{passenger.phoneNumber}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateEvent = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create New Event</h2>
            <p className="text-gray-600">Set up an event that needs transportation coordination</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            createEvent({
              name: formData.get('name') as string,
              location: formData.get('location') as string,
              date: formData.get('date') as string,
              time: formData.get('time') as string,
              description: formData.get('description') as string,
            });
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Company Retreat, Concert, Wedding"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Convention Center, 123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Brief description of the event..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Create Event
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderCreateCarpool = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => setCurrentView('event-detail')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </button>

          <div className="text-center mb-8">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Carpool</h2>
            <p className="text-gray-600">Organize transportation for {selectedEvent?.name}</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const driverRole = formData.get('driverRole') as string;
            const creatorName = formData.get('creatorName') as string;
            const creatorEmail = formData.get('creatorEmail') as string;
            const creatorPhone = formData.get('creatorPhone') as string;
            const vehicleInfo = formData.get('vehicleInfo') as string;
            const pickupLocation = formData.get('pickupLocation') as string;
            
            let createdByParticipant: Participant | undefined;
            
            if (driverRole !== 'organizer-only') {
              createdByParticipant = {
                id: Date.now().toString(),
                name: creatorName,
                email: creatorEmail,
                phoneNumber: creatorPhone,
                role: driverRole as 'driver-both' | 'driver-to' | 'driver-from' | 'passenger',
                vehicleInfo: driverRole.includes('driver') ? vehicleInfo : undefined,
                pickupLocation: driverRole.includes('driver') ? pickupLocation : undefined
              };
            }
            
            createCarpool({
              eventId: selectedEvent!.id,
              type: formData.get('type') as 'round-trip' | 'one-way',
              maxCapacity: parseInt(formData.get('maxCapacity') as string),
              meetupLocation: formData.get('meetupLocation') as string,
              departureTime: formData.get('departureTime') as string,
              returnTime: formData.get('returnTime') as string || undefined,
              createdBy: 'current-user',
              createdByParticipant
            });
          }} className="space-y-6">
            {/* Creator Information */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Information</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="creatorName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                  <input
                    type="email"
                    name="creatorEmail"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Phone (Optional)</label>
                <input
                  type="tel"
                  name="creatorPhone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Carpool Type</label>
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="round-trip"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Round Trip</div>
                    <div className="text-sm text-gray-600">One driver takes everyone to and from the event</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="one-way"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">One Way Split</div>
                    <div className="text-sm text-gray-600">Different drivers for to and from the event</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Driver Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Role in this Carpool</label>
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="driverRole"
                    value="driver-both"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">I'll Drive Both Ways</div>
                    <div className="text-sm text-gray-600">I'll drive everyone to and from the event</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="driverRole"
                    value="driver-to"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">I'll Drive TO the Event</div>
                    <div className="text-sm text-gray-600">I'll drive everyone to the event, someone else drives back</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="driverRole"
                    value="driver-from"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">I'll Drive FROM the Event</div>
                    <div className="text-sm text-gray-600">Someone else drives to the event, I'll drive everyone back</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="driverRole"
                    value="passenger"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">I Need a Ride (Passenger)</div>
                    <div className="text-sm text-gray-600">I'm not driving, just organizing the carpool</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="driverRole"
                    value="organizer-only"
                    required
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Just Organizing (Not Participating)</div>
                    <div className="text-sm text-gray-600">I'm setting up the carpool but won't be joining it</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Driver Details - Show only when driver role is selected */}
            <div id="driverDetails" className="hidden">
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Information</label>
                    <input
                      type="text"
                      name="vehicleInfo"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., Blue Honda Civic, License: ABC123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                    <input
                      type="text"
                      name="pickupLocation"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="e.g., Starbucks on Main St, 123 Oak Ave"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                <input
                  type="number"
                  name="maxCapacity"
                  min="2"
                  max="8"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                <input
                  type="time"
                  name="departureTime"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meetup Location</label>
              <input
                type="text"
                name="meetupLocation"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="e.g., Parking lot at 456 Oak St"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Return Time (Optional)</label>
              <input
                type="time"
                name="returnTime"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              Create Carpool
            </button>
          </form>

          <script dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('change', function(e) {
                if (e.target.name === 'driverRole') {
                  const driverDetails = document.getElementById('driverDetails');
                  const isDriver = e.target.value.includes('driver');
                  if (isDriver) {
                    driverDetails.classList.remove('hidden');
                    driverDetails.querySelectorAll('input').forEach(input => input.required = true);
                  } else {
                    driverDetails.classList.add('hidden');
                    driverDetails.querySelectorAll('input').forEach(input => input.required = false);
                  }
                }
              });
            `
          }} />
        </div>
      </div>
    </div>
  );

  const renderJoinCarpool = () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Try to get carpool from local storage first
    let carpool = carpools.find(c => c.id === joinCarpoolId);
    let event = carpool ? events.find(e => e.id === carpool.eventId) : null;
    
    // If not found locally, reconstruct from URL parameters
    if (!carpool || !event) {
      const eventName = urlParams.get('eventName');
      const eventLocation = urlParams.get('eventLocation');
      const eventDate = urlParams.get('eventDate');
      const eventTime = urlParams.get('eventTime');
      const eventDescription = urlParams.get('eventDescription');
      const carpoolType = urlParams.get('carpoolType') as 'round-trip' | 'one-way';
      const maxCapacity = parseInt(urlParams.get('maxCapacity') || '0');
      const meetupLocation = urlParams.get('meetupLocation');
      const departureTime = urlParams.get('departureTime');
      const returnTime = urlParams.get('returnTime');
      const participantCount = parseInt(urlParams.get('participantCount') || '0');
      
      if (eventName && eventLocation && eventDate && eventTime && carpoolType && maxCapacity && meetupLocation && departureTime) {
        event = {
          id: 'shared-event',
          name: eventName,
          location: eventLocation,
          date: eventDate,
          time: eventTime,
          description: eventDescription || ''
        };
        
        carpool = {
          id: joinCarpoolId,
          eventId: 'shared-event',
          type: carpoolType,
          maxCapacity: maxCapacity,
          meetupLocation: meetupLocation,
          departureTime: departureTime,
          returnTime: returnTime || undefined,
          participants: [],
          createdBy: 'shared'
        };
      }
    }

    if (!carpool || !event) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <Car className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Carpool Not Found</h2>
            <p className="text-gray-600 mb-6">The carpool link you're trying to access is invalid or missing required information.</p>
            <button
              onClick={() => setCurrentView('home')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    const participantCount = urlParams.get('participantCount') ? parseInt(urlParams.get('participantCount') || '0') : carpool.participants.length;
    const availableSpots = carpool.maxCapacity - participantCount;
    
    // Determine available roles based on existing participants
    const existingDrivers = carpool.participants.filter(p => p.role.includes('driver'));
    const hasDriverTo = existingDrivers.some(p => p.role === 'driver-to' || p.role === 'driver-both');
    const hasDriverFrom = existingDrivers.some(p => p.role === 'driver-from' || p.role === 'driver-both');

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <UserPlus className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Carpool</h2>
              <p className="text-gray-600">You've been invited to join a carpool for {event.name}</p>
            </div>

            {/* Event Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{event.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{event.date} at {event.time}</span>
                </div>
              </div>
            </div>

            {/* Carpool Details */}
            <div className="bg-purple-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Carpool Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Car className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Type: {carpool.type === 'round-trip' ? 'Round Trip' : 'One Way Split'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Meetup: {carpool.meetupLocation}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Departure: {carpool.departureTime}</span>
                </div>
                {carpool.returnTime && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Return: {carpool.returnTime}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Available spots: {availableSpots}/{carpool.maxCapacity} (Current participants: {participantCount})</span>
                </div>
              </div>
            </div>

            {availableSpots === 0 ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Carpool Full</h3>
                <p className="text-gray-600">This carpool has reached its maximum capacity.</p>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                joinCarpool(joinCarpoolId, {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  phoneNumber: formData.get('phoneNumber') as string,
                  role: formData.get('role') as 'driver-both' | 'driver-to' | 'driver-from' | 'passenger',
                  vehicleInfo: formData.get('vehicleInfo') as string,
                  pickupLocation: formData.get('pickupLocation') as string
                });
                
                alert(`Successfully joined the carpool! 
                
Note: This is a demo app, so your information is only stored locally. In a real app, the carpool organizer would be notified and you'd receive confirmation details.
                
For now, please contact the carpool organizer directly to confirm your participation.`);
                setCurrentView('carpool-detail');
              }} className="space-y-6">

                <script dangerouslySetInnerHTML={{
                  __html: `
                    document.addEventListener('change', function(e) {
                      if (e.target.name === 'role') {
                        const driverDetails = document.getElementById('joinDriverDetails');
                        const isDriver = e.target.value.includes('driver');
                        if (isDriver) {
                          driverDetails.classList.remove('hidden');
                          driverDetails.querySelectorAll('input').forEach(input => input.required = true);
                        } else {
                          driverDetails.classList.add('hidden');
                          driverDetails.querySelectorAll('input').forEach(input => input.required = false);
                        }
                      }
                    });
                  `
                }} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How would you like to participate?</label>
                  <div className="space-y-3">
                    {carpool.type === 'round-trip' && (
                      <label className={`flex items-start p-4 border border-gray-300 rounded-lg transition-colors ${
                        hasDriverTo && hasDriverFrom 
                          ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="driver-both"
                          required
                          disabled={hasDriverTo && hasDriverFrom}
                          className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-medium text-gray-800">
                            Drive Both Ways
                            {hasDriverTo && hasDriverFrom && <span className="text-red-600 ml-2">(Already filled)</span>}
                          </div>
                          <div className="text-sm text-gray-600">I'll drive everyone to and from the event</div>
                        </div>
                      </label>
                    )}
                    
                    {carpool.type === 'one-way' && (
                      <>
                        <label className={`flex items-start p-4 border border-gray-300 rounded-lg transition-colors ${
                          hasDriverTo 
                            ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}>
                          <input
                            type="radio"
                            name="role"
                            value="driver-to"
                            required
                            disabled={hasDriverTo}
                            className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="font-medium text-gray-800">
                              Drive To Event
                              {hasDriverTo && <span className="text-red-600 ml-2">(Already filled)</span>}
                            </div>
                            <div className="text-sm text-gray-600">I'll drive everyone to the event</div>
                          </div>
                        </label>
                        <label className={`flex items-start p-4 border border-gray-300 rounded-lg transition-colors ${
                          hasDriverFrom 
                            ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}>
                          <input
                            type="radio"
                            name="role"
                            value="driver-from"
                            required
                            disabled={hasDriverFrom}
                            className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="font-medium text-gray-800">
                              Drive From Event
                              {hasDriverFrom && <span className="text-red-600 ml-2">(Already filled)</span>}
                            </div>
                            <div className="text-sm text-gray-600">I'll pick everyone up after the event</div>
                          </div>
                        </label>
                      </>
                    )}
                    
                    <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="role"
                        value="passenger"
                        required
                        className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-gray-800">Passenger</div>
                        <div className="text-sm text-gray-600">I need a ride (not driving)</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Driver Details - Show only when driver role is selected */}
                <div id="joinDriverDetails" className="hidden">
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Information</label>
                        <input
                          type="text"
                          name="vehicleInfo"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder="e.g., Blue Honda Civic, License: ABC123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                        <input
                          type="text"
                          name="pickupLocation"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                          placeholder="e.g., Starbucks on Main St, 123 Oak Ave"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
                >
                  Join Carpool
                </button>
              </form>
            )}

            <button
              onClick={() => setCurrentView('home')}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DriverRemovalModal = ({ isOpen, onClose, carpool, event, targetParticipant, currentUserEmail, onConfirmRemoval }: {
    isOpen: boolean;
    onClose: () => void;
    carpool: Carpool;
    event: Event;
    targetParticipant: Participant;
    currentUserEmail: string;
    onConfirmRemoval: (reason: string) => void;
  }) => {
    const [reason, setReason] = useState('');
    
    if (!isOpen) return null;

    const remainingDrivers = carpool.participants.filter(p => p.role !== 'passenger' && p.id !== targetParticipant.id);
    const willDisband = remainingDrivers.length === 0 && carpool.participants.length > 1;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Remove Driver</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to remove <strong>{targetParticipant.name}</strong> from this carpool?
          </p>
          
          {willDisband && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> Removing this driver will disband the entire carpool since no other drivers will remain.
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for removal</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Please provide a reason..."
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirmRemoval(reason)}
              disabled={!reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Remove Driver
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Notification banner
  const unreadNotifications = notifications.filter(n => !n.read);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Banner */}
      {unreadNotifications.length > 0 && (
        <div className="bg-blue-600 text-white px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm">
              You have {unreadNotifications.length} new notification{unreadNotifications.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              className="text-sm underline hover:no-underline"
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}

      {currentView === 'home' && renderHome()}
      {currentView === 'create-event' && renderCreateEvent()}
      {currentView === 'event-detail' && renderEventDetail()}
      {currentView === 'create-carpool' && renderCreateCarpool()}
      {currentView === 'carpool-detail' && renderCarpoolDetail()}
      {currentView === 'join-carpool' && renderJoinCarpool()}

      {/* Driver Removal Modal */}
      {showRemovalModal && targetParticipant && selectedCarpool && selectedEvent && (
        <DriverRemovalModal
          isOpen={showRemovalModal}
          onClose={() => {
            setShowRemovalModal(false);
            setTargetParticipant(null);
          }}
          carpool={selectedCarpool}
          event={selectedEvent}
          targetParticipant={targetParticipant}
          currentUserEmail={currentUserEmail}
          onConfirmRemoval={confirmDriverRemoval}
        />
      )}
    </div>
  );
}

export default App;