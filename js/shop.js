/** CITY DRIVE — City Shop / cosmetics */
export const SHOP_ITEMS = [
  { id:'outfit_city', slot:'outfit', name:'City Starter Outfit', price:0, category:'OUTFITS', style:{shirt:0x244a7a,trousers:0x202634} },
  { id:'outfit_executive', slot:'outfit', name:'Executive Suit', price:1800, category:'OUTFITS', style:{shirt:0x151b2d,trousers:0x0d111b} },
  { id:'outfit_racer', slot:'outfit', name:'Street Racer Kit', price:3200, category:'OUTFITS', style:{shirt:0xb52b35,trousers:0x202020} },
  { id:'outfit_night', slot:'outfit', name:'Night Drive Jacket', price:2600, category:'OUTFITS', style:{shirt:0x4c2d7a,trousers:0x121827} },
  { id:'outfit_sport', slot:'outfit', name:'Global Sport Set', price:4200, category:'OUTFITS', style:{shirt:0x176b55,trousers:0x101a18} },
  { id:'shoes_city', slot:'shoes', name:'City Sneakers', price:0, category:'SHOES', style:{color:0x151515} },
  { id:'shoes_premium', slot:'shoes', name:'Premium Leather Shoes', price:1200, category:'SHOES', style:{color:0x4a2b18} },
  { id:'shoes_racer', slot:'shoes', name:'Racing Trainers', price:900, category:'SHOES', style:{color:0xeeeeee} },
  { id:'hair_classic', slot:'hair', name:'Classic Hair', price:0, category:'HAIR', style:{color:0x17120f} },
  { id:'hair_fade', slot:'hair', name:'Fresh Fade', price:700, category:'HAIR', style:{color:0x2c211b} },
  { id:'hair_silver', slot:'hair', name:'Silver Cut', price:1400, category:'HAIR', style:{color:0xb8bec8} },
  { id:'accessory_none', slot:'accessory', name:'No Accessory', price:0, category:'ACCESSORIES' },
  { id:'accessory_gold', slot:'accessory', name:'Gold Chain', price:1500, category:'ACCESSORIES' },
  { id:'accessory_shades', slot:'accessory', name:'Street Shades', price:850, category:'ACCESSORIES' }
];
export function getShopItem(id) { return SHOP_ITEMS.find(x => x.id === id) || null; }
