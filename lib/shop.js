import { createClient } from './supabase/client';

const supabase = createClient();

// Shop + default working hours are created together, atomically, by the
// create_shop_with_defaults() database function -- see supabase/schema.sql.
// Previously this was two separate inserts from here with no error check on
// the second one; if it failed, a shop could end up with zero hours rows
// and no way to add them from the dashboard. Doing both in one DB
// transaction makes that impossible: it's all-or-nothing now.
export async function createShopForOwner({ name, category }) {
  const { data: shop, error } = await supabase
    .rpc('create_shop_with_defaults', { p_name: name.trim(), p_category: category })
    .single();

  return { shop, error };
}
