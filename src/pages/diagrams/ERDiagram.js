import React from 'react';
import DiagramPage from './DiagramPage';

const puml = `@startuml
entity "User" as U {
  *user_id : UUID
  --
  email : varchar
  password_hash : varchar
  role : varchar
}
entity "ParkingSlot" as PS {
  *slot_id : UUID
  --
  code : varchar
  status : varchar
  price_per_hour : decimal
}
entity "Booking" as B {
  *booking_id : UUID
  --
  user_id : UUID
  slot_id : UUID
  start_time : timestamp
  duration_hours : int
  status : varchar
}
U ||--o{ B : places
PS ||--o{ B : "slot booked in"
@enduml
`;

export default function ERDiagram() {
  return (
    <DiagramPage
      title="ER Diagram / Database Schema"
      description="ER diagram with primary keys and relationships. Use this as the basis for your SQL schema and migrations."
      puml={puml}
      filename="er_diagram.puml"
    />
  );
}