jest.mock('../models/User');

const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('should call next() when valid token is provided', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = { _id: userId, name: 'John Doe', email: 'john@example.com', role: 'user' };

      req.headers.authorization = 'Bearer valid-token-here';
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token-here', 'secret');
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should use custom JWT_SECRET from environment', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = { _id: userId, name: 'John Doe' };
      process.env.JWT_SECRET = 'custom-secret-key';

      req.headers.authorization = 'Bearer token-123';
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('token-123', 'custom-secret-key');
      delete process.env.JWT_SECRET;
    });

    test('should return 401 when token verification fails', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when no token is provided', async () => {
      req.headers.authorization = undefined;

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when Authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    });

    test('should return 401 when Authorization header is malformed', async () => {
      req.headers.authorization = 'Bearer';

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    });

    test('should extract token correctly from Authorization header', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = { _id: userId };
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'secret');
    });

    test('should handle User.findById rejection', async () => {
      const userId = '507f1f77bcf86cd799439011';

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: userId });
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    });
  });

  describe('admin middleware', () => {
    test('should call next() when user is admin', () => {
      req.user = { _id: '123', role: 'admin', name: 'Admin User' };

      admin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not admin', () => {
      req.user = { _id: '123', role: 'user', name: 'Regular User' };

      admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user is not authenticated', () => {
      req.user = null;

      admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when user object does not exist', () => {
      // Explicitly no user property set

      admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized as an admin' });
    });

    test('should be case-sensitive for admin role', () => {
      req.user = { _id: '123', role: 'Admin', name: 'User' }; // Capital A

      admin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should work with admin user having additional properties', () => {
      req.user = {
        _id: '123',
        role: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        permissions: ['read', 'write', 'delete']
      };

      admin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
