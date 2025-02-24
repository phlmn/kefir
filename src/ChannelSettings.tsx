import React, { useState } from 'react';

export function ChannelSettings() {
  return (
    <div className="container">
      <div className="row">
        <div className="column">
          <label>Post Gain (db)</label>
          <input />
          <label>
            <input type="checkbox" />
            Mute
          </label>
        </div>
        <div className="column">
          <label>Delay (ms)</label>
          <input />
          <label>
            <input type="checkbox" />
            Invert Polarity
          </label>
        </div>
        <div className="column">
          <label>Limiter Threshold (db)</label>
          <input />
          <label>Limiter Decay (db/s)</label>
          <input />
        </div>
        <div className="column">
          <label>Limiter RMS Samples</label>
          <input />
        </div>
      </div>
    </div>
  );
}
