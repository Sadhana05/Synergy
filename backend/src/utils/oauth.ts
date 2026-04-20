import axios from 'axios';

export interface OAuthUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar_url?: string;
  provider: 'google' | 'github';
}

/**
 * Verify Google OAuth Token
 */
export async function verifyGoogleToken(token: string): Promise<OAuthUser> {
  try {
    const response = await axios.get('https://oauth2.googleapis.com/tokeninfo?id_token=' + token);
    
    if (!response.data.email_verified) {
      throw new Error('Email not verified');
    }

    const nameParts = (response.data.name || '').split(' ');
    const username = response.data.email.split('@')[0];

    return {
      id: response.data.sub,
      email: response.data.email,
      username: username,
      name: response.data.name,
      avatar_url: response.data.picture,
      provider: 'google',
    };
  } catch (error) {
    throw new Error(`Failed to verify Google token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Exchange GitHub Code for Access Token
 */
export async function getGitHubAccessToken(code: string, clientId: string, clientSecret: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error_description || 'Failed to get access token');
    }

    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to exchange GitHub code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get GitHub User Info using Access Token
 */
export async function getGitHubUser(accessToken: string): Promise<OAuthUser> {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      id: response.data.id.toString(),
      email: response.data.email || response.data.login + '@github.com',
      username: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url,
      provider: 'github',
    };
  } catch (error) {
    throw new Error(`Failed to get GitHub user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
