import React, { useState } from 'react';
import { X, AlertTriangle, Users, Clock } from 'lucide-react';
import { Carpool, Event, Participant } from '../types';
import { DriverRemovalService } from '../utils/driverRemoval';

interface DriverRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  carpool: Carpool;
  event: Event;
  targetParticipant: Participant;
  currentUserEmail: string;
  onConfirmRemoval: (reason: string) => void;
}

export const DriverRemovalModal: React.FC<DriverRemovalModalProps> = ({
  isOpen,
  onClose,
  carpool,
  event,
  targetParticipant,
  currentUserEmail,
  onConfirmRemoval
}) => {
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const authority = DriverRemovalService.checkRemovalAuthority(
    currentUserEmail,
    carpool,
    event,
    targetParticipant
  );

  const eventDate = new Date(`${event.date}T${event.time}`);
  const now = new Date();
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const remainingDrivers = carpool.participants.filter(
    p => p.id !== targetParticipant.id && p.role !== 'passenger'
  );
  const affectedPassengers = carpool.participants.filter(p => p.role === 'passenger');

  const handleRemoval = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the removal');
      return;
    }
    onConfirmRemoval(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Remove Driver
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!authority.canRemove ? (
            <div className="text-center py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">{authority.reason}</p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>You are about to remove:</strong>
                  </p>
                  <p className="font-medium">{targetParticipant.name}</p>
                  <p className="text-sm text-gray-600">{targetParticipant.email}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    Role: {targetParticipant.role.replace('-', ' ')}
                  </p>
                </div>

                {/* Impact Assessment */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Impact Assessment
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Remaining drivers: {remainingDrivers.length}</li>
                    <li>• Affected passengers: {affectedPassengers.length}</li>
                    {remainingDrivers.length === 0 && (
                      <li className="text-red-600 font-medium">
                        • ⚠️ No drivers will remain - carpool will be disbanded
                      </li>
                    )}
                  </ul>
                </div>

                {/* Time-based warnings */}
                {hoursUntilEvent < 24 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-red-900 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Time Sensitivity Warning
                    </h3>
                    <p className="text-sm text-red-800">
                      {hoursUntilEvent < 2
                        ? 'Event starts in less than 2 hours - this is an emergency removal'
                        : 'Event starts in less than 24 hours - participants may have limited time to find alternatives'}
                    </p>
                  </div>
                )}

                {/* Restrictions */}
                {authority.restrictions && authority.restrictions.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Restrictions:</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {authority.restrictions.map((restriction, index) => (
                        <li key={index}>• {restriction}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reason input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for removal *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Please provide a clear reason for removing this driver..."
                    required
                  />
                </div>

                {/* Confirmation checkbox for high-impact removals */}
                {(remainingDrivers.length === 0 || hoursUntilEvent < 24) && (
                  <div className="mb-4">
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={showConfirmation}
                        onChange={(e) => setShowConfirmation(e.target.checked)}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I understand the impact of this removal and confirm that it is necessary.
                        {remainingDrivers.length === 0 && ' This will disband the entire carpool.'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoval}
                  disabled={
                    !reason.trim() ||
                    ((remainingDrivers.length === 0 || hoursUntilEvent < 24) && !showConfirmation)
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Remove Driver
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};