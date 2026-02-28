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
 * Ensure user exists in database (sync from Clerk)
 * Also migrates data from old user IDs (e.g. after switching from
 * Clerk dev keys to production keys) by matching on email address.
 */
export async function syncUser() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  const user = await db.user.upsert({
    where: { id: clerkUser.id },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      id: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
  });

  // ---- Migrate data from old user IDs (dev→prod Clerk switch) ----
  // Find other User records with the same email but a different id.
  // This happens when user previously used Clerk dev keys — those records
  // have a different userId. We transfer all their data to the current user
  // so nothing is lost.
  try {
    const oldUsers = await db.user.findMany({
      where: {
        email,
        id: { not: clerkUser.id },
      },
    });

    for (const oldUser of oldUsers) {
      const oldId = oldUser.id;
      const newId = clerkUser.id;

      // Transfer all related records in a transaction.
      // HabitLogs don't need updating (they reference habitId, not userId).
      // MoodEntry has a unique constraint on [userId, date] so we handle
      // conflicts by deleting old-user duplicates first.
      await db.$transaction(async (tx) => {
        // 1. Delete mood entries from old user where current user already
        //    has an entry for the same date (unique constraint protection)
        const currentMoods = await tx.moodEntry.findMany({
          where: { userId: newId },
          select: { date: true },
        });
        const currentMoodDates = new Set(
          currentMoods.map((m) => m.date.toISOString())
        );
        const oldMoods = await tx.moodEntry.findMany({
          where: { userId: oldId },
          select: { id: true, date: true },
        });
        const conflictingMoodIds = oldMoods
          .filter((m) => currentMoodDates.has(m.date.toISOString()))
          .map((m) => m.id);
        if (conflictingMoodIds.length > 0) {
          await tx.moodEntry.deleteMany({
            where: { id: { in: conflictingMoodIds } },
          });
        }

        // 2. Transfer all data to the new userId
        await tx.task.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await tx.habit.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await tx.expense.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await tx.note.updateMany({ where: { userId: oldId }, data: { userId: newId } });
        await tx.moodEntry.updateMany({ where: { userId: oldId }, data: { userId: newId } });

        // 3. Delete the old user record
        await tx.user.delete({ where: { id: oldId } });
      });

      console.log(`[syncUser] Migrated data from old user ${oldId} → ${newId}`);
    }
  } catch (migrationError) {
    // Log but don't break the app if migration fails
    console.error("[syncUser] Data migration error:", migrationError);
  }

  return user;
}
