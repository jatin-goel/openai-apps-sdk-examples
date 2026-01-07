import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/index.js";
import type { User } from "../types/index.js";

// In-memory user storage
const users = new Map<string, {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}>();

export class AuthService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static async generateToken(payload: { userId: string; username: string; email: string }): Promise<string> {
    const secret = config.jwt.secret || 'default-secret';
    const expiry = config.jwt.expiry || '7d';
    return new Promise((resolve, reject) => {
      try {
        const token = jwt.sign(payload, secret, { expiresIn: expiry });
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<any> {
    const secret = config.jwt.secret || 'default-secret';
    return jwt.verify(token, secret);
  }

  /**
   * Sign up a new user
   */
  static async signup(username: string, email: string, password: string) {
    // Validation
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if user already exists
    for (const user of users.values()) {
      if (user.username === username || user.email === email) {
        throw new Error("Username or email already exists");
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    
    users.set(id, {
      id,
      username,
      email,
      password_hash: passwordHash,
      created_at
    });

    // Generate JWT
    const token = await this.generateToken({
      userId: id,
      username,
      email
    });

    return {
      token,
      user: {
        id,
        username,
        email,
        createdAt: created_at,
      }
    };
  }

  /**
   * Login a user
   */
  static async login(username: string, password: string) {
    // Validation
    if (!username || !password) {
      throw new Error("Username and password are required");
    }

    // Find user
    let foundUser = null;
    for (const user of users.values()) {
      if (user.username === username) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      throw new Error("Invalid username or password");
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, foundUser.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    // Generate JWT
    const token = await this.generateToken({
      userId: foundUser.id,
      username: foundUser.username,
      email: foundUser.email
    });

    return {
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        createdAt: foundUser.created_at,
      }
    };
  }

  /**
   * Verify token and get user
   */
  static async verifyUserToken(token: string) {
    if (!token) {
      throw new Error("Token is required");
    }

    try {
      // Verify JWT
      const decoded = await this.verifyToken(token) as any;
      
      // Get user from memory
      const user = users.get(decoded.userId);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.created_at,
        }
      };
    } catch (error: any) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Get all users (admin function)
   */
  static async getAllUsers() {
    const allUsers = [];
    for (const user of users.values()) {
      allUsers.push({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        totalOrders: 0,
        paidOrders: 0,
        totalSpent: 0,
      });
    }
    return allUsers;
  }

  /**
   * Generate a random password
   */
  static generateRandomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Reset user password (admin function)
   */
  static async resetUserPassword(userId: string) {
    // Validation
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = users.get(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Generate new temporary password
    const newPassword = this.generateRandomPassword();
    const passwordHash = await this.hashPassword(newPassword);

    // Update user password
    user.password_hash = passwordHash;
    users.set(userId, user);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      temporaryPassword: newPassword,
      message: 'Password has been reset successfully'
    };
  }
}

export default AuthService;
