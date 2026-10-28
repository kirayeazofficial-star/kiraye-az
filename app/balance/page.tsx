import { Suspense } from "react";
import ProfileDashboard from "../components/ProfileDashboard";
export default function Balance() { return <Suspense fallback={null}><ProfileDashboard balanceOnly /></Suspense>; }
