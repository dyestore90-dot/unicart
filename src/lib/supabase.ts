// src/lib/supabase.ts

// This is a "Universal Mock" that handles any Supabase call without crashing
const mockChain = {
  select: () => mockChain,
  eq: () => mockChain,
  order: () => mockChain,
  limit: () => mockChain,
  single: () => Promise.resolve({ data: { id: 'mock-id' }, error: null }),
  maybeSingle: () =>ybPromise.resolve({ data: null, error: null }),
  insert: () => mockChain,
  update: () => mockChain,
  delete: () => mockChain,
  // This makes the object "awaitable" and returns an empty list by default
  then: (resolve: any) => resolve({ data: [], error: null })
};

export const supabase = {
  from: () => mockChain
};
