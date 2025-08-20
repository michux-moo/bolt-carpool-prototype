export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  endTime?: string;
  endDate?: string;
  location: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'drive-both' | 'drive-to' | 'drive-from' | 'passenger';
  vehicleInfo?: string;
  pickupLocation?: string;
  joinedAt: string;
}

export interface Carpool {
  id: string;
  eventId: string;
  name: string;
  type: 'round-trip' | 'to-event' | 'from-event';
  maxCapacity: number;
  participants: Participant[];
  createdBy: string;
  createdByParticipant?: Participant;
  createdAt: string;
}

export interface RemovalRequest {
  id: string;
  carpoolId: string;
  targetParticipantId: string;
  requestedBy: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface RemovalNotification {
  id: string;
  type: 'driver-removed' | 'carpool-disbanded' | 'driver-needed' | 'removal-request';
  carpoolId: string;
  eventId: string;
  message: string;
  timestamp: string;
  read: boolean;
}