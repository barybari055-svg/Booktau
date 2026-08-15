import { createClient } from './supabase/client';

const supabase = createClient();

export function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '') || 'myshop';
}

// Checks the shops table and appends -2, -3, etc. until it finds a free slug,
// so two shops that simplify to the same name never collide.
export async function getUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let suffix = 2;
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase.from('shops').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return `${baseSlug}-${Date.now()}`;
}

export const DEFAULT_HOURS_TEMPLATE = [
  { day_key: 'mon', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'tue', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'wed', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'thu', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'fri', closed: false, open_time: '10:00', close_time: '19:00', lunch_start: '13:00', lunch_end: '14:00' },
  { day_key: 'sat', closed: false, open_time: '11:00', close_time: '17:00', lunch_start: null, lunch_end: null },
  { day_key: 'sun', closed: true, open_time: '10:00', close_time: '19:00', lunch_start: null, lunch_end: null },
];

export async function createShopForOwner(ownerId, { name, category }) {
  const baseSlug = slugify(name);
  const slug = await getUniqueSlug(baseSlug);

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .insert({ owner_id: ownerId, name: name.trim(), category, slug })
    .select()
    .single();

  if (shopError) return { shop: null, error: shopError };

  const hoursRows = DEFAULT_HOURS_TEMPLATE.map((h) => ({ ...h, shop_id: shop.id }));
  await supabase.from('shop_hours').insert(hoursRows);

  return { shop, error: null };
}
