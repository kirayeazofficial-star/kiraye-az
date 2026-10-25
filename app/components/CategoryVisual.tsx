const order=['property','car','motorcycle','villa','commercial','equipment','clothing','electric','photo','camping','bicycle','event'];
export default function CategoryVisual({id}:{id:string}){const index=Math.max(0,order.indexOf(id));return <span className="categoryVisual" aria-hidden="true" style={{backgroundPosition:`${(index%4)*100/3}% ${Math.floor(index/4)*50}%`}}/>;}
