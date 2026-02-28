import { currentUser } from "@clerk/nextjs/server";
import { SettingsClient } from "@/components/settings";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <SettingsClient
      user={{
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        email: user?.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: user?.imageUrl ?? null,
      }}
    />
  );
}
