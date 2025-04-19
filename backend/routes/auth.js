const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { sendMfaCode } = require('../services/emailService');
const bcrypt = require('bcrypt');
const { createAuditLog } = require('../controllers/auditLogController');
const passport = require('../config/googleAuth');

// Admin login route
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Check if credentials match admin credentials
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      await createAuditLog(
        'unknown',
        email,
        'admin_login',
        'Invalid admin credentials',
        ipAddress,
        userAgent,
        'failure'
      );
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate admin token
    const token = jwt.sign(
      { 
        userId: 'admin',
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await createAuditLog(
      'admin',
      email,
      'admin_login',
      'Admin login successful',
      ipAddress,
      userAgent,
      'success'
    );

    res.json({
      success: true,
      token,
      user: {
        id: 'admin',
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Generate a random 6-digit code
const generateMfaCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('user-agent');

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Prevent creating admin users through signup
        if (role === 'admin') {
            return res.status(403).json({ message: 'Cannot create admin users through signup' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await createAuditLog(
                'unknown',
                email,
                'signup',
                'Email already registered',
                ipAddress,
                userAgent,
                'failure'
            );
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            role,
            permissions: ['read', 'write']
        });

        await user.save();
        logger.info(`New user registered: ${email}`);

        await createAuditLog(
            user._id.toString(),
            user.email,
            'signup',
            'Account created successfully',
            ipAddress,
            userAgent,
            'success'
        );

        // Generate token for immediate login
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mfaEnabled: false
            }
        });
    } catch (error) {
        logger.error('Signup error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Find user and explicitly select MFA fields
    const user = await User.findOne({ email }).select('+mfaCode +mfaCodeExpires');
    if (!user) {
      await createAuditLog(
        'unknown',
        email,
        'login',
        'Invalid credentials',
        ipAddress,
        userAgent,
        'failure'
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await createAuditLog(
        user._id.toString(),
        user.email,
        'login',
        'Invalid password',
        ipAddress,
        userAgent,
        'failure'
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If MFA is enabled, generate and send code
    if (user.mfaEnabled) {
      const mfaCode = generateMfaCode();
      user.mfaCode = mfaCode;
      // Set expiration to 30 minutes from now
      user.mfaCodeExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      logger.info(`Generated MFA code for user ${user._id}, expires at ${user.mfaCodeExpires}`);
      await sendMfaCode(email, mfaCode);

      await createAuditLog(
        user._id.toString(),
        user.email,
        'login',
        'MFA code sent',
        ipAddress,
        userAgent,
        'success'
      );

      // Generate temporary token for MFA verification
      const tempToken = jwt.sign(
        { 
            userId: user._id,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '30m' } // Match the MFA code expiration
      );

      return res.json({
        success: true,
        message: 'MFA code sent to your email',
        mfaRequired: true,
        mfaEnabled: true,
        tempToken,
        expiresAt: user.mfaCodeExpires.toISOString(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: true
        }
      });
    } else {
      // Regular login without MFA
      const token = jwt.sign(
        { 
            userId: user._id,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await createAuditLog(
        user._id.toString(),
        user.email,
        'login',
        'Login successful',
        ipAddress,
        userAgent,
        'success'
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mfaEnabled: false
        }
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Resend MFA code route
router.post('/resend-mfa', async (req, res) => {
  try {
    const { tempToken, isOAuth } = req.body;
    
    // Verify temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    // Explicitly select MFA fields
    const user = await User.findById(decoded.userId).select('+mfaCode +mfaCodeExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new MFA code
    const mfaCode = generateMfaCode();
    user.mfaCode = mfaCode;
    // Set expiration to 15 minutes from now
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
    user.mfaCodeExpires = expirationTime;
    await user.save();

    // Generate new temporary token
    const newTempToken = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        isOAuth: isOAuth === 'true'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info(`Resent MFA code for user ${user._id}, expires at ${expirationTime}`);
    await sendMfaCode(user.email, mfaCode);

    // Create audit log for MFA code resend
    await createAuditLog(
      user._id.toString(),
      user.email,
      'mfa_resend',
      'MFA code resent',
      req.ip,
      req.get('user-agent'),
      'success'
    );

    res.json({ 
      message: 'New MFA code sent to your email',
      tempToken: newTempToken,
      expiresAt: expirationTime.toISOString()
    });
  } catch (error) {
    logger.error('Resend MFA error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid or expired temporary token',
        code: 'INVALID_TEMP_TOKEN'
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// MFA verification
router.post('/verify-mfa', async (req, res) => {
    try {
        const { code, tempToken, isOAuth } = req.body;
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        
        // Explicitly select MFA fields
        const user = await User.findById(decoded.userId).select('+mfaCode +mfaCodeExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if MFA code exists
        if (!user.mfaCode) {
            return res.status(401).json({ 
                message: 'No MFA code found. Please request a new code.',
                code: 'NO_MFA_CODE'
            });
        }

        // Check if MFA code has expired
        if (!user.mfaCodeExpires || new Date() > user.mfaCodeExpires) {
            logger.warn(`MFA code expired for user ${user._id}. Expired at: ${user.mfaCodeExpires}, Current time: ${new Date()}`);
            return res.status(401).json({ 
                message: 'Verification code expired',
                code: 'CODE_EXPIRED'
            });
        }

        // Verify MFA code
        if (code !== user.mfaCode) {
            return res.status(401).json({ 
                message: 'Invalid verification code',
                code: 'INVALID_CODE'
            });
        }

        // Clear MFA code and expiration
        user.mfaCode = undefined;
        user.mfaCodeExpires = undefined;
        await user.save();

        // Generate final access token with longer expiration
        const finalToken = jwt.sign(
            { 
                userId: user._id,
                role: user.role,
                email: user.email,
                name: user.name,
                isOAuth: isOAuth === 'true' // Include OAuth status in final token
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Extended to 7 days
        );

        // Create audit log for successful MFA verification
        await createAuditLog(
            user._id.toString(),
            user.email,
            'mfa_verification',
            'MFA verification successful',
            req.ip,
            req.get('user-agent'),
            'success'
        );

        res.json({
            success: true,
            message: 'MFA verification successful',
            token: finalToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mfaEnabled: true
            }
        });
    } catch (error) {
        logger.error('MFA verification error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid or expired temporary token',
                code: 'INVALID_TEMP_TOKEN'
            });
        }
        res.status(500).json({ message: 'Server error during MFA verification' });
    }
});

// Setup MFA
router.post('/setup-mfa', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate and send verification code
        const mfaCode = generateMfaCode();
        user.mfaCode = mfaCode;
        user.mfaCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        // Send verification code via email
        await sendMfaCode(user.email, mfaCode);

        logger.info(`MFA setup initiated for user: ${user._id}`);
        res.json({ 
            success: true,
            message: 'Verification code sent to your email',
            expiresAt: user.mfaCodeExpires.toISOString()
        });
    } catch (error) {
        logger.error('MFA setup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify and enable MFA
router.post('/verify-and-enable-mfa', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user.userId).select('+mfaCode +mfaCodeExpires');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if verification code exists and is valid
        if (!user.mfaCode || !user.mfaCodeExpires || new Date() > user.mfaCodeExpires) {
            return res.status(400).json({ 
                message: 'Verification code has expired. Please request a new code.',
                code: 'CODE_EXPIRED'
            });
        }

        // Verify the code
        if (code !== user.mfaCode) {
            return res.status(400).json({ 
                message: 'Invalid verification code',
                code: 'INVALID_CODE'
            });
        }

        // Enable MFA and clear verification code
        user.mfaEnabled = true;
        user.mfaCode = undefined;
        user.mfaCodeExpires = undefined;
        await user.save();

        logger.info(`MFA enabled for user: ${user._id}`);
        
        // Create audit log for MFA enable
        await createAuditLog(
            user._id.toString(),
            user.email,
            'enable_mfa',
            'MFA enabled successfully',
            req.ip,
            req.get('user-agent'),
            'success'
        );
        
        res.json({ 
            success: true,
            message: 'MFA enabled successfully' 
        });
    } catch (error) {
        logger.error('MFA verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Request MFA disable code
router.post('/request-disable-mfa', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate and send verification code
        const mfaCode = generateMfaCode();
        user.mfaCode = mfaCode;
        user.mfaCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        // Send verification code via email
        await sendMfaCode(user.email, mfaCode);

        logger.info(`MFA disable code sent to user: ${user._id}`);
        res.json({ 
            success: true,
            message: 'Verification code sent to your email',
            expiresAt: user.mfaCodeExpires.toISOString()
        });
    } catch (error) {
        logger.error('Error requesting MFA disable code:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify and disable MFA
router.post('/verify-and-disable-mfa', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user.userId).select('+mfaCode +mfaCodeExpires');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if verification code exists and is valid
        if (!user.mfaCode || !user.mfaCodeExpires || new Date() > user.mfaCodeExpires) {
            return res.status(400).json({ 
                message: 'Verification code has expired. Please request a new code.',
                code: 'CODE_EXPIRED'
            });
        }

        // Verify the code
        if (code !== user.mfaCode) {
            return res.status(400).json({ 
                message: 'Invalid verification code',
                code: 'INVALID_CODE'
            });
        }

        // Disable MFA and clear verification code
        user.mfaEnabled = false;
        user.mfaCode = undefined;
        user.mfaCodeExpires = undefined;
        await user.save();

        logger.info(`MFA disabled for user: ${user._id}`);
        
        // Create audit log for MFA disable
        await createAuditLog(
            user._id.toString(),
            user.email,
            'disable_mfa',
            'MFA disabled successfully',
            req.ip,
            req.get('user-agent'),
            'success'
        );
        
        res.json({ 
            success: true,
            message: 'MFA disabled successfully' 
        });
    } catch (error) {
        logger.error('Error disabling MFA:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get MFA status
router.get('/mfa/status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            mfaEnabled: user.mfaEnabled || false
        });
    } catch (error) {
        logger.error('Error fetching MFA status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete account
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { mfaCode } = req.body

    // Find the user
    const user = await User.findById(userId).select('+mfaCode +mfaCodeExpires')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // If MFA is enabled, verify the code
    if (user.mfaEnabled) {
      // Check if MFA code is provided
      if (!mfaCode) {
        return res.status(400).json({ 
          message: 'MFA verification required',
          code: 'MFA_REQUIRED'
        })
      }

      // Check if MFA code exists
      if (!user.mfaCode) {
        return res.status(401).json({ 
          message: 'No MFA code found. Please request a new code.',
          code: 'NO_MFA_CODE'
        })
      }

      // Check if MFA code has expired
      if (!user.mfaCodeExpires || new Date() > user.mfaCodeExpires) {
        logger.warn(`MFA code expired for user ${user._id}. Expired at: ${user.mfaCodeExpires}, Current time: ${new Date()}`)
        return res.status(401).json({ 
          message: 'Verification code expired',
          code: 'CODE_EXPIRED'
        })
      }

      // Verify MFA code
      if (mfaCode !== user.mfaCode) {
        return res.status(401).json({ 
          message: 'Invalid verification code',
          code: 'INVALID_CODE'
        })
      }
    }

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId)
    
    // Create audit log for account deletion
    await createAuditLog(
      userId,
      user.email,
      'delete_account',
      'Account deleted successfully',
      req.ip,
      req.get('user-agent'),
      'success'
    )

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    logger.error('Delete account error:', error)
    res.status(500).json({ message: 'Error deleting account' })
  }
})

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const user = req.user;
            
            // Create audit log for OAuth login
            await createAuditLog(
                user._id.toString(),
                user.email,
                'oauth_login',
                'Google OAuth login successful',
                req.ip,
                req.get('user-agent'),
                'success'
            );
            
            // If MFA is enabled, generate a temporary token and send MFA code
            if (user.mfaEnabled) {
                const mfaCode = generateMfaCode();
                user.mfaCode = mfaCode;
                user.mfaCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
                await user.save();

                // Generate temporary token for MFA verification
                const tempToken = jwt.sign(
                    { 
                        userId: user._id,
                        role: user.role,
                        email: user.email,
                        name: user.name,
                        isOAuth: true // Add flag to indicate OAuth login
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '15m' }
                );

                await sendMfaCode(user.email, mfaCode);

                // Store MFA data in session
                req.session.mfaEmail = user.email;
                req.session.tempToken = tempToken;

                // Redirect to frontend with temporary token
                res.redirect(`http://localhost:5173/verify-mfa?tempToken=${tempToken}&isOAuth=true`);
            } else {
                // Generate final token for non-MFA users
                const token = jwt.sign(
                    { 
                        userId: user._id,
                        role: user.role,
                        email: user.email,
                        name: user.name
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                // Redirect to frontend with token
                res.redirect(`http://localhost:5173/auth-success?token=${token}`);
            }
        } catch (error) {
            logger.error('OAuth callback error:', error);
            res.redirect('http://localhost:5173/login?error=oauth_failed');
        }
    }
);

// Request MFA code for account deletion
router.post('/request-delete-mfa', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if MFA is enabled
    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this account' })
    }

    // Generate and send verification code
    const mfaCode = generateMfaCode()
    user.mfaCode = mfaCode
    // Set expiration to 15 minutes from now
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000)
    user.mfaCodeExpires = expirationTime
    await user.save()

    logger.info(`Delete account MFA code sent to user ${user._id}, expires at ${expirationTime}`)
    await sendMfaCode(user.email, mfaCode)

    // Create audit log for MFA code request
    await createAuditLog(
      user._id.toString(),
      user.email,
      'delete_account_mfa_request',
      'MFA code requested for account deletion',
      req.ip,
      req.get('user-agent'),
      'success'
    )

    res.json({ 
      message: 'Verification code sent to your email',
      expiresAt: expirationTime.toISOString()
    })
  } catch (error) {
    logger.error('Error requesting delete account MFA code:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router; 