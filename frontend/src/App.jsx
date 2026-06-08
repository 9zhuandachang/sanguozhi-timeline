import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Timeline } from './Timeline';
import { VolumePage } from './VolumePage';
import { GalleryBackground } from './GalleryBackground';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <GalleryBackground />
            <Timeline />
          </>
        } />
        <Route path="/volume/:volumeName" element={<VolumePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
