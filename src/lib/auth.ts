import { NextRequest } from 'next/server';
import { verifyIdToken } from './firebase-admin';
import { UserRole } from '../server/models';

export interface AuthUser {
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const idToken = authHeader.substring(7);
  
  try {
    const decodedToken = await verifyIdToken(idToken);
    
    // Get custom claims for role
    const role = decodedToken.role as UserRole;
    if (!role) {
      throw new Error('User role not found in token claims');
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
      role,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function requireRole(allowedRoles: UserRole[]) {
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
