import crypto from 'node:crypto';
import { seedUser, seedSession } from './seed-helpers.js';
import { createUserData } from './test-factories.js';
import { testDb } from './db.js';
import { customers, users, sessions } from '../../src/db/schema.js';

/**
 * Creates a complete authenticated test environment with a user and active session.
 * This is optimized for authentication-dependent tests.
 *
 * @returns Object containing user and session data
 */
export async function createTestUserAndSession() {
  try {
    // Use a unique timestamp to avoid conflicts
    const timestamp = Date.now();
    const userData = createUserData({
      email: `tester-${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
    });

    // Insert the user and ensure we get the ID back
    const user = await seedUser(userData);

    if (!user?.id) {
      throw new Error('Failed to create test user: user.id is missing');
    }

    // Wait longer to ensure user is fully committed in the database
    // This helps prevent foreign key constraint violations
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Create session with the user ID
    const session = await seedSession(user.id);

    if (!session?.id) {
      throw new Error('Failed to create test session: session.id is missing');
    }

    // Wait briefly to ensure session is fully committed
    await new Promise((resolve) => setTimeout(resolve, 20));

    return { user, session };
  } catch (error) {
    console.error('Error creating test user and session:', error);
    throw error;
  }
}

/**
 * Creates a complete test environment with user, session, and customer.
 * This is a common pattern used in customer-related tests.
 *
 * @param customerData Optional override data for the customer
 * @returns Object containing user, session, and customer data
 */
export async function createTestUserWithCustomer(customerData = { name: 'Test Customer' }) {
  try {
    const { user, session } = await createTestUserAndSession();

    // Verify that user was created successfully before proceeding
    if (!user?.id) {
      throw new Error('Failed to create test user: user.id is missing');
    }

    const customer = await testDb
      .insert(customers)
      .values({
        userId: user.id,
        name: customerData.name,
        // Add any other fields needed for the customer
      })
      .returning();

    if (!customer || customer.length === 0) {
      throw new Error('Failed to create test customer');
    }

    return { user, session, customer: customer[0] };
  } catch (error) {
    console.error('Error creating test user with customer:', error);
    throw error;
  }
}

/**
 * Creates both a user and session in a single database transaction.
 * This ensures that both operations succeed or fail together, preventing foreign key issues.
 *
 * @returns Object containing the user and session data
 */
export async function createTestUserWithSessionTx() {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const email = `tester-${timestamp}-${randomSuffix}@example.com`;
    const name = `Test User ${timestamp}-${randomSuffix}`;
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

    // Use a raw SQL transaction to ensure both operations succeed or fail together
    const result = await testDb.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(users)
        .values({
          email,
          name,
        })
        .returning();

      if (!user?.id) {
        throw new Error('Failed to create test user: Missing ID in database response');
      }

      // Create session for the user
      const [session] = await tx
        .insert(sessions)
        .values({
          id: sessionId,
          userId: user.id,
          createdAt: now,
          lastAccessedAt: now,
          expiresAt,
        })
        .returning();

      return { user, session };
    });

    // Log success for debugging
    console.log(
      `Successfully created user and session in transaction: userId=${result.user.id}, sessionId=${result.session.id}`
    );

    return result;
  } catch (error) {
    console.error('Error creating user and session in transaction:', error);
    throw error;
  }
}
