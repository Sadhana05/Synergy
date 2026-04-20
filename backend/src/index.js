app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and new password are required' }
      });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long' }
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 8);

    // Update password
    user.password_hash = passwordHash;
    user.updated_at = new Date();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reset password' }
    });
  }
});