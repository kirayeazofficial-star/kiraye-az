type IconName="home"|"heart"|"plus"|"account"|"search"|"message"|"history"|"wallet"|"card"|"limits"|"logout";
export default function NavigationIcon({name,filled=false}:{name:IconName;filled?:boolean}) {
 const paths={home:"M4 10.6 12 4l8 6.6V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z",heart:"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",plus:"M12 4v16M4 12h16",account:"M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20c0-3.5 3.4-5.7 7.5-5.7s7.5 2.2 7.5 5.7z",search:"m21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"};
 const more={message:"M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-4.5 3.5V17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z",history:"M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",wallet:"M20 8V5H4a2 2 0 0 0 0 4h16v11H4a2 2 0 0 1-2-2V7m18 5h-5v5h5m-3-2h.01",card:"M3 5h18v14H3ZM3 10h18M7 15h3",limits:"M5 4h14v17H5ZM9 2v4h6V2M8 11h2m3 0h3M8 16h2m3 0h3",logout:"M10 4H4v16h6m5-13 5 5-5 5m-7-5h12"};
 const path=name in more?more[name as keyof typeof more]:paths[name as keyof typeof paths];
 return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={name==='heart'&&filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}
