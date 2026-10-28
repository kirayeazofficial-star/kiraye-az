// Shared by the wallet API and the promotion dialog. Prices are in AZN.
export type PromotionKind="bump"|"vip"|"premium";
export interface PromotionPlan{id:string;kind:PromotionKind;label:string;price:number;days?:number;bumps?:number}
export const PROMOTION_PLANS:PromotionPlan[]=[
  {id:"bump-3",kind:"bump",label:"3 dəfə (8 saatdan bir)",price:1.5,bumps:3},
  {id:"bump-9",kind:"bump",label:"9 dəfə (8 saatdan bir)",price:2,bumps:9},
  {id:"bump-15",kind:"bump",label:"15 dəfə (8 saatdan bir)",price:3,bumps:15},
  {id:"bump-30",kind:"bump",label:"30 dəfə (8 saatdan bir)",price:5,bumps:30},
  {id:"vip-1",kind:"vip",label:"1 gün",price:3,days:1},
  {id:"vip-5",kind:"vip",label:"5 gün",price:6,days:5},
  {id:"vip-15",kind:"vip",label:"15 gün",price:15,days:15},
  {id:"vip-30",kind:"vip",label:"30 gün",price:25,days:30},
  {id:"premium-1",kind:"premium",label:"1 gün",price:5,days:1},
  {id:"premium-5",kind:"premium",label:"5 gün",price:15,days:5},
  {id:"premium-15",kind:"premium",label:"15 gün",price:30,days:15},
  {id:"premium-30",kind:"premium",label:"30 gün",price:50,days:30},
];
export const formatAzn=(value:number|string)=>`${Number(value).toLocaleString("az-AZ",{minimumFractionDigits:2,maximumFractionDigits:2})} ₼`;
