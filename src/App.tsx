import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Car, UserCheck, AlertTriangle, X } from 'lucide-react';
import { Event, Carpool, Participant } from './types';
import { DriverRemovalModal } from './components/DriverRemovalModal';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showCarpoolForm, setShowCarpoolForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDriverRemovalModal, setShowDriverRemovalModal] = useState(false);
  const [targetParticipant, setTargetParticipant] = useState<Participant | null>(null);
  const [selectedCarpool, setSelectedCarpool] = useState<Carpool | null>(null);

  // Mock current user
  const currentUserEmail = 'user@example.com';

  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    time: '',
    endTime: '',
    endDate: '',
    location: '',
    description: ''
  });

  const [carpoolForm, setCarpoolForm] = useState({
    name: '',
    type: 'round-trip' as 'round-trip' | 'to-event' | 'from-event',
    maxCapacity: 4,
    participantName: '',
    participantEmail: '',
    participantPhone: '',
    participantRole: 'drive-both' as 'drive-both' | 'drive-to' | 'drive-from' | 'passenger',
    vehicleInfo: '',
    pickupLocation: ''
  });

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: eventForm.name,
      date: eventForm.date,
      time: eventForm.time,
      endTime: eventForm.endTime || undefined,
      endDate: eventForm.endDate || undefined,
      location: eventForm.location,
      description: eventForm.description,
      createdBy: currentUserEmail,
      createdAt: new Date().toISOString()
    };

    setEvents([...events, newEvent]);
    setEventForm({
      name: '',
      date: '',
      time: '',
      endTime: '',
      endDate: '',
      location: '',
      description: ''
    });
    setShowEventForm(false);
  };

  const handleStartTimeChange = (startTime: string) => {
    setEventForm({...eventForm, time: startTime});
    
    // Auto-set end time to 1 hour after start time
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
      const endTimeString = endDate.toTimeString().slice(0, 5); // Format as HH:MM
      
      setEventForm(prev => ({...prev, time: startTime, endTime: endTimeString}));
    }
  };

  const handleCarpoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const participant: Participant = {
      id: `participant-${Date.now()}`,
      name: carpoolForm.participantName,
      email: carpoolForm.participantEmail,
      phone: carpoolForm.participantPhone || undefined,
      role: carpoolForm.participantRole,
      vehicleInfo: carpoolForm.vehicleInfo || undefined,
      pickupLocation: carpoolForm.pickupLocation || undefined,
      joinedAt: new Date().toISOString()
    };

    const newCarpool: Carpool = {
      id: `carpool-${Date.now()}`,
      eventId: selectedEventId,
      name: carpoolForm.name,
      type: carpoolForm.type,
      maxCapacity: carpoolForm.maxCapacity,
      participants: [participant],
      createdBy: currentUserEmail,
      createdByParticipant: participant,
      createdAt: new Date().toISOString()
    };

    setCarpools([...carpools, newCarpool]);
    setCarpoolForm({
      name: '',
      type: 'round-trip',
      maxCapacity: 4,
      participantName: '',
      participantEmail: '',
      participantPhone: '',
      participantRole: 'drive-both',
      vehicleInfo: '',
      pickupLocation: ''
    });
    setShowCarpoolForm(false);
    setSelectedEventId('');
  };

  const handleDriverRemoval = (reason: string) => {
    if (!selectedCarpool || !targetParticipant) return;

    const result = DriverRemovalService.executeDriverRemoval(
      selectedCarpool,
      selectedEvent!,
      targetParticipant.id,
      currentUserEmail,
      reason
    );

    if (result.disbanded) {
      setCarpools(carpools.filter(c => c.id !== selectedCarpool.id));
    } else if (result.updatedCarpool) {
      setCarpools(carpools.map(c => 
        c.id === selectedCarpool.id ? result.updatedCarpool! : c
      ));
    }

    console.log('Removal notifications:', result.notifications);
  };

  const formatEventTime = (event: Event) => {
    if (event.endTime) {
      if (event.endDate) {
        return `${event.date} ${event.time} - ${event.endDate} ${event.endTime}`;
      } else {
        return `${event.time} - ${event.endTime}`;
      }
    }
    return event.time;
  };

  const isEndTimeBeforeStart = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return end < start;
  };

  const shouldShowEndDate = isEndTimeBeforeStart(eventForm.time, eventForm.endTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Carpool Coordination
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Organize events and coordinate carpools with ease. Create events, join carpools, and manage transportation together.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <button
              onClick={() => setShowEventForm(true)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </button>
            <button
              onClick={() => setShowCarpoolForm(true)}
              disabled={events.length === 0}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Car className="w-5 h-5 mr-2" />
              Create Carpool
            </button>
          </div>

          {/* Events Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{event.name}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-3 text-green-500" />
                    <span>{formatEventTime(event)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-3 text-red-500" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>

                {/* Carpools for this event */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Car className="w-4 h-4 mr-2" />
                    Carpools ({carpools.filter(c => c.eventId === event.id).length})
                  </h4>
                  
                  {carpools.filter(c => c.eventId === event.id).map((carpool) => (
                    <div key={carpool.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{carpool.name}</h5>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {carpool.participants.length}/{carpool.maxCapacity}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {carpool.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <UserCheck className="w-3 h-3 mr-2 text-green-500" />
                              <span className="font-medium">{participant.name}</span>
                              <span className="ml-2 text-gray-500 capitalize">
                                ({participant.role.replace('-', ' ')})
                              </span>
                            </div>
                            
                            {/* Driver removal button */}
                            {participant.role !== 'passenger' && participant.email !== currentUserEmail && (
                              <button
                                onClick={() => {
                                  setTargetParticipant(participant);
                                  setSelectedCarpool(carpool);
                                  setSelectedEvent(event);
                                  setShowDriverRemovalModal(true);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove driver"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No events yet</h3>
              <p className="text-gray-500">Create your first event to get started with carpool coordination.</p>
            </div>
          )}
        </div>

        {/* Event Creation Modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="flex items-end pb-2">
                      <span className="text-gray-500 font-medium">-</span>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {shouldShowEndDate && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={eventForm.endDate}
                          onChange={(e) => setEventForm({...eventForm, endDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Carpool Creation Modal */}
        {showCarpoolForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Carpool</h2>
                  <button
                    onClick={() => setShowCarpoolForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCarpoolSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Event *
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Choose an event...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name} - {event.date}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carpool Name *
                    </label>
                    <input
                      type="text"
                      value={carpoolForm.name}
                      onChange={(e) => setCarpoolForm({...carpoolForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carpool Type *
                    </label>
                    <select
                      value={carpoolForm.type}
                      onChange={(e) => setCarpoolForm({...carpoolForm, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="round-trip">Round Trip</option>
                      <option value="to-event">To Event Only</option>
                      <option value="from-event">From Event Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity *
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={carpoolForm.maxCapacity}
                      onChange={(e) => setCarpoolForm({...carpoolForm, maxCapacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Your Participation</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={carpoolForm.participantName}
                          onChange={(e) => setCarpoolForm({...carpoolForm, participantName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Email *
                        </label>
                        <input
                          type="email"
                          value={carpoolForm.participantEmail}
                          onChange={(e) => setCarpoolForm({...carpoolForm, participantEmail: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={carpoolForm.participantPhone}
                        onChange={(e) => setCarpoolForm({...carpoolForm, participantPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Role *
                      </label>
                      <select
                        value={carpoolForm.participantRole}
                        onChange={(e) => setCarpoolForm({...carpoolForm, participantRole: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="drive-both">Drive Both Ways</option>
                        <option value="drive-to">Drive To Event Only</option>
                        <option value="drive-from">Drive From Event Only</option>
                        <option value="passenger">Passenger</option>
                      </select>
                    </div>

                    {carpoolForm.participantRole !== 'passenger' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Information
                        </label>
                        <input
                          type="text"
                          value={carpoolForm.vehicleInfo}
                          onChange={(e) => setCarpoolForm({...carpoolForm, vehicleInfo: e.target.value})}
                          placeholder="e.g., Blue Honda Civic, License: ABC123"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={carpoolForm.pickupLocation}
                        onChange={(e) => setCarpoolForm({...carpoolForm, pickupLocation: e.target.value})}
                        placeholder="Where should others meet you?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCarpoolForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Carpool
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Driver Removal Modal */}
        {showDriverRemovalModal && targetParticipant && selectedCarpool && selectedEvent && (
          <DriverRemovalModal
            isOpen={showDriverRemovalModal}
            onClose={() => {
              setShowDriverRemovalModal(false);
              setTargetParticipant(null);
              setSelectedCarpool(null);
              setSelectedEvent(null);
            }}
            carpool={selectedCarpool}
            event={selectedEvent}
            targetParticipant={targetParticipant}
            currentUserEmail={currentUserEmail}
            onConfirmRemoval={handleDriverRemoval}
          />
        )}
      </div>
    </div>
  );
}

export default App;