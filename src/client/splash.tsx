import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const LANDSCAPE_BG = new URL(
  './game/assets/3d-island-with-sea-landscape.jpg',
  import.meta.url
).href;

export const Splash = () => {
  return (
    <div
      className="splash"
      style={{ backgroundImage: `url(${LANDSCAPE_BG})` }}
    >
      <div className="splash__shade" aria-hidden="true" />

      <h1 className="splash__title">
        <span className="splash__title-line">Island</span>
        <span className="splash__title-line splash__title-line--accent">Rain</span>
      </h1>

      <div className="splash__bottom">
        <button
          type="button"
          className="splash__play"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Play Today&apos;s Puzzle
        </button>
        <p className="splash__credit">Image by freepik</p>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
