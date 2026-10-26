type IconName="home"|"heart"|"plus"|"account"|"search"|"message"|"history"|"wallet"|"card"|"limits"|"logout";
export default function NavigationIcon({name,filled=false}:{name:IconName;filled?:boolean}) {
 const paths={home:"M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9",heart:"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",plus:"M12 4v16M4 12h16",account:"M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",search:"m21 21-4.5-4.5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z"};
 const more={message:"M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-9.5A8.5 8.5 0 0 1 10.5 4H13a8 8 0 0 1 8 7.5ZM7 10h10M7 14h7",history:"M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",wallet:"M20 8V5H4a2 2 0 0 0 0 4h16v11H4a2 2 0 0 1-2-2V7m18 5h-5v5h5m-3-2h.01",card:"M3 5h18v14H3ZM3 10h18M7 15h3",limits:"M5 4h14v17H5ZM9 2v4h6V2M8 11h2m3 0h3M8 16h2m3 0h3",logout:"M10 4H4v16h6m5-13 5 5-5 5m-7-5h12"};
 const path=name in more?more[name as keyof typeof more]:paths[name as keyof typeof paths];
 return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={name==='heart'&&filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}
