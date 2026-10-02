import type { Era } from '../config/content'
import { pad } from '../utils/math'

/**
 * An album cover that turns into its own back sleeve under the cursor: the
 * cover dims to the era's colour and the tracklist prints itself over it.
 */
export function Sleeve({ era, index }: { era: Era; index: number }) {
  const many = era.tracks.length > 7
  return (
    <span className="sleeve" style={{ ['--era-bg' as string]: era.bg, ['--era-fg' as string]: era.fg }}>
      <img src={era.cover} alt={`${era.title} cover`} loading="lazy" />
      <span className="sleeve__back" aria-hidden="true">
        <span className="sleeve__head">
          <span className="sleeve__meta">
            {pad(index + 1)} — {era.year}
          </span>
          <span className={`sleeve__title ${era.id === 'money' ? 'sleeve__title--serif' : ''}`}>{era.title}</span>
        </span>
        {era.tracks.length > 0 ? (
          <span className={`sleeve__tracks ${many ? 'sleeve__tracks--two' : ''}`}>
            {era.tracks.map((t, i) => (
              <span className="sleeve__track" key={t} style={{ ['--i' as string]: i }}>
                <span className="sleeve__no">{pad(i + 1)}</span> {t}
              </span>
            ))}
          </span>
        ) : (
          <span className="sleeve__tracks">
            <span className="sleeve__track">Out {era.released}.</span>
            <span className="sleeve__track" style={{ ['--i' as string]: 1 }}>
              The full tracklist lives on streaming.
            </span>
          </span>
        )}
      </span>
    </span>
  )
}
