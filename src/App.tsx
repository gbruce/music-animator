import React from 'react';
import TimelineContainer from './components/TimelineContainer';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Beat Timeline</h1>
      </header>
      <main>
        <TimelineContainer />
      </main>
    </div>
  );
}

export default App; 