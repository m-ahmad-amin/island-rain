import { navigateTo } from '@devvit/web/client';

type CreditsScreenProps = {
  onClose: () => void;
};

export const CreditsScreen = ({ onClose }: CreditsScreenProps) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1a2744]/92 p-4">
    <div className="w-full max-w-md rounded-2xl bg-[#2a3f5f] border border-[#f5c842]/30 p-6 shadow-xl">
      <h2 className="text-xl font-bold text-[#f5e6c8] font-serif mb-4">
        Credits
      </h2>
      <div className="space-y-4 text-sm text-[#c8dce8]">
        <div>
          <p className="font-semibold text-[#f5e6c8]">3D Island Environment</p>
          <p>
            &quot;Low Poly Island Environment&quot; by{' '}
            <span className="text-[#f5c842]">Umar</span>
          </p>
          <p className="text-xs text-[#8aafc8] mt-1">
            Licensed under{' '}
            <button
              type="button"
              className="underline hover:text-[#f5e6c8]"
              onClick={() =>
                navigateTo(
                  'https://creativecommons.org/licenses/by/4.0/'
                )
              }
            >
              CC BY 4.0
            </button>
          </p>
          <button
            type="button"
            className="text-[#7ec8e3] underline text-xs mt-1 hover:text-[#a8dce8]"
            onClick={() =>
              navigateTo(
                'https://sketchfab.com/3d-models/low-poly-island-environment-38054c51a53e4487840a62baf60c53be'
              )
            }
          >
            View on Sketchfab
          </button>
        </div>
        <div>
          <p className="font-semibold text-[#f5e6c8]">Word Rain</p>
          <p>Built with React, Three.js, and Devvit Web.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full rounded-full bg-[#f5c842] text-[#1a2744] py-2.5 font-bold hover:bg-[#e5b832] transition-colors"
      >
        Back to game
      </button>
    </div>
  </div>
);
