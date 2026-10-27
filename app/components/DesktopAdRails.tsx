import {siteContact} from '../../lib/site-contact';

export default function DesktopAdRails(){
 const href=`mailto:${siteContact.email}?subject=${encodeURIComponent('kirayeal.az — reklam yerləşdirmək')}`;
 return <aside className="desktopAdRails" aria-label="Reklam sahələri">
  <a className="desktopAdRail desktopAdRailLeft" href={href}><small>REKLAM</small><strong>Brendiniz kirayə axtaranların qarşısında olsun</strong><span>Reklam yerləşdir →</span></a>
  <a className="desktopAdRail desktopAdRailRight" href={href}><small>REKLAM</small><strong>Biznesinizi doğru auditoriyaya göstərin</strong><span>Əlaqə saxla →</span></a>
 </aside>;
}
