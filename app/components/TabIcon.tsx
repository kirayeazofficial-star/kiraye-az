// Bottom menu icons drawn for kirayeal.az on one 24px grid: thin outline when not active,
// solid shape in the brand colour when active (like the big mobile apps do).
type Name = "home" | "heart" | "chat" | "user";
const shapes: Record<Name, { outline: React.ReactNode; solid: React.ReactNode }> = {
  home: {
    outline: <path d="M4 10.6c0-.5.22-.95.6-1.25l6.4-5a1.6 1.6 0 0 1 2 0l6.4 5c.38.3.6.75.6 1.25V19a2 2 0 0 1-2 2h-3.25a.75.75 0 0 1-.75-.75V16.5a2 2 0 0 0-4 0v3.75a.75.75 0 0 1-.75.75H6a2 2 0 0 1-2-2z" />,
    solid: <path d="M3.25 10.6c0-.73.33-1.42.9-1.86l6.4-5a2.35 2.35 0 0 1 2.9 0l6.4 5c.57.44.9 1.13.9 1.86V19A2.75 2.75 0 0 1 18 21.75h-3.25a1.5 1.5 0 0 1-1.5-1.5V16.5a1.25 1.25 0 0 0-2.5 0v3.75a1.5 1.5 0 0 1-1.5 1.5H6A2.75 2.75 0 0 1 3.25 19z" />,
  },
  heart: {
    outline: <path d="M12 20.25c-4.9-3.3-8.5-6.55-8.5-10.6A4.65 4.65 0 0 1 8.15 5c1.6 0 2.95.8 3.85 2.05C12.9 5.8 14.25 5 15.85 5a4.65 4.65 0 0 1 4.65 4.65c0 4.05-3.6 7.3-8.5 10.6z" />,
    solid: <path d="M12 21.2a1 1 0 0 1-.56-.17C6.5 17.7 2.5 14.3 2.5 9.65A5.65 5.65 0 0 1 8.15 4c1.5 0 2.85.55 3.85 1.5A5.6 5.6 0 0 1 15.85 4a5.65 5.65 0 0 1 5.65 5.65c0 4.65-4 8.05-8.94 11.38a1 1 0 0 1-.56.17z" />,
  },
  chat: {
    outline: <path d="M12 4c4.56 0 8.25 3.13 8.25 7.1S16.56 18.2 12 18.2c-.86 0-1.7-.11-2.48-.32l-3.9 1.86a.6.6 0 0 1-.83-.68l.78-3.17C4.47 14.62 3.75 12.93 3.75 11.1 3.75 7.13 7.44 4 12 4z" />,
    solid: <path d="M12 3.25c4.9 0 9 3.4 9 7.85s-4.1 7.85-9 7.85c-.84 0-1.65-.1-2.42-.28l-3.63 1.73a1.35 1.35 0 0 1-1.89-1.53l.68-2.77C3.68 14.6 3 12.9 3 11.1c0-4.45 4.1-7.85 9-7.85z" />,
  },
  user: {
    outline: <><circle cx="12" cy="8" r="3.75" /><path d="M5 19.75c.75-3.45 3.55-5.5 7-5.5s6.25 2.05 7 5.5" /></>,
    solid: <><circle cx="12" cy="8" r="4.5" /><path d="M4.3 19.6c.9-4.15 4.15-6.35 7.7-6.35s6.8 2.2 7.7 6.35a1 1 0 0 1-.98 1.15H5.28a1 1 0 0 1-.98-1.15z" /></>,
  },
};
export default function TabIcon({ name, active = false, size = 24 }: { name: Name; active?: boolean; size?: number }) {
  const shape = shapes[name];
  return active
    ? <svg className="kzTabIcon on" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">{shape.solid}</svg>
    : <svg className="kzTabIcon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor" fillOpacity="0.13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shape.outline}</svg>;
}
