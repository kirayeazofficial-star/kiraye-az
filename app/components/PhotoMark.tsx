export default function PhotoMark({ src = "" }: { src?: string }) {
  return src.includes("/branded-") ? null : <span className="photoMark" aria-hidden="true">kirayeal.az</span>;
}
