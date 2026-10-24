import { siteContact } from '../../lib/site-contact';

export default function AdSpaces() {
  return (
    <aside className="adSpaces" aria-label="Reklam üçün sahələr">
      {['left', 'right'].map(side => (
        <a
          className={`adSpace adSpace-${side}`}
          key={side}
          href={`mailto:${siteContact.email}?subject=${encodeURIComponent('kirayeal.az — reklam yerləşdirmək')}`}
        >
          <small>REKLAM</small>
          <strong>Biznesiniz burada görünsün.</strong>
          <p className="adSpaceDescription">Təkliflərinizi kirayə axtaranlara tanıdın.</p>
          <span className="adSpaceCta">Bizimlə əlaqə</span>
        </a>
      ))}
    </aside>
  );
}
