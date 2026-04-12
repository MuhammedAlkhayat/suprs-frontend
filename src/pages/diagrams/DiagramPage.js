import React from 'react';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';
import { downloadTextFile } from '../../utils/downloadFile';

const Pre = styled.pre`
  background: rgba(3,7,18,0.6);
  padding: 16px;
  border-radius: 8px;
  overflow:auto;
  color: #e6eef8;
  font-size: 13px;
  line-height: 1.4;
`;

// props: { title, description, puml, filename }
export default function DiagramPage({ title, description, puml, filename = 'diagram.puml' }) {
  const onDownload = () => downloadTextFile(filename, puml);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: '#00d2ff' }}>{title}</h2>
        <div>
          <Button variant="outline-primary" className="me-2" onClick={onDownload}>Download .puml</Button>
          <Button variant="secondary" onClick={() => window.open('https://plantuml.com/','_blank')}>Open PlantUML</Button>
        </div>
      </div>

      <p style={{ color: '#cbd5e1' }}>{description}</p>

      <h5 style={{ color: '#9fb7ff' }}>PlantUML Source</h5>
      <Pre>{puml}</Pre>

      <p style={{ color: '#9aa7b7', marginTop: 12 }}>
        Tip: To render this diagram as SVG/PDF, paste the above PlantUML source into an online PlantUML server or use the PlantUML CLI (recommended for offline work).
      </p>
    </div>
  );
}