import React from 'react';
import DiagramPage from './DiagramPage';

const puml = `@startuml
' Example Class Diagram for SUPRS (simplified)
class User {
  +userId: UUID
  +email: String
  +passwordHash: String
  +role: UserRole
  +login()
  +logout()
}
class ParkingSlot {
  +slotId: UUID
  +code: String
  +status: SlotStatus
  +pricePerHour: Decimal
}
class Booking {
  +bookingId: UUID
  +userId: UUID
  +slotId: UUID
  +startTime: DateTime
  +durationHours: Int
  +status: BookingStatus
}
User "1" -- "0..*" Booking : places
ParkingSlot "1" -- "0..*" Booking : "is booked by"
@enduml
`;

export default function ClassDiagram() {
  return (
    <DiagramPage
      title="Class Diagram"
      description="High-level class diagram for the domain model used in SUPRS. Includes User, ParkingSlot, Booking and relationships."
      puml={puml}
      filename="class_diagram.puml"
    />
  );
}