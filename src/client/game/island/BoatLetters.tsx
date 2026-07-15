import { Billboard } from '@react-three/drei';
import { useGame } from './GameContext';
import { LetterSprite } from './LetterSprite';

const SLOT_SPACING = 0.55;

export const BoatLetterAnchor = () => {
  const { assemblySlots, answerWord, islandReady, phase } = useGame();

  if (!islandReady) return null;

  const totalWidth = (answerWord.length - 1) * SLOT_SPACING;
  const showOnBoat = phase === 'won';

  return (
    <>
      {assemblySlots.map((slot, i) => {
        if (!slot || !showOnBoat) return null;
        const offsetX = i * SLOT_SPACING - totalWidth / 2;
        return (
          <Billboard
            key={`placed-${i}-${slot.letter}`}
            position={[offsetX, 0.55, 0]}
            follow
          >
            <LetterSprite letter={slot.letter} variant="boat" scale={0.5} />
          </Billboard>
        );
      })}
    </>
  );
};
