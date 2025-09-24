import { NextRequest } from 'next/server';

export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
  role: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser> {
  // Simplified authentication - for now, return a mock user
  // TODO: Implement proper authentication without Firebase
  return {
    uid: 'mock-user-id',
    email: 'user@example.com',
    name: 'Mock User',
    role: 'admin',
  };
}

export function requireRole(allowedRoles: string[]) {
  return (user: AuthUser) => {
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireConferente = requireRole(['conferente']);
export const requireAnyRole = requireRole(['admin', 'conferente']);

// Helper function to create API response with error handling
export function createApiResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Middleware wrapper for API routes
export function withAuth(
  handler: (request: NextRequest, user: AuthUser, ...args: any[]) => Promise<Response>,
  roleCheck?: (user: AuthUser) => void
) {
  return async (request: NextRequest, ...args: any[]): Promise<Response> => {
    try {
      const user = await authenticateRequest(request);
      
      if (roleCheck) {
        roleCheck(user);
      }
      
      return await handler(request, user, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return createErrorResponse(message, 401);
    }
  };
}
