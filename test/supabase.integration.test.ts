import { afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const integrationConfigured = Boolean(supabaseUrl && publishableKey && serviceRoleKey);
const integration = describe.skipIf(!integrationConfigured);
const createdUserIds: string[] = [];

const makeClient = (key: string) => createClient(supabaseUrl!, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const unique = crypto.randomUUID();
const password = `TaskFlow-${unique}-Aa9!`;
const accounts = ["owner-a", "owner-b"].map((label) => ({
  email: `taskflow-integration-${unique}-${label}@example.com`,
  password,
}));

async function createSignedInUser(account: (typeof accounts)[number]): Promise<SupabaseClient> {
  const admin = makeClient(serviceRoleKey!);
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });
  if (error) throw error;
  createdUserIds.push(data.user.id);

  const client = makeClient(publishableKey!);
  const { error: signInError } = await client.auth.signInWithPassword(account);
  if (signInError) throw signInError;
  return client;
}

afterAll(async () => {
  if (!integrationConfigured) return;
  const admin = makeClient(serviceRoleKey!);
  await Promise.all(createdUserIds.map(async (id) => {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }));
});

integration("Supabase production integration", () => {
  it("has email signup enabled, requires confirmation, and supports login/logout", async () => {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: publishableKey! },
    });
    expect(response.ok).toBe(true);
    const settings = await response.json() as {
      disable_signup?: boolean;
      mailer_autoconfirm?: boolean;
      external?: { email?: boolean };
    };
    expect(settings.disable_signup).toBe(false);
    expect(settings.external?.email).toBe(true);
    expect(settings.mailer_autoconfirm).toBe(false);

    const account = {
      ...accounts[0]!,
      email: accounts[0]!.email.replace("@", `-${crypto.randomUUID()}@`),
    };
    const client = await createSignedInUser(account);
    const { error: signOutError } = await client.auth.signOut();
    expect(signOutError).toBeNull();
    const { data, error } = await client.auth.signInWithPassword(account);
    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
  });

  it("runs real CRUD under RLS and isolates two authenticated users", async () => {
    const testAccounts = accounts.map((account) => ({
      ...account,
      email: account.email.replace("@", `-${crypto.randomUUID()}@`),
    }));
    const [owner, other] = await Promise.all(testAccounts.map(createSignedInUser));
    const { data: ownerData, error: ownerError } = await owner.auth.getUser();
    expect(ownerError).toBeNull();
    expect(ownerData.user?.id).toBeTruthy();
    const { data: created, error: createError } = await owner.from("tasks")
      .insert({ user_id: ownerData.user!.id, title: `integration-${unique}`, priority: "alta" })
      .select("id,user_id,title,status")
      .single();
    expect(createError).toBeNull();
    expect(created?.user_id).toBeTruthy();

    const { data: read, error: readError } = await owner.from("tasks")
      .select("id,title").eq("id", created!.id).single();
    expect(readError).toBeNull();
    expect(read?.title).toBe(`integration-${unique}`);

    const { data: updated, error: updateError } = await owner.from("tasks")
      .update({ title: `updated-${unique}` }).eq("id", created!.id)
      .select("id,title").single();
    expect(updateError).toBeNull();
    expect(updated?.title).toBe(`updated-${unique}`);

    const { data: foreignRead, error: foreignReadError } = await other.from("tasks")
      .select("id").eq("id", created!.id);
    expect(foreignReadError).toBeNull();
    expect(foreignRead).toEqual([]);

    const { data: foreignUpdate, error: foreignUpdateError } = await other.from("tasks")
      .update({ title: "should-not-change" }).eq("id", created!.id).select("id");
    expect(foreignUpdateError).toBeNull();
    expect(foreignUpdate).toEqual([]);

    const { data: foreignDelete, error: foreignDeleteError } = await other.from("tasks")
      .delete().eq("id", created!.id).select("id");
    expect(foreignDeleteError).toBeNull();
    expect(foreignDelete).toEqual([]);

    const { data: otherUserData, error: otherUserError } = await other.auth.getUser();
    expect(otherUserError).toBeNull();
    expect(otherUserData.user?.id).toBeTruthy();
    const { error: spoofError } = await owner.from("tasks")
      .insert({ user_id: otherUserData.user!.id, title: `spoof-${unique}` });
    expect(spoofError).not.toBeNull();

    const { data: deleted, error: deleteError } = await owner.from("tasks")
      .delete().eq("id", created!.id).select("id").single();
    expect(deleteError).toBeNull();
    expect(deleted?.id).toBe(created!.id);
  });
});
