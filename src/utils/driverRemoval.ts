import { Carpool, Participant, Event, RemovalRequest, RemovalNotification } from '../types';

export interface RemovalAuthority {
  canRemove: boolean;
  reason?: string;
  requiresConfirmation: boolean;
  restrictions?: string[];
}

export class DriverRemovalService {
  /**
   * Check if a user has authority to remove a specific driver
   */
  static checkRemovalAuthority(
    userEmail: string,
    carpool: Carpool,
    event: Event,
    targetParticipant: Participant
  ): RemovalAuthority {
    const isEventCreator = event.createdBy === userEmail;
    const isCarpoolCreator = carpool.createdBy === userEmail;
    const isCurrentDriver = carpool.participants.some(
      p => p.email === userEmail && (p.role === 'drive-both' || p.role === 'drive-to' || p.role === 'drive-from')
    );
    const isTargetDriver = targetParticipant.role !== 'passenger';

    // Base authorization check
    if (!isEventCreator && !isCarpoolCreator && !isCurrentDriver) {
      return {
        canRemove: false,
        reason: 'You do not have permission to remove participants from this carpool',
        requiresConfirmation: false
      };
    }

    // Can't remove non-drivers
    if (!isTargetDriver) {
      return {
        canRemove: false,
        reason: 'Only drivers can be removed using this feature',
        requiresConfirmation: false
      };
    }

    // Can't remove yourself if you're the only driver
    const drivers = carpool.participants.filter(p => p.role !== 'passenger');
    if (targetParticipant.email === userEmail && drivers.length === 1) {
      return {
        canRemove: false,
        reason: 'You cannot remove yourself as the only driver. Transfer driving responsibility first or disband the carpool.',
        requiresConfirmation: false
      };
    }

    // Event creator has full authority
    if (isEventCreator) {
      return {
        canRemove: true,
        requiresConfirmation: true,
        restrictions: this.getTimeBasedRestrictions(event)
      };
    }

    // Carpool creator authority
    if (isCarpoolCreator) {
      // Can remove any driver except themselves if they're the only driver
      return {
        canRemove: true,
        requiresConfirmation: true,
        restrictions: this.getTimeBasedRestrictions(event)
      };
    }

    // Current driver authority (limited)
    if (isCurrentDriver) {
      // Can only remove themselves or request removal of others
      if (targetParticipant.email === userEmail) {
        return {
          canRemove: true,
          requiresConfirmation: true,
          restrictions: [
            ...this.getTimeBasedRestrictions(event),
            'As a driver, you can remove yourself but this may affect other passengers'
          ]
        };
      } else {
        return {
          canRemove: false,
          reason: 'Drivers can only remove themselves. Contact the carpool or event organizer to remove other drivers.',
          requiresConfirmation: false
        };
      }
    }

    return {
      canRemove: false,
      reason: 'Unknown authorization error',
      requiresConfirmation: false
    };
  }

  /**
   * Get time-based restrictions for driver removal
   */
  private static getTimeBasedRestrictions(event: Event): string[] {
    const eventDate = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const restrictions: string[] = [];

    if (hoursUntilEvent < 24) {
      restrictions.push('Event is within 24 hours - removal may significantly impact other participants');
    }

    if (hoursUntilEvent < 2) {
      restrictions.push('Event is within 2 hours - emergency removal only');
    }

    return restrictions;
  }

  /**
   * Execute driver removal with all necessary side effects
   */
  static executeDriverRemoval(
    carpool: Carpool,
    event: Event,
    targetParticipantId: string,
    removedBy: string,
    reason: string
  ): {
    updatedCarpool: Carpool | null;
    notifications: RemovalNotification[];
    disbanded: boolean;
  } {
    const targetParticipant = carpool.participants.find(p => p.id === targetParticipantId);
    if (!targetParticipant) {
      throw new Error('Target participant not found');
    }

    const remainingParticipants = carpool.participants.filter(p => p.id !== targetParticipantId);
    const remainingDrivers = remainingParticipants.filter(p => p.role !== 'passenger');
    const affectedPassengers = remainingParticipants.filter(p => p.role === 'passenger');

    const notifications: RemovalNotification[] = [];

    // Check if carpool should be disbanded
    const shouldDisband = remainingDrivers.length === 0 || remainingParticipants.length === 0;

    if (shouldDisband) {
      // Notify all remaining participants about disbandment
      remainingParticipants.forEach(participant => {
        notifications.push({
          id: `notif-${Date.now()}-${participant.id}`,
          type: 'carpool-disbanded',
          carpoolId: carpool.id,
          eventId: event.id,
          message: `The carpool "${carpool.name}" for ${event.name} has been disbanded because the driver was removed. Reason: ${reason}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      });

      return {
        updatedCarpool: null,
        notifications,
        disbanded: true
      };
    }

    // Update carpool with remaining participants
    const updatedCarpool: Carpool = {
      ...carpool,
      participants: remainingParticipants
    };

    // Notify removed driver
    notifications.push({
      id: `notif-${Date.now()}-removed`,
      type: 'driver-removed',
      carpoolId: carpool.id,
      eventId: event.id,
      message: `You have been removed as a driver from the carpool "${carpool.name}" for ${event.name}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
      read: false
    });

    // Notify remaining participants about driver change
    remainingParticipants.forEach(participant => {
      if (participant.email !== removedBy) {
        notifications.push({
          id: `notif-${Date.now()}-${participant.id}`,
          type: 'driver-removed',
          carpoolId: carpool.id,
          eventId: event.id,
          message: `Driver ${targetParticipant.name} has been removed from your carpool "${carpool.name}" for ${event.name}. ${remainingDrivers.length > 0 ? 'Other drivers are still available.' : 'A new driver is needed.'}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    });

    // If no drivers remain but passengers do, send urgent notification
    if (remainingDrivers.length === 0 && affectedPassengers.length > 0) {
      affectedPassengers.forEach(passenger => {
        notifications.push({
          id: `notif-${Date.now()}-urgent-${passenger.id}`,
          type: 'driver-needed',
          carpoolId: carpool.id,
          eventId: event.id,
          message: `URGENT: Your carpool "${carpool.name}" needs a new driver. Consider becoming a driver or finding alternative transportation.`,
          timestamp: new Date().toISOString(),
          read: false
        });
      });
    }

    return {
      updatedCarpool,
      notifications,
      disbanded: false
    };
  }

  /**
   * Create a removal request for cases requiring approval
   */
  static createRemovalRequest(
    carpoolId: string,
    targetParticipantId: string,
    requestedBy: string,
    reason: string
  ): RemovalRequest {
    return {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      carpoolId,
      targetParticipantId,
      requestedBy,
      reason,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
  }
}