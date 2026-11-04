import NavigationIcon from "./NavigationIcon";
export default function UserAvatar({src,name,className=""}:{src?:string|null;name?:string;className?:string}){
 return <span className={`kzUserAvatar ${className}`} aria-hidden="true">{src?<img src={src} alt=""/>:name?.trim()?<b>{name.trim().charAt(0).toUpperCase()}</b>:<NavigationIcon name="account"/>}</span>;
}
