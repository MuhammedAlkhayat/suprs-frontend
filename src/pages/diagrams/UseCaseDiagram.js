import React from 'react';
import DiagramPage from './DiagramPage';

const puml = `@startuml
left to right direction
actor User
actor Admin
rectangle "Smart Parking System" {
  User -- (Search for Parking)
  User -- (Reserve Parking Slot)
  User -- (Pay for Reservation)
  User -- (Cancel Reservation)
  Admin -- (Manage Parking Slots)
  Admin -- (View Reports)
  (Reserve Parking Slot) .> (Pay for Reservation) : includes
  (Reserve Parking Slot) --> (Cancel Reservation)
}
@enduml
`;

export default function UseCaseDiagram() {
  return (
    <DiagramPage
      title="Use Case Diagram — Reserve Parking Scenario"
      description="This diagram shows the main actors and use cases for SUPRS. The 'Reserve Parking Slot' use case includes payment and links to cancellation flow."
      puml={puml}
      filename="usecase_diagram.puml"
    />
  );
}