import EmptyArt from "./EmptyArt";
export function WalletActivity(){
 return <section className="walletPanel kzEmptyState"><h2>Əməliyyat tarixçəsi</h2><EmptyArt kind="history" /><strong>Hələ əməliyyat yoxdur</strong><p>Balans yükləmə və saytdaxili ödənişlər qoşulandan sonra hər əməliyyat burada görünəcək.</p></section>;
}
export function SavedCards(){return <section className="walletPanel kzEmptyState"><h2>Mənim kartlarım</h2><EmptyArt kind="card" /><strong>Kart əlavə etmək hələ mümkün deyil</strong><p>Ödəniş sistemi qoşulandan sonra kartınızı burada təhlükəsiz saxlaya biləcəksiniz.</p></section>;}
