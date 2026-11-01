// Bottom menu icons drawn for kirayeal.az on one 24px grid: thin outline when not active,
// solid shape in the brand colour when active (like the big mobile apps do).
type Name = "home" | "heart" | "chat" | "user";
const shapes: Record<Name, { outline: React.ReactNode; solid: React.ReactNode }> = {
  home: {
    outline: <path d="M3.75 10.4 12 3.9l8.25 6.5v8.85A1.75 1.75 0 0 1 18.5 21h-3.75v-5.25a.75.75 0 0 0-.75-.75h-4a.75.75 0 0 0-.75.75V21H5.5a1.75 1.75 0 0 1-1.75-1.75z" />,
    solid: <path d="M11.38 3.1a1 1 0 0 1 1.24 0l8.25 6.5a1 1 0 0 1 .38.79v8.86A2.75 2.75 0 0 1 18.5 22h-3.75a1 1 0 0 1-1-1v-5h-3.5v5a1 1 0 0 1-1 1H5.5a2.75 2.75 0 0 1-2.75-2.75v-8.86a1 1 0 0 1 .38-.79z" />,
  },
  heart: {
    outline: <path d="M12 20.25c-4.9-3.3-8.5-6.55-8.5-10.6A4.65 4.65 0 0 1 8.15 5c1.6 0 2.95.8 3.85 2.05C12.9 5.8 14.25 5 15.85 5a4.65 4.65 0 0 1 4.65 4.65c0 4.05-3.6 7.3-8.5 10.6z" />,
    solid: <path d="M12 21.2a1 1 0 0 1-.56-.17C6.5 17.7 2.5 14.3 2.5 9.65A5.65 5.65 0 0 1 8.15 4c1.5 0 2.85.55 3.85 1.5A5.6 5.6 0 0 1 15.85 4a5.65 5.65 0 0 1 5.65 5.65c0 4.65-4 8.05-8.94 11.38a1 1 0 0 1-.56.17z" />,
  },
  chat: {
    outline: <><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7.5a3 3 0 0 1-3 3h-6.2l-4.15 3.2A.9.9 0 0 1 5.2 20v-2.55A3 3 0 0 1 4 14.5z" /><path d="M8.5 9.75h7M8.5 13h4.5" /></>,
    solid: <path fillRule="evenodd" d="M7 3a4 4 0 0 0-4 4v7.5a4 4 0 0 0 1.2 2.86V20a1.9 1.9 0 0 0 3.06 1.5l3.88-3h5.86a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4zm1.5 6a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5zm0 3.25a.75.75 0 0 0 0 1.5H13a.75.75 0 0 0 0-1.5z" />,
  },
  user: {
    outline: <><circle cx="12" cy="8.25" r="3.75" /><path d="M4.75 20.25c.55-3.6 3.5-5.75 7.25-5.75s6.7 2.15 7.25 5.75" /></>,
    solid: <><circle cx="12" cy="8.25" r="4.5" /><path d="M3.8 20.1C4.45 15.9 7.85 13.5 12 13.5s7.55 2.4 8.2 6.6a1 1 0 0 1-.99 1.15H4.79a1 1 0 0 1-.99-1.15z" /></>,
  },
};
export default function TabIcon({ name, active = false, size = 24 }: { name: Name; active?: boolean; size?: number }) {
  const shape = shapes[name];
  return active
    ? <svg className="kzTabIcon on" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">{shape.solid}</svg>
    : <svg className="kzTabIcon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shape.outline}</svg>;
}
