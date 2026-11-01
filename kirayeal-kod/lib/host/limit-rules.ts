import "server-only";
import {fixedLimitRules,type LimitRules} from "../limit-rules";

// The free-listing rule is fixed in code (see lib/limit-rules.ts); it is no longer edited from the panel.
export async function limitRules():Promise<LimitRules>{return fixedLimitRules;}
