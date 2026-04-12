import React from 'react';
import DiagramPage from './DiagramPage';

const puml = `@startuml
start
:Search slots;
if (slot available?) then (yes)
  :Select slot;
  :Select duration;
  :Confirm reservation;
  :Proceed to payment;
  if (payment successful?) then (yes)
    :Show confirmation;
    stop
  else (no)
    :Prompt retry / cancel;
    stop
  endif
else (no)
  :Show alternative suggestions;
  stop
endif
@enduml
`;

export default function ActivityDiagram() {
  return (
    <DiagramPage
      title="Activity Diagram — Reserve Parking"
      description="Activity flow for the 'Reserve Parking Slot' scenario including payment success/failure branching."
      puml={puml}
      filename="activity_diagram.puml"
    />
  );
}