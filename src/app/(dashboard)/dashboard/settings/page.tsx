import { currentUser } from "@clerk/nextjs/server";
import { SettingsClient } from "@/components/settings";
import { ensureDefaultAccounts, getAccounts } from "@/actions/accounts";

export default async function SettingsPage() {
  await ensureDefaultAccounts();

  const [user, accountsResult] = await Promise.all([
    currentUser(),
    getAccounts(),
  ]);

  return (
    <SettingsClient
      user={{
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        email: user?.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: user?.imageUrl ?? null,
      }}
      accounts={accountsResult.success ? (accountsResult.data ?? []) : []}
    />
  );
}
