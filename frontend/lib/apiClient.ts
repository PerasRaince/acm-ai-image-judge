import { supabase } from './supabaseClient';
import {
  Competition,
  Submission,
  Score,
  LeaderboardData,
  UserProfile
} from '../types';

const DEFAULT_PROD_API_URL = 'https://ai-judge-backend.onrender.com/api/v1';

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If running in browser on a production domain (e.g. Vercel), never point to localhost
    if (!isLocalhost && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return DEFAULT_PROD_API_URL;
    }
  }
  return envUrl || (process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : 'http://localhost:4000/api/v1');
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export const apiClient = {
  async signup(data: { email: string; password: string; display_name: string }): Promise<UserProfile> {
    const res = await fetch(`${getApiBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to create user account.');
    }
    return json.data.user;
  },

  async getMe(): Promise<UserProfile | null> {
    const headers = await getAuthHeaders();
    if (!headers['Authorization']) return null;

    const res = await fetch(`${getApiBaseUrl()}/auth/me`, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data.user;
  },

  async syncProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${getApiBaseUrl()}/auth/sync-profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update profile');
    }
    const json = await res.json();
    return json.data;
  },

  async deleteAccount(): Promise<void> {
    const headers = await getAuthHeaders();
    if (!headers['Authorization']) {
      throw new Error('You must be logged in to delete your account.');
    }

    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      method: 'DELETE',
      headers
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to delete account.');
    }
  },

  async listCompetitions(params?: { status?: string; host_id?: string; organizer_id?: string }): Promise<Competition[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.host_id || params?.organizer_id) {
      query.append('host_id', params.host_id || params.organizer_id || '');
    }

    const res = await fetch(`${getApiBaseUrl()}/competitions?${query.toString()}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch competitions');
    }
    const json = await res.json();
    return json.data;
  },

  async getCompetition(id: string): Promise<Competition> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/competitions/${id}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch competition');
    }
    const json = await res.json();
    return json.data;
  },

  async getCompetitionByCode(code: string): Promise<Competition> {
    const headers = await getAuthHeaders();
    const cleanCode = encodeURIComponent(code.trim().toLowerCase());
    const res = await fetch(`${getApiBaseUrl()}/competitions/code/${cleanCode}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to find competition by code');
    }
    const json = await res.json();
    return json.data;
  },

  async createCompetition(formData: FormData): Promise<Competition> {
    const headers = await getAuthHeaders();
    // Do not set Content-Type header when sending FormData (browser sets boundary)
    const res = await fetch(`${getApiBaseUrl()}/competitions`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create competition');
    }
    const json = await res.json();
    return json.data;
  },

  async updateCompetition(id: string, data: Partial<Competition>): Promise<Competition> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${getApiBaseUrl()}/competitions/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update competition');
    }
    const json = await res.json();
    return json.data;
  },

  async joinCompetition(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/competitions/${id}/join`, {
      method: 'POST',
      headers
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to join competition');
    }
  },

  async joinCompetitionByCode(code: string): Promise<{ competition: Competition; participant: any; alreadyJoined: boolean }> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${getApiBaseUrl()}/competitions/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to join competition with code');
    }
    const json = await res.json();
    return json.data;
  },

  async listJoinedCompetitions(): Promise<Competition[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/competitions/user/joined`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch joined competitions');
    }
    const json = await res.json();
    return json.data;
  },

  async submitRecreation(competitionId: string, formData: FormData): Promise<{ submission: Submission; score: Score }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/competitions/${competitionId}/submissions`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to submit recreation');
    }
    const json = await res.json();
    return json.data;
  },

  async getLeaderboard(competitionId: string): Promise<LeaderboardData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/competitions/${competitionId}/leaderboard`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch leaderboard');
    }
    const json = await res.json();
    return json.data;
  },

  async listSubmissions(params?: { competition_id?: string; participant_id?: string }): Promise<Submission[]> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.competition_id) query.append('competition_id', params.competition_id);
    if (params?.participant_id) query.append('participant_id', params.participant_id);

    const res = await fetch(`${getApiBaseUrl()}/submissions?${query.toString()}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch submissions');
    }
    const json = await res.json();
    return json.data;
  },

  async getSubmission(id: string): Promise<Submission> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${getApiBaseUrl()}/submissions/${id}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch submission');
    }
    const json = await res.json();
    return json.data;
  },

  // --------------------------------------------------------------------------
  // Admin Storage & Maintenance Operations
  // --------------------------------------------------------------------------
  async getAdminStats(adminKey?: string): Promise<{
    database: { competitions: number; submissions: number; scores: number; users: number };
    storage: { submission_images_count: number; reference_images_count: number; total_images_count: number; approx_storage_mb: number; provider: string };
  }> {
    const headers = await getAuthHeaders();
    if (adminKey) headers['x-admin-key'] = adminKey;

    const res = await fetch(`${getApiBaseUrl()}/admin/stats`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error?.message || 'Failed to fetch admin stats');
    }
    return res.json();
  },

  async purgeSubmissionImages(adminKey?: string): Promise<{ success: boolean; files_deleted: number; message: string }> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    if (adminKey) headers['x-admin-key'] = adminKey;

    const res = await fetch(`${getApiBaseUrl()}/admin/purge-submission-images`, {
      method: 'POST',
      headers
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Failed to purge submission images');
    }
    return json;
  },

  async purgeAllSubmissions(adminKey?: string): Promise<{ success: boolean; files_deleted: number; message: string }> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    if (adminKey) headers['x-admin-key'] = adminKey;

    const res = await fetch(`${getApiBaseUrl()}/admin/purge-all-submissions`, {
      method: 'POST',
      headers
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Failed to wipe submissions');
    }
    return json;
  },

  async promoteUser(email: string, role: string = 'admin', adminKey?: string): Promise<{ success: boolean; message: string }> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    if (adminKey) headers['x-admin-key'] = adminKey;

    const res = await fetch(`${getApiBaseUrl()}/admin/promote-user`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, role })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || json.error?.message || 'Failed to update user role');
    }
    return json;
  },

  async verifyAdminKey(adminKey: string): Promise<{ authorized: boolean; role?: string }> {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    headers['x-admin-key'] = adminKey;

    const res = await fetch(`${getApiBaseUrl()}/admin/verify-key`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ adminKey })
    });
    return res.json();
  }
};
