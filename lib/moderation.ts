export const rejectionReasons = [
 "Şəkillər elana uyğun deyil. Zəhmət olmasa düzgün şəkillər əlavə et.",
 "Elan yanlış kateqoriyada yerləşdirilib. Uyğun kateqoriyanı seç.",
 "Bu elan təkrar yerləşdirilib. Mövcud elanını redaktə et.",
 "Elan məlumatları natamamdır. Qiymət və kirayə şərtlərini dəqiqləşdir.",
 "Elanın məzmunu saytın qaydalarına uyğun deyil. Qaydaları nəzərdən keçir.",
];
export const moderationActions: Record<string,string> = {submitted:"Elan göndərildi",resubmitted:"Dəyişiklik təkrar yoxlamaya göndərildi",approved:"Təsdiqləndi",rejected:"Rədd edildi",edited:"Məlumat dəyişdirildi",status_changed:"Vəziyyət dəyişdirildi",deleted:"Elan silindi"};
export const moderationFields: Record<string,string> = {title:"Başlıq",description:"Təsvir",category:"Kateqoriya",city:"Şəhər",district:"Rayon",price:"Qiymət",rental_period:"Qiymət vahidi",contact:"Əlaqə nömrəsi",images:"Şəkillər",attributes:"Xüsusiyyətlər",deposit:"Depozit",min_days:"Minimum müddət",rooms:"Otaq sayı",area_m2:"Sahə",available_from:"Başlanğıc tarixi",available_until:"Son tarix"};
export type ModerationEvent = {id:number;listing_id:string;actor_id:string|null;actor_name:string|null;actor_kind:string;action:string;old_status:string|null;new_status:string|null;changed_fields:string[];before_values:Record<string,unknown>|null;after_values:Record<string,unknown>|null;reason:string|null;created_at:string};
export type ModerationContext = {
 owner:{id:string;name:string|null;joined_at:string};
 owner_listings:{id:string;title:string;status:string;rejection_reason:string|null;created_at:string}[];
 reports:{open:number;resolved:number};events:ModerationEvent[];
 signals:{id:string;title:string;owner_id:string;status:string;same_phone:boolean;same_image:boolean;similar_text:boolean}[];
};
