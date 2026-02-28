import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Get the current user from the database, creating if doesn't exist
 * Call this in server components/actions when you need the user record
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Try to get existing user
  let user = await db.user.findUnique({
    where: { id: userId },
  });

  // If user doesn't exist, create from Clerk data
  if (!user) {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    user = await db.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    });
  }

  return user;
}

/**
 * Ensure user exists in database (sync from Clerk).
 * Also migrates data from old user IDs (e.g. after switching from
 * Clerk dev keys to production keys) by matching on email address.
 *
 * Key ordering: we must migrate BEFORE creating the new user because
 * email has a @unique constraint — the old user already occupies that
 * email, so an upsert/create for the new user would fail.
 */
export async function syncUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const newId = clerkUser.id;

  // Fast path: user already exists with current Clerk ID
  const existingUser = await db.user.findUnique({ where: { id: newId } });
  if (existingUser) {
    // Just update profile info
    return db.user.update({
      where: { id: newId },
      data: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
    });
  }

  // ---- Check for old user with same email (dev→prod Clerk switch) ----
  // The old User record holds the @unique email, so we MUST free it
  // before we can create the new User record.
  const oldUser = await db.user.findUnique({ where: { email } });

  if (oldUser && oldUser.id !== newId) {
    const oldId = oldUser.id;

    try {
      // 1. Temporarily change old user's email to release the unique constraint
      await db.user.update({
        where: { id: oldId },
        data: { email: `migrated_${oldId}` },
      });

      // 2. Create the new user (email is now available)
      await db.user.create({
        data: {
          id: newId,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });

      // 3. Transfer all data from old user to new user
      await db.task.updateMany({
        where: { userId: oldId },
        data: { userId: newId },
      });
      await db.habit.updateMany({
        where: { userId: oldId },
        data: { userId: newId },
      });
      await db.expense.updateMany({
        where: { userId: oldId },
        data: { userId: newId },
      });
      await db.note.updateMany({
        where: { userId: oldId },
        data: { userId: newId },
      });
      await db.moodEntry.updateMany({
        where: { userId: oldId },
        data: { userId: newId },
      });

      // 4. Delete the old user record (all data has been moved)
      await db.user.delete({ where: { id: oldId } });

      console.log(`[syncUser] Migrated data from old user ${oldId} → ${newId}`);

      return db.user.findUnique({ where: { id: newId } });
    } catch (migrationError) {
      console.error("[syncUser] Data migration error:", migrationError);
      // If migration failed partway, the new user might already exist
      const fallback = await db.user.findUnique({ where: { id: newId } });
      if (fallback) return fallback;
      return null;
    }
  }

  // No old user conflict — just create the new user
  const user = await db.user.create({
    data: {
      id: newId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return user;
}
