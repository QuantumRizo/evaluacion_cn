import { Client, Account, Databases, Query, Functions } from 'appwrite';
import { DB_ID } from './constants';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export { Query };

/**
 * Fetches all documents from a collection handling Appwrite's 100-document
 * per-request limit via cursor-based pagination.
 */
export async function fetchAllDocuments<T>(
  collectionId: string,
  queries: string[] = []
): Promise<T[]> {
  const all: T[] = [];
  const limit = 5000;
  let cursor: string | undefined;

  while (true) {
    const queryList: string[] = [
      ...queries,
      Query.limit(limit),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ];

    const result = await databases.listDocuments(DB_ID, collectionId, queryList);
    all.push(...(result.documents as unknown as T[]));

    if (result.documents.length < limit) break;
    cursor = result.documents[result.documents.length - 1].$id;
  }

  return all;
}
