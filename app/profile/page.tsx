import { Suspense } from "react";
import ProfileDashboard from "../components/ProfileDashboard";
export default function Profile() { return <Suspense fallback={null}><ProfileDashboard /></Suspense>; }
